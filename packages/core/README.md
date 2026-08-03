# 🇧🇷 @kevinbrenes/rampkit-core

> Enterprise Multi-Anchor Router SDK for Stellar — Unified API routing for Etherfuse, Manteca, and Koywe fiat ramps in Latin America.

[![npm version](https://img.shields.io/npm/v/@kevinbrenes/rampkit-core.svg)](https://www.npmjs.com/package/@kevinbrenes/rampkit-core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 📌 Overview

`@kevinbrenes/rampkit-core` is a unified TypeScript SDK that abstracts the fragmented API specifications of Latin American Stellar Anchors (**Etherfuse**, **Manteca**, and **Koywe**) into a single, standardized Multi-Anchor Router engine.

Instead of spending weeks writing custom integration logic for PIX (Brazil), SPEI (Mexico), Khipu (Chile), and ACH (USA), developers can initialize `RampRouter` and query quotes, execute orders, and stream live order statuses in minutes.

---

## ✨ Features & Capabilities

- 🔀 **Multi-Anchor Smart Routing**: Queries live quotes from all available anchors in parallel and orders them by lowest fees or highest payout.
- ⚡ **Etherfuse Live API Adapter**: Real-time integration with Etherfuse Sandbox (`/ramp/quote`, `/ramp/order`, `/ramp/orders`, `/ramp/bank-accounts`).
- 🔄 **Stellar Horizon Transaction Hash Resolver**: Converts Base58 signature strings into 64-hex transaction hashes for seamless Stellar Expert tracking.
- 🌐 **SEP-24 & SEP-6 Standardized Data Schemas**: Unified asset codes, payment rails, quotes, and status responses.
- 🧪 **Hybrid Sandbox Mode**: Simulates fiat bank transfers while executing real blockchain operations on Stellar Testnet.

---

## 📦 Installation

```bash
npm install @kevinbrenes/rampkit-core @stellar/stellar-sdk
```

Or with Yarn / pnpm:
```bash
pnpm add @kevinbrenes/rampkit-core @stellar/stellar-sdk
```

---

## 💡 Quick Start & Usage Examples

### 1. Initialize the Router Engine

```typescript
import { RampRouter } from '@kevinbrenes/rampkit-core';

const router = new RampRouter({
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

### 2. Fetch Multi-Anchor Quotes in Parallel

```typescript
// Query best rates across all LATAM anchors simultaneously
const quotes = await router.getQuotes({
  direction: 'on-ramp',
  sourceAsset: 'BRL',
  destAsset: 'USDC',
  amount: '100',
  country: 'BR',
});

console.log('Best Quote:', quotes[0]);
// Output: { id: '...', anchorId: 'etherfuse', exchangeRate: 0.196, fee: 0.20, ... }
```

---

### 3. Execute On-Ramp Order & Get Payment Details

```typescript
const order = await router.executeOrder({
  quoteId: quotes[0].id,
  anchorId: quotes[0].anchorId,
  publicKey: 'GBAEGEMNJHS5KP5CORUKHYITFI562KK3WP3CO7YRU7B3522MSC6UZ22P',
});

console.log('PIX Payment Instructions:', order.paymentInstructions);
// Renders PIX QR Code payload & copyable Pix Key string
```

---

### 4. Stream Live Order Status

```typescript
const status = await router.getOrderStatus(order.id, 'etherfuse');
console.log('Order Status:', status.status); // 'pending' | 'completed' | 'failed'
console.log('Explorer URL:', status.explorerUrl);
```

---

## 📖 Supported Corridors

| Country | Fiat Currency | Payment Rail | Supported Anchors | Token Assets | Default Yield |
|---------|---------------|--------------|-------------------|--------------|---------------|
| 🇧🇷 **Brazil** | BRL | PIX | Etherfuse, Manteca | USDC, TESOURO | **13.25% APY** |
| 🇲🇽 **Mexico** | MXN | SPEI | Etherfuse, Koywe | USDC, CETES | **10.50% APY** |
| 🇨🇱 **Chile** | CLP | Khipu | Koywe | USDC | — |
| 🇺🇸 **USA** | USD | ACH / Wire | Etherfuse | USDC, USTRY | **4.80% APY** |

---

## 🔗 Related Packages

- 🎨 [`@kevinbrenes/rampkit-ui`](https://www.npmjs.com/package/@kevinbrenes/rampkit-ui) — Drop-in React UI components (`<RampWidget />`, `<SavingsWidget />`).
- 🌐 [Live Production Demo Playground](https://rampkit-latam.vercel.app)
- 🐙 [GitHub Repository](https://github.com/diegoucampos-tech/rampkit-latam)

---

## 📄 License

MIT © RampKit LATAM Team
