# UI Kit Guide — `@rampkit/ui`

## Installation

```bash
npm install @rampkit/ui @rampkit/core
```

## Quick Start

```tsx
import { RampRouter } from '@rampkit/core';
import { RampWidget } from '@rampkit/ui';
import '@rampkit/ui/src/styles/rampkit.css';

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
import '@rampkit/ui/src/styles/rampkit.css';
```

### Customizing Colors

Override CSS custom properties:

```css
:root {
  --rk-gradient-primary: linear-gradient(135deg, #00b4d8 0%, #023e8a 100%);
  --rk-text-accent: #00b4d8;
  --rk-bg-card: rgba(2, 62, 138, 0.7);
}
```

### Key CSS Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `--rk-bg-primary` | `#0a0b14` | Main background |
| `--rk-bg-card` | `rgba(17, 18, 39, 0.7)` | Card background |
| `--rk-gradient-primary` | Purple gradient | Primary accent |
| `--rk-gradient-success` | Green gradient | Success states |
| `--rk-text-primary` | `#f0f0f8` | Main text |
| `--rk-text-accent` | `#667eea` | Accent text |
| `--rk-radius-lg` | `16px` | Card border radius |

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
