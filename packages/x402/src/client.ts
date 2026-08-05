/**
 * rampkit-latam-x402 — Client
 *
 * A fetch wrapper for agents buying from LATAM x402 APIs. The 402 negotiation
 * and auth-entry signing are handled by @x402/fetch; this adds the ability to
 * read back what a resource costs in local currency before committing to it.
 */

import { wrapFetchWithPaymentFromConfig } from '@x402/fetch';
import { createEd25519Signer } from '@x402/stellar';
import { ExactStellarScheme } from '@x402/stellar/exact/client';

import type { StellarNetwork } from './assets';

export interface LatamClientConfig {
  /** Payer's Stellar secret (S...) — needs a trustline and balance in the settlement asset */
  secretKey: string;
  /** CAIP-2 network ID, must match the server (default: stellar:testnet) */
  network?: StellarNetwork;
  /** Base fetch to wrap, for tests or custom transports */
  fetchImpl?: typeof fetch;
}

/**
 * Create a fetch that transparently pays for x402-gated resources.
 *
 * Network fees are sponsored by the facilitator, so the payer account needs the
 * settlement token but no XLM.
 *
 * @example
 * ```ts
 * const pay = createLatamPaymentClient({ secretKey: process.env.STELLAR_SECRET_KEY! });
 * const res = await pay('https://api.example.com/cotacao');
 * ```
 */
export function createLatamPaymentClient(config: LatamClientConfig): typeof fetch {
  const network = config.network ?? 'stellar:testnet';
  const signer = createEd25519Signer(config.secretKey, network);

  return wrapFetchWithPaymentFromConfig(config.fetchImpl ?? fetch, {
    schemes: [{ network, client: new ExactStellarScheme(signer) }],
  }) as typeof fetch;
}

/** What a resource costs, as advertised in its 402 response. */
export interface ResourceQuote {
  /** SAC address of the token the resource settles in */
  asset: string;
  /** Price in that token's base units */
  amount: string;
  /** Account receiving settlement */
  payTo: string;
  /** Human-readable description, typically the local-currency price */
  description?: string;
}

/**
 * Read a resource's price without paying it, by inspecting the unpaid 402
 * response. Lets an agent apply a spending policy before committing funds.
 *
 * @returns The advertised terms, or null if the resource is not payment-gated
 */
export async function quoteResource(
  url: string,
  init?: RequestInit,
  fetchImpl: typeof fetch = fetch
): Promise<ResourceQuote | null> {
  const res = await fetchImpl(url, init);
  if (res.status !== 402) return null;

  const body: any = await res.json();
  const accepts = body?.accepts?.[0];
  if (!accepts) return null;

  return {
    asset: accepts.asset,
    amount: accepts.amount,
    payTo: accepts.payTo,
    description: body?.resource?.description,
  };
}
