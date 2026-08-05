/**
 * rampkit-latam-x402 — Server
 *
 * Wraps the x402 Express middleware so routes can be priced in BRL, MXN, or CLP
 * while settling in a stablecoin. The fiat→token rate is resolved per request
 * through the RampRouter, so a route priced at "R$ 0,50" tracks the live anchor
 * rate instead of a hardcoded token amount that drifts.
 */

import { paymentMiddleware, x402ResourceServer } from '@x402/express';
import { HTTPFacilitatorClient } from '@x402/core/server';
import { ExactStellarScheme } from '@x402/stellar/exact/server';
import type { RampRouter } from 'rampkit-latam-core';

import { usdc, type SettlementAsset, type StellarNetwork } from './assets';
import { resolveLocalPrice, type LocalPrice, type ResolvedPrice } from './pricing';

const DEFAULT_TESTNET_FACILITATOR = 'https://channels.openzeppelin.com/x402/testnet';
const DEFAULT_PUBNET_FACILITATOR = 'https://channels.openzeppelin.com/x402';

/** A route sold for a price denominated in local currency. */
export interface LatamRoute {
  /** What one call costs, in BRL/MXN/CLP/USD */
  price: LocalPrice;
  /** Shown to buyers in the 402 response */
  description?: string;
}

export interface LatamPaymentConfig {
  /** Router supplying live fiat→stablecoin rates */
  router: RampRouter;
  /** Stellar account (G...) that receives settlement — needs a trustline for the asset */
  payTo: string;
  /** CAIP-2 network ID (default: stellar:testnet) */
  network?: StellarNetwork;
  /** OZ Channels API key — required on both testnet and mainnet */
  ozApiKey: string;
  /** Override the facilitator endpoint */
  facilitatorUrl?: string;
  /** Settlement token (default: USDC for the chosen network) */
  asset?: SettlementAsset;
  /** Routes keyed by "METHOD /path", e.g. 'GET /cotacao' */
  routes: Record<string, LatamRoute>;
  /** Called after each price resolution — useful for logging what was charged and why */
  onPriceResolved?: (route: string, price: LocalPrice, resolved: ResolvedPrice) => void;
}

/**
 * Build an Express middleware that gates the configured routes behind x402
 * payment, priced in local currency.
 *
 * @example
 * ```ts
 * app.use(latamPaymentMiddleware({
 *   router,
 *   payTo: process.env.STELLAR_RECIPIENT!,
 *   ozApiKey: process.env.OZ_API_KEY!,
 *   routes: {
 *     'GET /cotacao': { price: { amount: '0.50', currency: 'BRL' } },
 *     'GET /tipo-cambio': { price: { amount: '2.00', currency: 'MXN' } },
 *   },
 * }));
 * ```
 */
export function latamPaymentMiddleware(config: LatamPaymentConfig) {
  const network = config.network ?? 'stellar:testnet';
  const asset = config.asset ?? usdc(network);

  const facilitator = new HTTPFacilitatorClient({
    url:
      config.facilitatorUrl ??
      (network === 'stellar:pubnet' ? DEFAULT_PUBNET_FACILITATOR : DEFAULT_TESTNET_FACILITATOR),
    createAuthHeaders: async () => {
      const headers = { Authorization: `Bearer ${config.ozApiKey}` };
      return { verify: headers, settle: headers, supported: headers };
    },
  });

  const resourceServer = new x402ResourceServer(facilitator).register(
    network,
    new ExactStellarScheme()
  );

  const routes = Object.fromEntries(
    Object.entries(config.routes).map(([pattern, route]) => [
      pattern,
      {
        accepts: {
          scheme: 'exact',
          network,
          payTo: config.payTo,
          // Resolved per request so the charge tracks the live corridor rate.
          price: async () => {
            const resolved = await resolveLocalPrice(config.router, route.price, asset);
            config.onPriceResolved?.(pattern, route.price, resolved);
            return { asset: asset.sacAddress, amount: resolved.baseUnits };
          },
        },
        description:
          route.description ?? `${route.price.amount} ${route.price.currency} per request`,
      },
    ])
  );

  return paymentMiddleware(routes, resourceServer);
}
