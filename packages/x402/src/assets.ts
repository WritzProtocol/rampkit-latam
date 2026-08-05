/**
 * rampkit-latam-x402 — Settlement asset registry
 *
 * x402 settles in a SEP-41 token identified by its Stellar Asset Contract (SAC)
 * address. USDC is the default because it is the only stablecoin with deep
 * liquidity across every LATAM anchor RampKit routes to.
 */

import { USDC_TESTNET_ADDRESS, USDC_PUBNET_ADDRESS } from '@x402/stellar';
import type { FiatCurrency } from 'rampkit-latam-core';

export type StellarNetwork = 'stellar:testnet' | 'stellar:pubnet';

/** A SEP-41 token x402 payments can settle in. */
export interface SettlementAsset {
  /** Asset code as shown to developers */
  code: string;
  /** Stellar Asset Contract address (C...) the transfer is invoked on */
  sacAddress: string;
  /** Token decimals — Stellar classic assets wrapped as SACs use 7 */
  decimals: number;
}

/** USDC, resolved per network from the canonical @x402/stellar constants. */
export function usdc(network: StellarNetwork): SettlementAsset {
  return {
    code: 'USDC',
    sacAddress: network === 'stellar:pubnet' ? USDC_PUBNET_ADDRESS : USDC_TESTNET_ADDRESS,
    decimals: 7,
  };
}

/**
 * Local currencies a route can be priced in. Pricing is separate from
 * settlement: a Brazilian developer quotes centavos, the buyer pays stablecoin.
 */
export const SUPPORTED_PRICING_CURRENCIES: FiatCurrency[] = ['BRL', 'MXN', 'CLP', 'USD'];

/** The country whose ramp corridor supplies the FX rate for each currency. */
export const CURRENCY_TO_COUNTRY: Record<FiatCurrency, 'BR' | 'MX' | 'CL' | 'US'> = {
  BRL: 'BR',
  MXN: 'MX',
  CLP: 'CL',
  USD: 'US',
};

/**
 * Convert a decimal token amount into the integer base units x402 expects.
 * Truncates rather than rounds so a route never charges more than it quoted.
 */
export function toBaseUnits(amount: number, decimals: number): string {
  return BigInt(Math.floor(amount * 10 ** decimals)).toString();
}
