# ⚡ rampkit-latam-core

> **Enterprise Multi-Anchor Router SDK for Stellar — Unified API routing for Etherfuse, Manteca, and Koywe fiat ramps in Latin America.**

[![npm version](https://img.shields.io/npm/v/rampkit-latam-core.svg?style=flat-square&color=4ade80)](https://www.npmjs.com/package/rampkit-latam-core)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Stellar Network](https://img.shields.io/badge/Stellar-Testnet-purple.svg?style=flat-square)](https://stellar.org)

---

## 📌 Executive Summary

`rampkit-latam-core` is an open-source, enterprise-grade TypeScript SDK built for developers integrating Latin American financial payment rails onto the Stellar network.

Traditionally, supporting regional fiat payment methods—such as **PIX** (Brazil), **SPEI** (Mexico), **Khipu** (Chile), and **ACH** (USA)—requires reading disparate Anchor documentation (SEP-24 / SEP-6) and maintaining custom integration code for vendors like **Etherfuse**, **Manteca**, and **Koywe**.

`rampkit-latam-core` abstracts this fragmentation into a single **Multi-Anchor Smart Router**, enabling developers to fetch optimal quotes in parallel, execute transactions, and monitor real-time order states with unified type definitions.

---

## ✨ Core Features

- 🔀 **Multi-Anchor Smart Rate Routing**: Concurrently queries quotes from Etherfuse, Manteca, and Koywe, ordering results by lowest fee structure and best exchange rates.
- ⚡ **Etherfuse Real API Integration**: Fully compliant adapter connected to the live Etherfuse Sandbox API (`POST /ramp/order`, `GET /ramp/orders`, `GET /ramp/bank-accounts`).
- 🔄 **Stellar Horizon Transaction Hash Resolver**: Automatically resolves Base58 signature strings into 64-character hexadecimal hashes for direct [Stellar Expert Explorer](https://stellar.expert/explorer/testnet) lookup.
- 🌐 **Standardized SEP Schemas**: Unified TypeScript interfaces across asset definitions, payment rails, quote payloads, and status responses.
- 🧪 **Hybrid Sandbox Mode**: Simulates fiat bank transfers while executing real on-chain ledger operations on Stellar Testnet.

---

## 📦 Installation

Install via `npm`, `yarn`, or `pnpm`:

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

## 💡 Developer Guide & Code Examples

### 1. Initializing the Router Engine

```typescript
import { RampRouter } from 'rampkit-latam-core';

export const router = new RampRouter({
  network: 'testnet', // 'testnet' | 'mainnet'
  anchors: {
    etherfuse: {
      apiKey: process.env.ETHERFUSE_API_KEY!, // e.g. 'api_sand:...'
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
/*
{
  id: 'quote-ef-1234',
  anchorId: 'etherfuse',
  anchorName: 'Etherfuse',
  exchangeRate: 0.1961,
  fee: 0.20,
  estimatedPayout: '19.61',
  paymentRail: 'PIX',
  settlementTime: '< 1 min'
}
*/
```

---

### 3. Executing an On-Ramp Order & Generating Payment QR

```typescript
const order = await router.executeOrder({
  quoteId: quotes[0].id,
  anchorId: quotes[0].anchorId,
  publicKey: 'GBAEGEMNJHS5KP5CORUKHYITFI562KK3WP3CO7YRU7B3522MSC6UZ22P',
});

console.log('PIX Payment Instructions:', order.paymentInstructions);
/*
{
  qrCodeUrl: 'https://...',
  pixKey: '00020126580014br.gov.bcb.pix...',
  expiration: '2026-08-03T19:00:00Z'
}
*/
```

---

### 4. Polling Live Order Status & Horizon Resolution

```typescript
const status = await router.getOrderStatus(order.id, 'etherfuse');

console.log('Status:', status.status); // 'completed' | 'pending' | 'failed'
console.log('Stellar Explorer URL:', status.explorerUrl);
// Returns: https://stellar.expert/explorer/testnet/tx/9d4aee900373f7f3108d72c7...
```

---

## 📖 Regional Corridor Compatibility

| Country | Currency | Payment Rail | Anchors Handled | Supported Tokens | Yield Capability |
|---------|----------|--------------|-----------------|------------------|------------------|
| 🇧🇷 **Brazil** | BRL | PIX | Etherfuse, Manteca | USDC, TESOURO | **13.25% APY** |
| 🇲🇽 **Mexico** | MXN | SPEI | Etherfuse, Koywe | USDC, CETES | **10.50% APY** |
| 🇨🇱 **Chile** | CLP | Khipu | Koywe | USDC | — |
| 🇺🇸 **USA** | USD | ACH / Wire | Etherfuse | USDC, USTRY | **4.80% APY** |

---

## 🛠️ API Reference Summary

| Method | Parameters | Return Type | Description |
|--------|------------|-------------|-------------|
| `getQuotes(params)` | `QuoteRequest` | `Promise<RampQuote[]>` | Fetches live quotes from all anchors in parallel |
| `executeOrder(params)` | `OrderRequest` | `Promise<RampOrder>` | Submits order to selected anchor and returns payment info |
| `getOrderStatus(id, anchor)` | `string, string` | `Promise<OrderStatusResponse>` | Checks current order state and resolves 64-hex transaction hash |
| `getYieldBearingAssets()` | — | `Promise<AnchorAsset[]>` | Returns tokenized sovereign debt assets (TESOURO, CETES, USTRY) |

---

## 🔗 Live Resources & Ecosystem Links

- 🎨 UI Kit: [`rampkit-latam-ui`](https://www.npmjs.com/package/rampkit-latam-ui)
- 🌐 Live Production Demo: [https://rampkit-latam.vercel.app](https://rampkit-latam.vercel.app)
- 🐙 Repository: [GitHub - diegoucampos-tech/rampkit-latam](https://github.com/diegoucampos-tech/rampkit-latam)

---

## 📄 License

MIT © RampKit LATAM Team
