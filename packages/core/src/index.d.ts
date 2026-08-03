/**
 * @rampkit/core — Public API
 *
 * Multi-Anchor Router SDK for Stellar.
 * Unified interface for fiat on/off-ramps via Etherfuse, Manteca, and Koywe.
 *
 * @example
 * ```typescript
 * import { RampRouter } from '@rampkit/core';
 *
 * const router = new RampRouter({
 *   network: 'testnet',
 *   anchors: {
 *     etherfuse: { apiKey: 'your-key', sandbox: true },
 *     manteca:   { apiKey: 'your-key', sandbox: true },
 *   },
 * });
 *
 * const quotes = await router.getQuotes({
 *   direction: 'on-ramp',
 *   sourceAsset: 'BRL',
 *   destAsset: 'USDC',
 *   amount: '100',
 *   country: 'BR',
 * });
 *
 * console.log(`Best rate: ${quotes[0].destAmount} USDC`);
 * ```
 *
 * @packageDocumentation
 */
export { RampRouter } from './router';
export type { AnchorId, FiatCurrency, CryptoAsset, Country, PaymentMethod, RampDirection, RampQuote, RampFees, PaymentDetails, QuoteRequest, QuoteStrategy, RampOrder, OrderStatus, ExecuteRampParams, Corridor, AnchorAsset, RampKitConfig, AnchorConfig, RampEvent, RampEventListener, } from './types';
export { BaseAnchorAdapter, RampAdapterError } from './adapters/base';
export { EtherfuseAdapter } from './adapters/etherfuse';
export { MantecaAdapter } from './adapters/manteca';
export { KoyweAdapter } from './adapters/koywe';
//# sourceMappingURL=index.d.ts.map