/**
 * rampkit-latam-x402 — LATAM stablecoin dev kit for agentic payments
 *
 * Sell an API to AI agents priced in your own currency. x402 settles in a
 * stablecoin; this kit lets you quote routes in BRL, MXN, or CLP and resolves
 * the rate per request through the same RampRouter that powers RampKit's ramps.
 *
 * @example Server
 * ```ts
 * import { latamPaymentMiddleware } from 'rampkit-latam-x402';
 *
 * app.use(latamPaymentMiddleware({
 *   router,
 *   payTo: process.env.STELLAR_RECIPIENT!,
 *   ozApiKey: process.env.OZ_API_KEY!,
 *   routes: { 'GET /cotacao': { price: { amount: '0.50', currency: 'BRL' } } },
 * }));
 * ```
 *
 * @example Agent client
 * ```ts
 * import { createLatamPaymentClient } from 'rampkit-latam-x402';
 *
 * const pay = createLatamPaymentClient({ secretKey: process.env.STELLAR_SECRET_KEY! });
 * const data = await (await pay('http://localhost:3001/cotacao')).json();
 * ```
 *
 * @packageDocumentation
 */

export { latamPaymentMiddleware } from './server';
export type { LatamPaymentConfig, LatamRoute } from './server';

export { createLatamPaymentClient, quoteResource } from './client';
export type { LatamClientConfig, ResourceQuote } from './client';

export { resolveLocalPrice, UnsupportedCurrencyError } from './pricing';
export type { LocalPrice, ResolvedPrice } from './pricing';

export {
  usdc,
  toBaseUnits,
  SUPPORTED_PRICING_CURRENCIES,
  CURRENCY_TO_COUNTRY,
} from './assets';
export type { SettlementAsset, StellarNetwork } from './assets';
