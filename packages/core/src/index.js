"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.KoyweAdapter = exports.MantecaAdapter = exports.EtherfuseAdapter = exports.RampAdapterError = exports.BaseAnchorAdapter = exports.RampRouter = void 0;
// ─── Main Router ──────────────────────────────────────────────
var router_1 = require("./router");
Object.defineProperty(exports, "RampRouter", { enumerable: true, get: function () { return router_1.RampRouter; } });
// ─── Adapters (for advanced usage) ────────────────────────────
var base_1 = require("./adapters/base");
Object.defineProperty(exports, "BaseAnchorAdapter", { enumerable: true, get: function () { return base_1.BaseAnchorAdapter; } });
Object.defineProperty(exports, "RampAdapterError", { enumerable: true, get: function () { return base_1.RampAdapterError; } });
var etherfuse_1 = require("./adapters/etherfuse");
Object.defineProperty(exports, "EtherfuseAdapter", { enumerable: true, get: function () { return etherfuse_1.EtherfuseAdapter; } });
var manteca_1 = require("./adapters/manteca");
Object.defineProperty(exports, "MantecaAdapter", { enumerable: true, get: function () { return manteca_1.MantecaAdapter; } });
var koywe_1 = require("./adapters/koywe");
Object.defineProperty(exports, "KoyweAdapter", { enumerable: true, get: function () { return koywe_1.KoyweAdapter; } });
//# sourceMappingURL=index.js.map