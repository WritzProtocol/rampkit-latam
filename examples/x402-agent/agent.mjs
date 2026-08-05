/**
 * Sample buyer: an AI agent that checks the price, applies a budget policy,
 * then pays for the data.
 *
 * The agent holds USDC but no XLM — the facilitator sponsors network fees.
 */
import 'dotenv/config';
import { createLatamPaymentClient, quoteResource } from 'rampkit-latam-x402';

const BASE = process.env.API_BASE || 'http://localhost:3001';
const MAX_PER_CALL_USDC = 0.5;

if (!process.env.STELLAR_SECRET_KEY) {
  console.error('Missing STELLAR_SECRET_KEY (S...) in .env — see README.');
  process.exit(1);
}

const pay = createLatamPaymentClient({
  secretKey: process.env.STELLAR_SECRET_KEY,
  network: process.env.STELLAR_NETWORK || 'stellar:testnet',
});

for (const path of ['/cotacao', '/tipo-cambio']) {
  const url = `${BASE}${path}`;

  const terms = await quoteResource(url);
  if (!terms) {
    console.log(`${path}: not payment-gated, skipping`);
    continue;
  }

  const priceUsdc = Number(terms.amount) / 1e7;
  console.log(`\n${path}`);
  console.log(`  asking ${priceUsdc} USDC — ${terms.description ?? ''}`);

  if (priceUsdc > MAX_PER_CALL_USDC) {
    console.log(`  skipped: over the ${MAX_PER_CALL_USDC} USDC budget`);
    continue;
  }

  const res = await pay(url);
  if (!res.ok) {
    console.log(`  failed: HTTP ${res.status}`);
    continue;
  }
  console.log('  paid, got:', await res.json());
}
