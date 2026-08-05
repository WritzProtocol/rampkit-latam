/**
 * @rampkit/core — RampRouter
 *
 * The smart routing engine that orchestrates quotes and orders
 * across multiple anchor adapters. This is the main entry point
 * for applications using the SDK.
 *
 * Usage:
 * ```typescript
 * import { RampRouter } from '@rampkit/core';
 *
 * const router = new RampRouter({
 *   network: 'testnet',
 *   anchors: {
 *     etherfuse: { apiKey: 'ef_...', sandbox: true },
 *     manteca:   { apiKey: 'ma_...', sandbox: true },
 *     koywe:     { apiKey: 'ko_...', sandbox: true },
 *   },
 * });
 *
 * // Get quotes from all anchors
 * const quotes = await router.getQuotes({
 *   direction: 'on-ramp',
 *   sourceAsset: 'BRL',
 *   destAsset: 'USDC',
 *   amount: '100',
 *   country: 'BR',
 * });
 *
 * // Execute the best quote
 * const order = await router.executeRamp(quotes[0], 'G...');
 * ```
 */

import { BaseAnchorAdapter } from './adapters/base';
import { EtherfuseAdapter } from './adapters/etherfuse';
import { MantecaAdapter } from './adapters/manteca';
import { KoyweAdapter } from './adapters/koywe';
import {
  RampKitConfig,
  AnchorId,
  RampQuote,
  RampOrder,
  QuoteRequest,
  ExecuteRampParams,
  QuoteStrategy,
  Corridor,
  AnchorAsset,
  RampEvent,
  RampEventListener,
  RemittanceRequest,
  RemittanceQuote,
} from './types';

/**
 * RampRouter — Multi-Anchor Routing Engine
 *
 * The core orchestrator that:
 * 1. Manages multiple anchor adapters
 * 2. Fetches quotes in parallel from all configured anchors
 * 3. Ranks quotes by strategy (cheapest, fastest, most reliable)
 * 4. Executes orders through the selected anchor
 * 5. Tracks order status across any anchor
 */
export class RampRouter {
  private adapters: Map<AnchorId, BaseAnchorAdapter> = new Map();
  private config: RampKitConfig;
  private listeners: RampEventListener[] = [];

  constructor(config: RampKitConfig) {
    this.config = config;
    this.initializeAdapters();
  }

  // ─── Core API ───────────────────────────────────────────────

  /**
   * Get quotes from ALL configured anchors for a given ramp request.
   * Queries anchors in parallel and returns sorted results.
   *
   * @param params - The quote request parameters
   * @param strategy - How to sort the results (default: cheapest)
   * @returns Array of quotes, sorted by strategy
   */
  async getQuotes(
    params: QuoteRequest,
    strategy?: QuoteStrategy,
  ): Promise<RampQuote[]> {
    const targetAdapters = params.anchorIds
      ? params.anchorIds
          .map((id) => this.adapters.get(id))
          .filter(Boolean) as BaseAnchorAdapter[]
      : Array.from(this.adapters.values());

    // Query all adapters in parallel
    const quotePromises = targetAdapters.map(async (adapter) => {
      try {
        const quote = await adapter.getQuote(params);
        return quote;
      } catch (error) {
        this.emit({
          type: 'error',
          error: error instanceof Error ? error.message : 'Quote failed',
          anchorId: adapter.anchorId,
        });
        return null;
      }
    });

    const results = await Promise.allSettled(quotePromises);
    const quotes = results
      .map((r) => (r.status === 'fulfilled' ? r.value : null))
      .filter((q): q is RampQuote => q !== null);

    // Sort by strategy
    const sorted = this.sortQuotes(quotes, strategy || this.config.defaultStrategy || 'cheapest');

    this.emit({ type: 'quote_received', quotes: sorted });
    return sorted;
  }

  /**
   * Get the single best quote for a given request.
   * Convenience wrapper around getQuotes().
   */
  async getBestQuote(
    params: QuoteRequest,
    strategy?: QuoteStrategy,
  ): Promise<RampQuote | null> {
    const quotes = await this.getQuotes(params, strategy);
    return quotes[0] || null;
  }

  /**
   * Execute a ramp order using a specific quote.
   * Routes to the correct anchor based on the quote's anchorId.
   *
   * @param quote - The quote to execute (from getQuotes)
   * @param stellarAddress - User's Stellar wallet address (G...)
   * @param options - Additional user info (email, taxId, etc.)
   * @returns The created order with payment details
   */
  async executeRamp(
    quote: RampQuote,
    stellarAddress: string,
    options?: Partial<Omit<ExecuteRampParams, 'quote' | 'stellarAddress'>>,
  ): Promise<RampOrder> {
    const adapter = this.adapters.get(quote.anchorId);
    if (!adapter) {
      throw new Error(`Anchor ${quote.anchorId} is not configured`);
    }

    // Check quote hasn't expired
    if (new Date() > quote.expiresAt) {
      throw new Error('Quote has expired. Please request a new quote.');
    }

    const params: ExecuteRampParams = {
      quote,
      stellarAddress,
      ...options,
    };

    const order = await adapter.executeOrder(params);
    this.emit({ type: 'order_created', order });
    return order;
  }

