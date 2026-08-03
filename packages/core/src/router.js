"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RampRouter = void 0;
const etherfuse_1 = require("./adapters/etherfuse");
const manteca_1 = require("./adapters/manteca");
const koywe_1 = require("./adapters/koywe");
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
class RampRouter {
    adapters = new Map();
    config;
    listeners = [];
    constructor(config) {
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
    async getQuotes(params, strategy) {
        const targetAdapters = params.anchorIds
            ? params.anchorIds
                .map((id) => this.adapters.get(id))
                .filter(Boolean)
            : Array.from(this.adapters.values());
        // Query all adapters in parallel
        const quotePromises = targetAdapters.map(async (adapter) => {
            try {
                const quote = await adapter.getQuote(params);
                return quote;
            }
            catch (error) {
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
            .filter((q) => q !== null);
        // Sort by strategy
        const sorted = this.sortQuotes(quotes, strategy || this.config.defaultStrategy || 'cheapest');
        this.emit({ type: 'quote_received', quotes: sorted });
        return sorted;
    }
    /**
     * Get the single best quote for a given request.
     * Convenience wrapper around getQuotes().
     */
    async getBestQuote(params, strategy) {
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
    async executeRamp(quote, stellarAddress, options) {
        const adapter = this.adapters.get(quote.anchorId);
        if (!adapter) {
            throw new Error(`Anchor ${quote.anchorId} is not configured`);
        }
        // Check quote hasn't expired
        if (new Date() > quote.expiresAt) {
            throw new Error('Quote has expired. Please request a new quote.');
        }
        const params = {
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
    async getStatus(orderId, anchorId) {
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
        }
        else if (order.status === 'failed') {
            this.emit({ type: 'order_failed', order, error: order.statusMessage || 'Order failed' });
        }
        return order;
    }
    /**
     * Cancel an order (if supported by the anchor).
     */
    async cancelOrder(orderId, anchorId) {
        const adapter = this.adapters.get(anchorId);
        if (!adapter)
            return false;
        const anchorOrderId = orderId.replace(/^(ef_|ma_|ko_)/, '');
        return adapter.cancelOrder(anchorOrderId);
    }
    // ─── Discovery API ─────────────────────────────────────────
    /**
     * Get all supported corridors across all configured anchors.
     */
    getSupportedCorridors() {
        const corridors = [];
        for (const adapter of this.adapters.values()) {
            corridors.push(...adapter.getSupportedCorridors());
        }
        return corridors;
    }
    /**
     * Get corridors filtered by country.
     */
    getCorridorsByCountry(country) {
        return this.getSupportedCorridors().filter((c) => c.country === country);
    }
    /**
     * Get all available tokenized assets across all anchors.
     */
    async getAssets() {
        const assetPromises = Array.from(this.adapters.values()).map((adapter) => adapter.getAssets());
        const results = await Promise.allSettled(assetPromises);
        return results
            .filter((r) => r.status === 'fulfilled')
            .flatMap((r) => r.value);
    }
    /**
     * Get only yield-bearing assets (stablebonds like TESOURO).
     */
    async getYieldBearingAssets() {
        const assets = await this.getAssets();
        return assets.filter((a) => a.isYieldBearing);
    }
    /**
     * Get the list of configured anchor IDs.
     */
    getConfiguredAnchors() {
        return Array.from(this.adapters.keys());
    }
    /**
     * Check which anchors are currently available (health check).
     */
    async getAvailableAnchors() {
        const checks = Array.from(this.adapters.entries()).map(async ([id, adapter]) => {
            const available = await adapter.isAvailable();
            return available ? id : null;
        });
        const results = await Promise.all(checks);
        return results.filter((id) => id !== null);
    }
    // ─── Event System ───────────────────────────────────────────
    /**
     * Subscribe to router events (quote received, order created, etc.)
     */
    on(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter((l) => l !== listener);
        };
    }
    emit(event) {
        for (const listener of this.listeners) {
            try {
                listener(event);
            }
            catch {
                // Don't let listener errors break the router
            }
        }
    }
    // ─── Private Methods ────────────────────────────────────────
    initializeAdapters() {
        const { anchors } = this.config;
        if (anchors.etherfuse) {
            this.adapters.set('etherfuse', new etherfuse_1.EtherfuseAdapter({
                ...anchors.etherfuse,
                sandbox: this.config.network === 'testnet' ? true : anchors.etherfuse.sandbox,
            }));
        }
        if (anchors.manteca) {
            this.adapters.set('manteca', new manteca_1.MantecaAdapter({
                ...anchors.manteca,
                sandbox: this.config.network === 'testnet' ? true : anchors.manteca.sandbox,
            }));
        }
        if (anchors.koywe) {
            this.adapters.set('koywe', new koywe_1.KoyweAdapter({
                ...anchors.koywe,
                sandbox: this.config.network === 'testnet' ? true : anchors.koywe.sandbox,
            }));
        }
    }
    /**
     * Sort quotes by the selected strategy.
     */
    sortQuotes(quotes, strategy) {
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
exports.RampRouter = RampRouter;
//# sourceMappingURL=router.js.map