# rampkit-latam-core

Enterprise Multi-Anchor Router SDK for Stellar — Unified API routing for Etherfuse, Manteca, and Koywe fiat ramps in Latin America.

[![npm version](https://img.shields.io/npm/v/rampkit-latam-core.svg?style=flat-square&color=4ade80)](https://www.npmjs.com/package/rampkit-latam-core)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Stellar Network](https://img.shields.io/badge/Stellar-Testnet-purple.svg?style=flat-square)](https://stellar.org)

---

## Executive Summary

`rampkit-latam-core` is an open-source, enterprise-grade TypeScript SDK built for developers integrating Latin American financial payment rails onto the Stellar network.

Traditionally, supporting regional fiat payment methods—such as PIX (Brazil), SPEI (Mexico), Khipu (Chile), and ACH (USA)—requires reading disparate Anchor documentation (SEP-24 / SEP-6) and maintaining custom integration code for vendors like Etherfuse, Manteca, and Koywe.

`rampkit-latam-core` abstracts this fragmentation into a single Multi-Anchor Smart Router, enabling developers to fetch optimal quotes in parallel, execute transactions, and monitor real-time order states with unified type definitions.

---

## Core Features

- **Multi-Anchor Smart Rate Routing**: Concurrently queries quotes from Etherfuse, Manteca, and Koywe, ordering results by lowest fee structure and best exchange rates.
- **Etherfuse Real API Integration**: Fully compliant adapter connected to the live Etherfuse Sandbox API (`POST /ramp/order`, `GET /ramp/orders`, `GET /ramp/bank-accounts`).
- **Stellar Horizon Transaction Hash Resolver**: Automatically resolves Base58 signature strings into 64-character hexadecimal hashes for direct [Stellar Expert Explorer](https://stellar.expert/explorer/testnet) lookup.
- **Standardized SEP Schemas**: Unified TypeScript interfaces across asset definitions, payment rails, quote payloads, and status responses.
- **Hybrid Sandbox Mode**: Simulates fiat bank transfers while executing real on-chain ledger operations on Stellar Testnet.

---

## Installation

Install via npm, yarn, or pnpm:

```bash
npm install rampkit-latam-core @stellar/stellar-sdk
```

```bash
yarn add rampkit-latam-core @stellar/stellar-sdk
```

```bash
pnpm add rampkit-latam-core @stellar/stellar-sdk
```

---

## Developer Guide & Code Examples

### 1. Initializing the Router Engine

```typescript
import { RampRouter } from 'rampkit-latam-core';

export const router = new RampRouter({
  network: 'testnet', // 'testnet' | 'pubnet'
  anchors: {
    etherfuse: {
      apiKey: process.env.ETHERFUSE_API_KEY!,
      sandbox: true,
    },
    manteca: {
      apiKey: process.env.MANTECA_API_KEY!,
      sandbox: true,
    },
    koywe: {
      apiKey: process.env.KOYWE_API_KEY!,
      sandbox: true,
    },
  },
});
```

---

### 2. Querying Multi-Anchor Quotes in Parallel

```typescript
// Fetch live quotes across all supported anchors simultaneously
const quotes = await router.getQuotes({
  direction: 'on-ramp',
  sourceAsset: 'BRL',
  destAsset: 'USDC',
  amount: '100',
  country: 'BR',
});

// Returns an array sorted by best payout rate
console.log('Top Recommended Quote:', quotes[0]);
```

---

### 3. Executing an On-Ramp Order & Generating Payment QR

Pass the whole quote — the router reads `anchorId` from it to route the order to the
correct anchor.

```typescript
const order = await router.executeRamp(
  quotes[0],
  'GBAEGEMNJHS5KP5CORUKHYITFI562KK3WP3CO7YRU7B3522MSC6UZ22P',
  { email: 'user@example.com', taxId: '12345678909', fullName: 'Maria Silva' },
);

// Payment instructions live on the order's quote
console.log('PIX copy-paste:', order.quote.paymentDetails?.pixCopyPaste);
console.log('SPEI CLABE:', order.quote.paymentDetails?.speiClabe);
```

---

### 4. Polling Live Order Status & Horizon Resolution

```typescript
const status = await router.getStatus(order.orderId, order.anchorId);

console.log('Status:', status.status); // 'pending_payment' | 'processing' | 'completed' | ...
console.log('Stellar TX:', status.stellarTxHash);
console.log(`https://stellar.expert/explorer/testnet/tx/${status.stellarTxHash}`);
```

---

### 5. Quoting a Cross-Border Remittance

> Requires **1.1.0 or later**. This API is not present in the published `1.0.1`.

Composes two ramp legs through a stablecoin bridge, quoting each leg independently so
send and receive can route through different anchors.

```typescript
const remittance = await router.getRemittanceQuote({
  fromCountry: 'BR', fromCurrency: 'BRL',
  toCountry: 'MX',   toCurrency: 'MXN',
  amount: '500',
});

console.log(`Recipient gets ${remittance?.receiveAmount} MXN`);
console.log(`Send leg via ${remittance?.sendLeg.anchorId}`);
console.log(`Receive leg via ${remittance?.receiveLeg.anchorId}`);
console.log(`Total fees: ${remittance?.totalFeePercentage.toFixed(2)}%`);

// Execute the send leg to get the sender's payment instructions
const order = await router.executeRemittance(remittance!, 'G...');
```

---

## Regional Corridor Compatibility

| Country | Currency | Payment Rail | Anchors Handled | Supported Tokens | Yield Capability |
|---------|----------|--------------|-----------------|------------------|------------------|
| Brazil | BRL | PIX | Etherfuse, Manteca | USDC, TESOURO | 13.25% APY |
| Mexico | MXN | SPEI | Etherfuse, Koywe | USDC, CETES | 10.50% APY |
| Chile | CLP | Khipu | Koywe | USDC | — |
| USA | USD | ACH / Wire | Etherfuse | USDC, USTRY | 4.80% APY |

---

## API Reference Summary

| Method | Parameters | Return Type | Description |
|--------|------------|-------------|-------------|
| `getQuotes(params, strategy?)` | `QuoteRequest`, `QuoteStrategy` | `Promise<RampQuote[]>` | Fetches live quotes from all anchors in parallel |
| `getBestQuote(params, strategy?)` | `QuoteRequest`, `QuoteStrategy` | `Promise<RampQuote \| null>` | Top-ranked quote only |
| `executeRamp(quote, address, opts?)` | `RampQuote`, `string` | `Promise<RampOrder>` | Submits the order to the quote's anchor and returns payment details |
| `getStatus(orderId, anchorId)` | `string`, `AnchorId` | `Promise<RampOrder>` | Current order state, with the 64-hex transaction hash resolved |
| `cancelOrder(orderId, anchorId)` | `string`, `AnchorId` | `Promise<boolean>` | Cancels an order where the anchor supports it |
| `getRemittanceQuote(params, strategy?)` | `RemittanceRequest` | `Promise<RemittanceQuote \| null>` | Two-leg cross-border route through a stablecoin bridge |
| `executeRemittance(quote, address, opts?)` | `RemittanceQuote`, `string` | `Promise<RampOrder>` | Executes the send leg of a remittance |
| `getRemittanceCorridors()` | — | `Array<{ from, to }>` | Every viable origin/destination pair |
| `getSupportedCorridors()` | — | `Corridor[]` | All corridors across configured anchors |
| `getAssets()` | — | `Promise<AnchorAsset[]>` | Every tokenized asset the anchors expose |
| `getYieldBearingAssets()` | — | `Promise<AnchorAsset[]>` | Tokenized sovereign debt only (TESOURO, CETES, USTRY) |
| `getAvailableAnchors()` | — | `Promise<AnchorId[]>` | Health check across configured anchors |
| `on(listener)` | `RampEventListener` | `() => void` | Subscribes to router events; returns an unsubscribe function |

---

## Related Resources

- UI Kit: [`rampkit-latam-ui`](https://www.npmjs.com/package/rampkit-latam-ui)
- Live Production Demo: [https://rampkit-latam.vercel.app](https://rampkit-latam.vercel.app)
- Repository: [GitHub - WritzProtocol/rampkit-latam](https://github.com/WritzProtocol/rampkit-latam)

---

## License

MIT © RampKit LATAM Team