  /**
   * Check the status of an existing order.
   *
   * @param orderId - The RampKit order ID (e.g., ef_123, ma_456)
   * @param anchorId - Which anchor to query
   */
  async getStatus(orderId: string, anchorId: AnchorId): Promise<RampOrder> {
    const adapter = this.adapters.get(anchorId);
    if (!adapter) {
      throw new Error(`Anchor ${anchorId} is not configured`);
    }

    // Strip prefix to get anchor-native order ID
    const anchorOrderId = orderId.replace(/^(ef_|ma_|ko_)/, '');
    const order = await adapter.getOrderStatus(anchorOrderId);

    this.emit({ type: 'status_updated', order });

    if (order.status === 'completed') {
      this.emit({ type: 'order_completed', order });
    } else if (order.status === 'failed') {
      this.emit({ type: 'order_failed', order, error: order.statusMessage || 'Order failed' });
    }

    return order;
  }

  /**
   * Cancel an order (if supported by the anchor).
   */
  async cancelOrder(orderId: string, anchorId: AnchorId): Promise<boolean> {
    const adapter = this.adapters.get(anchorId);
    if (!adapter) return false;
    const anchorOrderId = orderId.replace(/^(ef_|ma_|ko_)/, '');
    return adapter.cancelOrder(anchorOrderId);
  }

  // ─── Remittance API ────────────────────────────────────────

  /**
   * Quote a cross-border remittance as a single route.
   *
   * A remittance is two ramps chained through a stablecoin: the sender's fiat is
   * on-ramped in their country, and the resulting stablecoin is off-ramped to the
   * recipient's fiat in theirs. Each leg is quoted independently across all
   * configured anchors, so the send and receive legs may resolve to different
   * providers — whichever is best for that corridor.
   *
   * @returns The composed route, or null if either corridor has no available quote
   */
  async getRemittanceQuote(
    params: RemittanceRequest,
    strategy?: QuoteStrategy,
  ): Promise<RemittanceQuote | null> {
    const bridgeAsset = params.bridgeAsset || 'USDC';

    const sendLeg = await this.getBestQuote(
      {
        direction: 'on-ramp',
        sourceAsset: params.fromCurrency,
        destAsset: bridgeAsset,
        amount: params.amount,
        country: params.fromCountry,
      },
      strategy,
    );
    if (!sendLeg) return null;

    // The second leg converts exactly what the first leg produced, net of its fees.
    const receiveLeg = await this.getBestQuote(
      {
        direction: 'off-ramp',
        sourceAsset: bridgeAsset,
        destAsset: params.toCurrency,
        amount: sendLeg.destAmount,
        country: params.toCountry,
      },
      strategy,
    );
    if (!receiveLeg) return null;

    const sendAmount = parseFloat(sendLeg.sourceAmount);
    const receiveAmount = parseFloat(receiveLeg.destAmount);

    // Second-leg fees are denominated in the bridge asset; convert to the
    // sender's currency via the first leg's rate so the total is one number.
    const sendLegRate = parseFloat(sendLeg.exchangeRate) || 1;
    const feesInSenderCurrency =
      parseFloat(sendLeg.fees.total) + parseFloat(receiveLeg.fees.total) / sendLegRate;

    return {
      sendLeg,
      receiveLeg,
      bridgeAsset,
      sendAmount: sendLeg.sourceAmount,
      receiveAmount: receiveLeg.destAmount,
      effectiveRate: (receiveAmount / sendAmount).toFixed(6),
      totalFees: feesInSenderCurrency.toFixed(2),
      totalFeePercentage: (feesInSenderCurrency / sendAmount) * 100,
      estimatedSeconds: sendLeg.estimatedSeconds + receiveLeg.estimatedSeconds,
      expiresAt: new Date(
        Math.min(sendLeg.expiresAt.getTime(), receiveLeg.expiresAt.getTime()),
      ),
    };
  }

