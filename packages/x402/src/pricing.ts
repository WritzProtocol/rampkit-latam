/**
 * rampkit-latam-x402 — Local-currency pricing
 *
 * x402 prices a route in the settlement token. LATAM developers think in BRL,
 * MXN, and CLP. This module bridges the two by pulling the live fiat→stablecoin
 * rate from the same RampRouter that powers the ramp UI, so an API priced at
 * "R$ 0,50 per call" charges whatever that is worth in USDC at request time.
 */

import type { RampRouter, FiatCurrency } from 'rampkit-latam-core';
import {
  CURRENCY_TO_COUNTRY,
  SUPPORTED_PRICING_CURRENCIES,
  toBaseUnits,
  type SettlementAsset,
} from './assets';

/** A route price expressed in a local LATAM currency. */
export interface LocalPrice {
  /** Decimal amount, e.g. '0.50' for fifty centavos */
  amount: string;
  /** Currency the amount is denominated in */
  currency: FiatCurrency;
}

export interface ResolvedPrice {
  /** Integer base units of the settlement asset */
  baseUnits: string;
  /** Human-readable settlement amount, for logs and 402 descriptions */
  tokenAmount: string;
  /** Fiat→token rate actually used */
  rate: string;
  /** Where the rate came from — useful when debugging a surprising charge */
  source: 'anchor-quote' | 'fallback-rate';
}

/**
 * Fallback rates used only when no anchor can quote the corridor. Without these
 * a transient anchor outage would take the paid API down with it, which is a
 * worse failure than charging a slightly stale rate for one request.
 */
const FALLBACK_RATES: Record<FiatCurrency, number> = {
  BRL: 0.175,
  MXN: 0.052,
  CLP: 0.00105,
  USD: 1,
};

export class UnsupportedCurrencyError extends Error {
  constructor(currency: string) {
    super(
      `Cannot price a route in ${currency}. Supported: ${SUPPORTED_PRICING_CURRENCIES.join(', ')}`
    );
    this.name = 'UnsupportedCurrencyError';
  }
}

/**
 * Resolve a local-currency price into settlement-token base units.
 *
 * Quotes the fiat→token corridor through the router and applies the rate. The
 * quote is requested for a larger notional than the actual price because anchor
 * sandboxes reject dust amounts below their corridor minimum — only the rate is
 * used, never the quoted amount.
 */
export async function resolveLocalPrice(
  router: RampRouter,
  price: LocalPrice,
  asset: SettlementAsset
): Promise<ResolvedPrice> {
  if (!SUPPORTED_PRICING_CURRENCIES.includes(price.currency)) {
    throw new UnsupportedCurrencyError(price.currency);
  }

  const localAmount = parseFloat(price.amount);
  let rate = FALLBACK_RATES[price.currency];
  let source: ResolvedPrice['source'] = 'fallback-rate';

  if (price.currency !== 'USD' || asset.code !== 'USDC') {
    const quote = await router.getBestQuote({
      direction: 'on-ramp',
      sourceAsset: price.currency,
      destAsset: asset.code,
      amount: '100',
      country: CURRENCY_TO_COUNTRY[price.currency],
    });
    if (quote) {
      const quoted = parseFloat(quote.exchangeRate);
      if (quoted > 0) {
        rate = quoted;
        source = 'anchor-quote';
      }
    }
  } else {
    source = 'anchor-quote';
  }

  const tokenAmount = localAmount * rate;

  return {
    baseUnits: toBaseUnits(tokenAmount, asset.decimals),
    tokenAmount: tokenAmount.toFixed(asset.decimals),
    rate: rate.toString(),
    source,
  };
}
