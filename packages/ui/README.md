# rampkit-latam-ui

Enterprise React UI Kit for Stellar Fiat Ramps & Yield Vaults — Drop-in `<RampWidget />`, `<SavingsWidget />`, and `<StatusTracker />` with full i18n support.

[![npm version](https://img.shields.io/npm/v/rampkit-latam-ui.svg?style=flat-square&color=4ade80)](https://www.npmjs.com/package/rampkit-latam-ui)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18%20%7C%2019-61dafb.svg?style=flat-square)](https://react.dev)

---

## Executive Summary

`rampkit-latam-ui` is a production-ready React component library that delivers complete, drop-in financial checkout and yield monitoring interfaces for Latin American fiat payment rails on Stellar.

Designed with enterprise-grade dark mode aesthetics, glassmorphic card overlays, radial green glow effects, crisp SVG vector icons, dynamic 3-second status polling, browser push notifications, and multi-language support (English, Spanish, Portuguese).

---

## Component Suite

| Component | Description | Primary Use Case |
|-----------|-------------|------------------|
| `<RampWidget />` | Complete multi-step fiat checkout flow with asset selection, parallel quote comparison, PIX/SPEI QR code rendering, polling, and status notifications. | Main payment checkout modal / embedded widget |
| `<SavingsWidget />` | Live yield monitoring dashboard reading completed Etherfuse order receipts and tracking TESOURO 13.25% APY yield in real-time. | User dashboard yield vault card |
| `<StatusTracker />` | Step-by-step animated status progression tracker with direct links to Stellar Expert Explorer. | Order details & receipt drawer |
| `<QuoteCard />` | Interactive comparison card highlighting best exchange rates, low fees, and anchor badges. | Quote selection list |

---

## Installation

Install via npm, yarn, or pnpm:

```bash
npm install rampkit-latam-ui rampkit-latam-core
```

```bash
yarn add rampkit-latam-ui rampkit-latam-core
```

```bash
pnpm add rampkit-latam-ui rampkit-latam-core
```

---

## Quick Start & Usage Examples

```tsx
import React from 'react';
import { RampRouter } from 'rampkit-latam-core';
import { RampWidget, SavingsWidget } from 'rampkit-latam-ui';
import 'rampkit-latam-ui/src/styles/rampkit.css';

// 1. Initialize core router engine
const router = new RampRouter({
  network: 'testnet',
  anchors: {
    etherfuse: {
      apiKey: process.env.NEXT_PUBLIC_ETHERFUSE_API_KEY!,
      sandbox: true,
    },
  },
});

export function PaymentDashboard() {
  const userStellarAddress = 'GBAEGEMNJHS5KP5CORUKHYITFI562KK3WP3CO7YRU7B3522MSC6UZ22P';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', padding: '32px' }}>
      {/* Real-time TESOURO Yield Dashboard (13.25% APY) */}
      <SavingsWidget
        router={router}
        stellarAddress={userStellarAddress}
        locale="es" // 'en' | 'es' | 'pt-BR'
      />

      {/* Embedded PIX / SPEI Checkout Widget */}
      <RampWidget
        router={router}
        stellarAddress={userStellarAddress}
        locale="es" // 'en' | 'es' | 'pt-BR'
      />
    </div>
  );
}
```

---

## Styling & Custom Theme Variables

`rampkit-latam-ui` includes a standalone CSS file containing pre-built CSS variables for custom branding:

```css
/* Import default theme */
@import 'rampkit-latam-ui/src/styles/rampkit.css';

/* Override theme variables for custom branding */
:root {
  --rk-bg-primary: #090a0f;
  --rk-bg-card: #12131c;
  --rk-text-accent: #4ade80;
  --rk-text-primary: #ffffff;
  --rk-text-secondary: #94a3b8;
  --rk-border: rgba(255, 255, 255, 0.08);
  --rk-font: 'Inter', system-ui, sans-serif;
}
```

---

## Multi-Language (i18n) Support

Pass the `locale` prop to any component to update interface strings dynamically:

- `"en"` — English (US)
- `"es"` — Spanish (ES / LATAM)
- `"pt-BR"` — Portuguese (Brazil)

---

## Related Resources

- SDK Engine: [`rampkit-latam-core`](https://www.npmjs.com/package/rampkit-latam-core)
- Live Production Demo: [https://rampkit-latam.vercel.app](https://rampkit-latam.vercel.app)
- Repository: [GitHub - WritzProtocol/rampkit-latam](https://github.com/WritzProtocol/rampkit-latam)

---

## License

MIT © RampKit LATAM Team