  /**
   * Execute the send leg of a remittance.
   *
   * Only the first leg is executed here: it returns the payment instructions
   * (PIX QR, SPEI CLABE, etc.) the sender must satisfy. Once that order settles,
   * execute `quote.receiveLeg` via {@link executeRamp} to pay out the recipient.
   *
   * @param quote - The remittance route from {@link getRemittanceQuote}
   * @param stellarAddress - Stellar address that custodies the bridge asset between legs
   */
  async executeRemittance(
    quote: RemittanceQuote,
    stellarAddress: string,
    options?: Partial<Omit<ExecuteRampParams, 'quote' | 'stellarAddress'>>,
  ): Promise<RampOrder> {
    return this.executeRamp(quote.sendLeg, stellarAddress, options);
  }

  /**
   * List every remittance corridor the configured anchors can serve end-to-end.
   * A pair is viable when one anchor can on-ramp in the origin country and one
   * can off-ramp in the destination country.
   */
  getRemittanceCorridors(): Array<{ from: Corridor; to: Corridor }> {
    const corridors = this.getSupportedCorridors();
    const pairs: Array<{ from: Corridor; to: Corridor }> = [];

    for (const from of corridors) {
      if (!from.directions.includes('on-ramp')) continue;
      for (const to of corridors) {
        if (to.country === from.country) continue;
        if (!to.directions.includes('off-ramp')) continue;
        pairs.push({ from, to });
      }
    }
    return pairs;
  }

  // ─── Discovery API ─────────────────────────────────────────

  /**
   * Get all supported corridors across all configured anchors.
   */
  getSupportedCorridors(): Corridor[] {
    const corridors: Corridor[] = [];
    for (const adapter of this.adapters.values()) {
      corridors.push(...adapter.getSupportedCorridors());
    }
    return corridors;
  }

  /**
   * Get corridors filtered by country.
   */
  getCorridorsByCountry(country: string): Corridor[] {
    return this.getSupportedCorridors().filter((c) => c.country === country);
  }

  /**
   * Get all available tokenized assets across all anchors.
   */
  async getAssets(): Promise<AnchorAsset[]> {
    const assetPromises = Array.from(this.adapters.values()).map(
      (adapter) => adapter.getAssets(),
    );
    const results = await Promise.allSettled(assetPromises);
    return results
      .filter((r): r is PromiseFulfilledResult<AnchorAsset[]> => r.status === 'fulfilled')
      .flatMap((r) => r.value);
  }

  /**
   * Get only yield-bearing assets (stablebonds like TESOURO).
   */
  async getYieldBearingAssets(): Promise<AnchorAsset[]> {
    const assets = await this.getAssets();
    return assets.filter((a) => a.isYieldBearing);
  }

  /**
   * Get the list of configured anchor IDs.
   */
  getConfiguredAnchors(): AnchorId[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * Check which anchors are currently available (health check).
   */
  async getAvailableAnchors(): Promise<AnchorId[]> {
    const checks = Array.from(this.adapters.entries()).map(
      async ([id, adapter]) => {
        const available = await adapter.isAvailable();
        return available ? id : null;
      },
    );
    const results = await Promise.all(checks);
    return results.filter((id): id is AnchorId => id !== null);
  }

  // ─── Event System ───────────────────────────────────────────

  /**
   * Subscribe to router events (quote received, order created, etc.)
   */
  on(listener: RampEventListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private emit(event: RampEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        // Don't let listener errors break the router
      }
    }
  }

  // ─── Private Methods ────────────────────────────────────────

  private initializeAdapters(): void {
    const { anchors } = this.config;

    if (anchors.etherfuse) {
      this.adapters.set(
        'etherfuse',
        new EtherfuseAdapter({
          ...anchors.etherfuse,
          sandbox: this.config.network === 'testnet' ? true : anchors.etherfuse.sandbox,
        }),
      );
    }

    if (anchors.manteca) {
      this.adapters.set(
        'manteca',
        new MantecaAdapter({
          ...anchors.manteca,
          sandbox: this.config.network === 'testnet' ? true : anchors.manteca.sandbox,
        }),
      );
    }

    if (anchors.koywe) {
      this.adapters.set(
        'koywe',
        new KoyweAdapter({
          ...anchors.koywe,
          sandbox: this.config.network === 'testnet' ? true : anchors.koywe.sandbox,
        }),
      );
    }
  }

  /**
   * Sort quotes by the selected strategy.
   */
  private sortQuotes(quotes: RampQuote[], strategy: QuoteStrategy): RampQuote[] {
    return [...quotes].sort((a, b) => {
      switch (strategy) {
        case 'cheapest':
          // Higher destAmount = better deal for the user
          return parseFloat(b.destAmount) - parseFloat(a.destAmount);

        case 'fastest':
          return a.estimatedSeconds - b.estimatedSeconds;

        case 'most_reliable':
          // Prefer anchors with lower fee percentage (more transparent)
          return a.fees.percentage - b.fees.percentage;

        default:
          return parseFloat(b.destAmount) - parseFloat(a.destAmount);
      }
    });
  }
}
