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

// ─── Main Router ──────────────────────────────────────────────
export { RampRouter } from './router';

// ─── Types ────────────────────────────────────────────────────
export type {
  // Identifiers
  AnchorId,
  FiatCurrency,
  CryptoAsset,
  Country,
  PaymentMethod,
  RampDirection,

  // Quotes
  RampQuote,
  RampFees,
  PaymentDetails,
  QuoteRequest,
  QuoteStrategy,

  // Orders
  RampOrder,
  OrderStatus,
  ExecuteRampParams,

  // Corridors & Assets
  Corridor,
  AnchorAsset,

  // Remittances
  RemittanceRequest,
  RemittanceQuote,

  // Configuration
  RampKitConfig,
  AnchorConfig,

  // Events
  RampEvent,
  RampEventListener,
} from './types';

// ─── Adapters (for advanced usage) ────────────────────────────
export { BaseAnchorAdapter, RampAdapterError } from './adapters/base';
export { EtherfuseAdapter } from './adapters/etherfuse';
export { MantecaAdapter } from './adapters/manteca';
export { KoyweAdapter } from './adapters/koywe';
