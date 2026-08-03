# 🎨 @kevinbrenes/rampkit-ui

> Enterprise React UI Kit for Stellar Fiat Ramps & Savings Vault — Drop-in `<RampWidget />`, `<SavingsWidget />`, and `<StatusTracker />` with full i18n support.

[![npm version](https://img.shields.io/npm/v/@kevinbrenes/rampkit-ui.svg)](https://www.npmjs.com/package/@kevinbrenes/rampkit-ui)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 📌 Overview

`@kevinbrenes/rampkit-ui` provides drop-in, zero-config React components for integrating Stellar Latin American fiat ramps into any Web application. Designed with modern enterprise dark mode, glassmorphism, radial glow gradients, vector SVG icons, and dynamic multi-language (i18n) support (English, Spanish, Portuguese).

---

## ✨ Included Components

- 🛒 **`<RampWidget />`**: Complete checkout flow featuring asset selectors, multi-anchor quote ranking, PIX QR code generation, 3-second heartbeat polling, and browser push notifications.
- 📈 **`<SavingsWidget />`**: Real-time yield monitoring dashboard connected to Etherfuse order history, tracking 13.25% APY yield accrual in real-time.
- 🚦 **`<StatusTracker />`**: Step-by-step animated order tracker with direct Stellar Explorer links.
- 🃏 **`<QuoteCard />`**: Interactive quote comparison cards displaying exchange rates, fees, and anchor badges.

---

## 📦 Installation

```bash
npm install @kevinbrenes/rampkit-ui @kevinbrenes/rampkit-core
```

---

## 💡 Quick Start & Usage Examples

```tsx
import React from 'react';
import { RampRouter } from '@kevinbrenes/rampkit-core';
import { RampWidget, SavingsWidget } from '@kevinbrenes/rampkit-ui';
import '@kevinbrenes/rampkit-ui/dist/styles/rampkit.css';

const router = new RampRouter({
  network: 'testnet',
  anchors: {
    etherfuse: { apiKey: 'YOUR_ETHERFUSE_API_KEY', sandbox: true },
  },
});

export function PaymentPage() {
  const userStellarAddress = 'GBAEGEMNJHS5KP5CORUKHYITFI562KK3WP3CO7YRU7B3522MSC6UZ22P';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
      {/* 1. Real-time TESOURO Yield Vault Monitor */}
      <SavingsWidget
        router={router}
        stellarAddress={userStellarAddress}
        locale="es" // 'en' | 'es' | 'pt-BR'
      />

      {/* 2. Drop-in PIX / SPEI Fiat Ramp Widget */}
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

## 🎨 Theme & Customization

The UI kit includes a standalone CSS file with CSS variables for effortless custom branding:

```css
@import '@kevinbrenes/rampkit-ui/dist/styles/rampkit.css';

:root {
  --rk-bg-primary: #0a0a0f;
  --rk-accent-color: #4ade80;
  --rk-font-family: 'Inter', sans-serif;
}
```

---

## 🔗 Related Resources

- ⚙️ [`@kevinbrenes/rampkit-core`](https://www.npmjs.com/package/@kevinbrenes/rampkit-core) — Underlying TypeScript Multi-Anchor Router SDK.
- 🌐 [Live Production Demo Playground](https://rampkit-latam.vercel.app)
- 🐙 [GitHub Repository](https://github.com/diegoucampos-tech/rampkit-latam)

---

## 📄 License

MIT © RampKit LATAM Team
