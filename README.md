# RampKit LATAM

**One SDK to connect Latin American bank accounts with Stellar — via PIX, SPEI, and Khipu.**

[![npm version](https://img.shields.io/npm/v/rampkit-latam-core.svg?style=flat-square&color=4ade80)](https://www.npmjs.com/package/rampkit-latam-core)
[![npm ui version](https://img.shields.io/npm/v/rampkit-latam-ui.svg?style=flat-square&color=61dafb)](https://www.npmjs.com/package/rampkit-latam-ui)
[![Vercel Deployment](https://img.shields.io/badge/Vercel-Production%20Live-black.svg?style=flat-square&logo=vercel)](https://rampkit-latam.vercel.app)
[![Stellar Network](https://img.shields.io/badge/Stellar-Testnet-purple.svg?style=flat-square)](https://stellar.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)

> 🚀 Built for the [Stellar Builder Summit SP 2026 — Brazil Ramps & Regional Kits Bounty](https://app.grantfox.io).

---

## The Problem

Getting money **into** and **out** of Stellar from a Latin American bank account is unnecessarily hard.

Today, a developer who wants to let a Brazilian user buy USDC with PIX, or a Mexican user sell USDC via SPEI, must:

1. **Pick an anchor** — Etherfuse, Manteca, or Koywe each cover different countries, currencies, and payment methods. There is no single provider that covers all of LATAM.
2. **Read three separate API docs** — Each anchor has its own authentication, quote format, order lifecycle, and webhook schema. No two behave the same.
3. **Build three custom integrations** — Different endpoints, different error codes, different status polling strategies. Every integration is written from scratch.
4. **Build the entire UI from zero** — "Enter amount → show exchange rate → generate QR code → poll for completion → show confirmation" is the same flow every time, yet every team rebuilds it.
5. **Miss the best price** — Without querying all anchors simultaneously, the user is locked into one provider's exchange rate with no way to compare.

The result: most apps either support only one anchor (limiting coverage) or spend months of engineering time gluing together fragmented APIs. **Users in LATAM end up with fewer, slower, and more expensive options to access Stellar.**

---

## The Solution

RampKit LATAM is an open-source developer toolkit that solves this in three layers:

```
┌─────────────────────────────────────────────────────────┐
│  Layer 3: Soroban Smart Contract (savings-vault)        │
│  On-chain yield vault — deposit USDC, earn 13.25% APY   │
│  from tokenized Brazilian treasury bonds (TESOURO)      │
├─────────────────────────────────────────────────────────┤
│  Layer 2: rampkit-latam-ui (React Components)           │
│  Drop-in <RampWidget/>, <SavingsWidget/>,               │
│  <StatusTracker/>, <QuoteCard/> — ready to embed        │
├─────────────────────────────────────────────────────────┤
│  Layer 1: rampkit-latam-core (TypeScript SDK)           │
│  Unified router that queries Etherfuse, Manteca, and    │
│  Koywe in parallel — one API for all of LATAM           │
└─────────────────────────────────────────────────────────┘
```

**Think of it like Stripe for Stellar ramps** — instead of integrating three payment processors separately, you install one SDK and get a widget that handles everything.

---

## What Each Layer Does

### Layer 1: `rampkit-latam-core` — The Router SDK

The core SDK is a TypeScript library that abstracts the differences between anchors into a single interface.

**Before RampKit** (three separate integrations):
```typescript
// Etherfuse — custom auth, custom quote format
const efQuote = await fetch('https://api.etherfuse.com/ramp/quote', { ... });

// Manteca — different auth, different format
const maQuote = await fetch('https://api.manteca.io/v1/quotes', { ... });

// Koywe — yet another auth, yet another format
const koQuote = await fetch('https://api.koywe.com/rest/quotes', { ... });

// Now manually normalize, compare, and pick the best one...
```

**After RampKit** (one call):
```typescript
import { RampRouter } from 'rampkit-latam-core';

const router = new RampRouter({
  network: 'testnet',
  anchors: {
    etherfuse: { apiKey: process.env.ETHERFUSE_API_KEY!, sandbox: true },
    manteca:   { apiKey: process.env.MANTECA_API_KEY!, sandbox: true },
    koywe:     { apiKey: process.env.KOYWE_API_KEY!, sandbox: true },
  },
});

// One call → queries all anchors in parallel → returns sorted by best rate
const quotes = await router.getQuotes({
  direction: 'on-ramp',
  sourceAsset: 'BRL',
  destAsset: 'USDC',
  amount: '100',
  country: 'BR',
});
```

**Key capabilities:**
- **Parallel quote comparison** — Fetch rates from all anchors at once, sorted by best payout.
- **Unified order lifecycle** — `executeOrder()` and `getOrderStatus()` work the same regardless of which anchor is executing the trade.
- **Stellar transaction resolution** — Automatically converts Base58 signatures to hex hashes for [Stellar Expert](https://stellar.expert/explorer/testnet) lookup.

### Layer 2: `rampkit-latam-ui` — The React UI Kit

Pre-built React components that implement the entire on-ramp/off-ramp user experience.

| Component | What it does |
|-----------|-------------|
| `<RampWidget />` | Full checkout flow: asset selection → quote comparison → PIX/SPEI QR code → status polling → browser notification on completion |
| `<SavingsWidget />` | Live yield dashboard that reads order history and shows real-time 13.25% APY accrual |
| `<StatusTracker />` | Step-by-step order progress with clickable Stellar Explorer links |
| `<QuoteCard />` | Side-by-side comparison card highlighting best rates and fees |

**Usage:**
```tsx
import { RampWidget, SavingsWidget } from 'rampkit-latam-ui';
import 'rampkit-latam-ui/dist/styles/rampkit.css';

// That's it — a complete PIX checkout in one line
<RampWidget router={router} stellarAddress="G..." locale="es" />
```

Supports English, Spanish, and Portuguese out of the box via the `locale` prop.

### Layer 3: Soroban Smart Contract — Savings Vault

A Soroban (Stellar smart contract) that turns the ramp into a savings product:

1. User deposits BRL via PIX → receives USDC on Stellar
2. USDC is deposited into the on-chain vault
3. Vault accrues yield at 13.25% APY (matching [TESOURO](https://etherfuse.com/) — tokenized Brazilian government bonds)
4. User withdraws yield or principal → converts back to BRL via PIX

**The end-user experience:** "Deposit via PIX → earn 13% → withdraw via PIX." No wallets, no crypto jargon, no manual steps.

---

## End-to-End Flow

Here's what happens when a Brazilian user deposits R$100 to start earning yield:

```mermaid
sequenceDiagram
    participant U as 🧑 User (Brazil)
    participant APP as Your App
    participant SDK as rampkit-latam-core
    participant EF as Etherfuse API
    participant SN as Stellar Network
    participant SC as Soroban Vault

    rect rgb(10, 50, 10)
    Note over U, EF: ON-RAMP: PIX → USDC
    U->>APP: "Depositar R$ 100"
    APP->>SDK: router.getQuotes({ BRL→USDC })
    SDK->>EF: Fetches best quote
    EF-->>APP: R$ 100 → 17.50 USDC
    APP->>U: Shows PIX QR code
    U->>EF: Pays PIX
    EF->>SN: Sends 17.50 USDC to user wallet
    end

    rect rgb(50, 10, 50)
    Note over APP, SC: DEPOSIT INTO VAULT
    APP->>SC: deposit(owner, 17.50 USDC)
    SC-->>APP: ✅ Yield accrual starts
    end

    rect rgb(50, 50, 10)
    Note over SC, SC: YIELD ACCRUAL (13.25% APY)
    Note over SC: After 1 year: ~$2.32 earned
    end

    rect rgb(10, 10, 50)
    Note over U, EF: OFF-RAMP: USDC → PIX
    U->>APP: "Sacar ganancias"
    APP->>SC: withdraw_yield(owner)
    SC-->>APP: USDC transferred
    APP->>SDK: router.getQuotes({ USDC→BRL, off-ramp })
    EF->>U: PIX sent to bank account
    end
```

---

## Supported Countries & Corridors

| Country | Currency | Payment Method | Anchors | Assets Available | Yield |
|---------|----------|----------------|---------|-----------------|-------|
| 🇧🇷 Brazil | BRL | PIX | Etherfuse, Manteca | USDC, TESOURO | 13.25% APY |
| 🇲🇽 Mexico | MXN | SPEI | Etherfuse, Koywe | USDC, CETES | 10.50% APY |
| 🇨🇱 Chile | CLP | Khipu | Koywe | USDC | — |
| 🇺🇸 USA | USD | ACH / Wire | Etherfuse | USDC, USTRY | 4.80% APY |

---

## Project Structure

```
rampkit-latam/
├── packages/
│   ├── core/          # rampkit-latam-core — TypeScript router SDK
│   └── ui/            # rampkit-latam-ui — React component library
├── contracts/
│   └── savings-vault/ # Soroban smart contract — yield vault
├── demo/              # Next.js demo application (deployed on Vercel)
├── docs/              # SDK reference, UI guide, savings flow deep-dive
└── scripts/           # Testnet setup & deployment utilities
```

---

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/WritzProtocol/rampkit-latam.git
cd rampkit-latam

# 2. Install all workspace dependencies
npm install

# 3. Configure testnet accounts and API keys
npx tsx scripts/setup-testnet.ts

# 4. Build the SDK and UI packages
npm run build

# 5. Launch the demo app
npm run dev
```

### Using the SDK in your own project

```bash
npm install rampkit-latam-core rampkit-latam-ui
```

```tsx
import { RampRouter } from 'rampkit-latam-core';
import { RampWidget } from 'rampkit-latam-ui';
import 'rampkit-latam-ui/dist/styles/rampkit.css';

const router = new RampRouter({
  network: 'testnet',
  anchors: {
    etherfuse: { apiKey: 'YOUR_KEY', sandbox: true },
  },
});

function App() {
  return <RampWidget router={router} stellarAddress="G..." locale="pt-BR" />;
}
```

---

## Bounty Alignment

This project addresses **3 of the 5** suggested deliverables from the Brazil Ramps bounty:

| Bounty Deliverable | Our Implementation | Status |
|---|---|---|
| **Multi-anchor router** — "one interface, multiple anchors, live quotes" | `rampkit-latam-core` — `RampRouter.getQuotes()` queries Etherfuse, Manteca, and Koywe in parallel | ✅ Complete |
| **Ramp UX kit** — "reusable, documented, importable, works in a second app" | `rampkit-latam-ui` — published on npm, drop-in `<RampWidget />` and `<SavingsWidget />` | ✅ Complete |
| **PIX ramp integration** — "BRL in and out via PIX into Etherfuse USDC/TESOURO" | Full flow: PIX → Etherfuse Sandbox API → real Stellar testnet transaction → Explorer link | ✅ Complete |

---

## Links

| Resource | Link |
|----------|------|
| 🌐 Live Demo | [rampkit-latam.vercel.app](https://rampkit-latam.vercel.app) |
| 📦 Core SDK (npm) | [`rampkit-latam-core`](https://www.npmjs.com/package/rampkit-latam-core) |
| 📦 UI Kit (npm) | [`rampkit-latam-ui`](https://www.npmjs.com/package/rampkit-latam-ui) |
| 📖 SDK Reference | [docs/SDK_REFERENCE.md](docs/SDK_REFERENCE.md) |
| 🎨 UI Guide | [docs/UI_GUIDE.md](docs/UI_GUIDE.md) |
| 💰 Savings Flow | [docs/SAVINGS_FLOW.md](docs/SAVINGS_FLOW.md) |
| 📘 Getting Started | [docs/README.md](docs/README.md) |

---

## License

MIT © RampKit LATAM Team
