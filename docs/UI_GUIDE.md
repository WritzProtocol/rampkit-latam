# UI Kit Guide — `rampkit-latam-ui`

## Installation

```bash
npm install rampkit-latam-ui rampkit-latam-core
```

## Quick Start

```tsx
import { RampRouter } from 'rampkit-latam-core';
import { RampWidget } from 'rampkit-latam-ui';
import 'rampkit-latam-ui/src/styles/rampkit.css';

const router = new RampRouter({
  network: 'testnet',
  anchors: {
    etherfuse: { apiKey: 'your-key' },
    manteca: { apiKey: 'your-key' },
  },
});

function App() {
  return (
    <RampWidget
      router={router}
      stellarAddress="GABCD...1234"
      defaultCountry="BR"
      locale="pt-BR"
      onComplete={(order) => alert('Done!')}
    />
  );
}
```

That's it — 3 lines of code to add multi-anchor ramps to any React app.

---

## Components

### `<RampWidget />`

The main drop-in widget. Handles the entire on/off-ramp flow.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `router` | `RampRouter` | *required* | Configured router instance |
| `stellarAddress` | `string` | *required* | User's Stellar address |
| `defaultCountry` | `Country` | `'BR'` | Default country selection |
| `defaultDirection` | `RampDirection` | `'on-ramp'` | Default buy/sell |
| `locale` | `'pt-BR' \| 'es' \| 'en'` | `'pt-BR'` | Language |
| `onComplete` | `(order: RampOrder) => void` | — | Called on completion |
| `onError` | `(error: Error) => void` | — | Called on error |
| `className` | `string` | — | Custom CSS class |

**What it includes:**
1. Buy/Sell direction toggle
2. Amount input with currency selector (BRL/MXN/CLP)
3. Crypto asset selector (USDC/TESOURO/CETES)
4. Multi-anchor quote cards with "Best Rate" badge
5. PIX QR code / SPEI CLABE display
6. Order status tracker
7. Completion state with "New Transaction" button

---

### `<SavingsWidget />`

Displays TESOURO yield and savings vault state.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `router` | `RampRouter` | *required* | Router instance |
| `vaultState` | `VaultState` | — | Soroban contract state |
| `stellarAddress` | `string` | *required* | User's address |
| `locale` | `'pt-BR' \| 'es' \| 'en'` | `'pt-BR'` | Language |
| `onDeposit` | `(amount: string) => void` | — | Deposit action |
| `onWithdraw` | `(amount: string) => void` | — | Withdraw action |

**`VaultState` shape:**
```typescript
interface VaultState {
  principal: number;       // USDC deposited (7 decimals)
  accruedYield: number;    // Yield earned
  totalWithdrawn: number;  // Total withdrawn
  yieldRateBps: number;    // APY in basis points
  totalBalance: number;    // principal + yield
  dailyYield: number;      // Daily yield amount
  depositCount: number;    // Number of deposits
}
```

---

### `<QuoteCard />`

Individual quote display card.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `quote` | `RampQuote` | *required* | Quote data |
| `isBest` | `boolean` | `false` | Show "Best Rate" badge |
| `isSelected` | `boolean` | `false` | Selected state |
| `onSelect` | `(quote: RampQuote) => void` | — | Selection handler |
| `locale` | `string` | `'pt-BR'` | Language |

---

### `<StatusTracker />`

Order progress visualization.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `status` | `OrderStatus` | *required* | Current status |
| `stellarTxHash` | `string?` | — | Stellar TX hash |
| `statusMessage` | `string?` | — | Status message |
| `locale` | `string` | `'pt-BR'` | Language |
| `network` | `'testnet' \| 'pubnet'` | `'testnet'` | For explorer link |

---

## Styling

### Importing the Theme

```tsx
import 'rampkit-latam-ui/src/styles/rampkit.css';
```

### Customizing Colors

The default theme is a monochrome dark palette. Override any custom property to rebrand:

```css
:root {
  --rk-gradient-primary: #00b4d8;
  --rk-text-accent: #00b4d8;
  --rk-bg-card: #0b1a2b;
}
```

### Key CSS Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `--rk-bg-primary` | `#0A0A0A` | Main background |
| `--rk-bg-card` | `#111111` | Card background |
| `--rk-bg-secondary` | — | Secondary surface |
| `--rk-border` | — | Default border color |
| `--rk-gradient-primary` | `#ffffff` | Primary accent |
| `--rk-gradient-success` | `#22c55e` | Success states |
| `--rk-text-primary` | `#ffffff` | Main text |
| `--rk-text-secondary` | — | Muted text |
| `--rk-text-accent` | `#ffffff` | Accent text |
| `--rk-font` | — | Base font stack |
| `--rk-radius-lg` | `16px` | Card border radius |

Despite the `--rk-gradient-*` names, these are flat colors in the current theme — the names are kept for backward compatibility. Run `grep -- '--rk-' node_modules/rampkit-latam-ui/src/styles/rampkit.css` for the full list.

---

## Localization

All components support three languages out of the box:

| Locale | Language | Labels |
|--------|----------|--------|
| `pt-BR` | Portuguese (Brazil) | Default — "Comprar", "Buscar cotações", "Concluído" |
| `es` | Spanish | "Comprar", "Buscar cotizaciones", "Completado" |
| `en` | English | "Buy", "Get quotes", "Complete" |

Pass `locale` prop to any component:

```tsx
<RampWidget locale="pt-BR" ... />
<SavingsWidget locale="es" ... />
```
