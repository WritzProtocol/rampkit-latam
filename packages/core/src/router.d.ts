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
import { RampKitConfig, AnchorId, RampQuote, RampOrder, QuoteRequest, ExecuteRampParams, QuoteStrategy, Corridor, AnchorAsset, RampEventListener } from './types';
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
export declare class RampRouter {
    private adapters;
    private config;
    private listeners;
    constructor(config: RampKitConfig);
    /**
     * Get quotes from ALL configured anchors for a given ramp request.
     * Queries anchors in parallel and returns sorted results.
     *
     * @param params - The quote request parameters
     * @param strategy - How to sort the results (default: cheapest)
     * @returns Array of quotes, sorted by strategy
     */
    getQuotes(params: QuoteRequest, strategy?: QuoteStrategy): Promise<RampQuote[]>;
    /**
     * Get the single best quote for a given request.
     * Convenience wrapper around getQuotes().
     */
    getBestQuote(params: QuoteRequest, strategy?: QuoteStrategy): Promise<RampQuote | null>;
    /**
     * Execute a ramp order using a specific quote.
     * Routes to the correct anchor based on the quote's anchorId.
     *
     * @param quote - The quote to execute (from getQuotes)
     * @param stellarAddress - User's Stellar wallet address (G...)
     * @param options - Additional user info (email, taxId, etc.)
     * @returns The created order with payment details
     */
    executeRamp(quote: RampQuote, stellarAddress: string, options?: Partial<Omit<ExecuteRampParams, 'quote' | 'stellarAddress'>>): Promise<RampOrder>;
    /**
     * Check the status of an existing order.
     *
     * @param orderId - The RampKit order ID (e.g., ef_123, ma_456)
     * @param anchorId - Which anchor to query
     */
    getStatus(orderId: string, anchorId: AnchorId): Promise<RampOrder>;
    /**
     * Cancel an order (if supported by the anchor).
     */
    cancelOrder(orderId: string, anchorId: AnchorId): Promise<boolean>;
    /**
     * Get all supported corridors across all configured anchors.
     */
    getSupportedCorridors(): Corridor[];
    /**
     * Get corridors filtered by country.
     */
    getCorridorsByCountry(country: string): Corridor[];
    /**
     * Get all available tokenized assets across all anchors.
     */
    getAssets(): Promise<AnchorAsset[]>;
    /**
     * Get only yield-bearing assets (stablebonds like TESOURO).
     */
    getYieldBearingAssets(): Promise<AnchorAsset[]>;
    /**
     * Get the list of configured anchor IDs.
     */
    getConfiguredAnchors(): AnchorId[];
    /**
     * Check which anchors are currently available (health check).
     */
    getAvailableAnchors(): Promise<AnchorId[]>;
    /**
     * Subscribe to router events (quote received, order created, etc.)
     */
    on(listener: RampEventListener): () => void;
    private emit;
    private initializeAdapters;
    /**
     * Sort quotes by the selected strategy.
     */
    private sortQuotes;
}
//# sourceMappingURL=router.d.ts.map