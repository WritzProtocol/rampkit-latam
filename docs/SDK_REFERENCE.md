# SDK Reference — `rampkit-latam-core`

## RampRouter

The main entry point. Manages multiple anchor adapters and provides smart routing.

### Constructor

```typescript
const router = new RampRouter(config: RampKitConfig);
```

#### `RampKitConfig`

| Property | Type | Description |
|----------|------|-------------|
| `network` | `'testnet' \| 'pubnet'` | Stellar network |
| `anchors` | `Partial<Record<AnchorId, AnchorConfig>>` | Per-anchor config |
| `defaultStrategy` | `'cheapest' \| 'fastest' \| 'most_reliable'` | Default quote ranking |
| `webhookUrl` | `string?` | URL for order status webhooks |

#### `AnchorConfig`

| Property | Type | Description |
|----------|------|-------------|
| `apiKey` | `string` | API key or access token |
| `apiSecret` | `string?` | API secret (if required) |
| `sandbox` | `boolean?` | Use sandbox environment (auto-set in testnet) |
| `baseUrl` | `string?` | Custom API base URL override |

---

### Methods

#### `getQuotes(params, strategy?)`

Get quotes from all configured anchors in parallel.

```typescript
const quotes = await router.getQuotes({
  direction: 'on-ramp',
  sourceAsset: 'BRL',
  destAsset: 'USDC',
  amount: '100',
  country: 'BR',
}, 'cheapest');
```

**Parameters:**

| Field | Type | Description |
|-------|------|-------------|
| `direction` | `'on-ramp' \| 'off-ramp'` | Buy or sell crypto |
| `sourceAsset` | `string` | Source currency (e.g., `'BRL'`) |
| `destAsset` | `string` | Destination (e.g., `'USDC'`, `'TESOURO'`) |
| `amount` | `string` | Amount in source currency |
| `country` | `'BR' \| 'MX' \| 'CL' \| 'US'` | Country code |
| `anchorIds?` | `AnchorId[]` | Filter specific anchors |
| `paymentMethod?` | `PaymentMethod` | Filter payment method |

**Returns:** `Promise<RampQuote[]>` — Sorted by strategy.

---

#### `getBestQuote(params, strategy?)`

Convenience wrapper — returns only the top quote.

```typescript
const best = await router.getBestQuote(params);
```

---

#### `executeRamp(quote, stellarAddress, options?)`

Execute a ramp order using a specific quote.

```typescript
const order = await router.executeRamp(
  quotes[0],
  'GABCD...1234',
  { email: 'user@example.com', taxId: '123.456.789-00' }
);
```

**Returns:** `Promise<RampOrder>` with payment details (PIX QR code, etc.)

---

#### `getStatus(orderId, anchorId)`

Check order status. Works across any anchor.

```typescript
const status = await router.getStatus('ef_abc123', 'etherfuse');
```

---

#### `getRemittanceQuote(params, strategy?)`

> **Requires `rampkit-latam-core` ≥ 1.1.0.** The remittance API is not in the currently
> published `1.0.1` — calling it against that version throws
> `router.getRemittanceQuote is not a function`. Build from source until 1.1.0 is published.

Quote a cross-border transfer as a single route. Composes an on-ramp in the sender's country
with an off-ramp in the recipient's, bridged by a stablecoin. Each leg is quoted independently
across all configured anchors, so send and receive may resolve to different providers.

```typescript
const route = await router.getRemittanceQuote({
  fromCountry: 'BR', fromCurrency: 'BRL',
  toCountry: 'MX',   toCurrency: 'MXN',
  amount: '500',
  // bridgeAsset: 'USDC'  // optional, defaults to USDC
});
```

**Returns:** `Promise<RemittanceQuote | null>` — `null` when either corridor has no available quote.

| Field | Type | Description |
|-------|------|-------------|
| `sendLeg` | `RampQuote` | On-ramp leg: sender's fiat → bridge asset |
| `receiveLeg` | `RampQuote` | Off-ramp leg: bridge asset → recipient's fiat |
| `bridgeAsset` | `CryptoAsset` | Stablecoin bridging the legs |
| `sendAmount` | `string` | What the sender pays |
| `receiveAmount` | `string` | What the recipient receives, after all fees |
| `effectiveRate` | `string` | End-to-end rate (1 source unit = X dest units) |
| `totalFees` | `string` | Both legs' fees, expressed in the sender's currency |
| `totalFeePercentage` | `number` | Combined fee percentage |
| `estimatedSeconds` | `number` | End-to-end settlement estimate |
| `expiresAt` | `Date` | Earliest expiry across both legs |

---

#### `executeRemittance(quote, stellarAddress, options?)`

Executes the **send leg only**, returning the payment instructions the sender must satisfy.
Once that order settles, execute `quote.receiveLeg` via `executeRamp()` to pay out the recipient.

```typescript
const order = await router.executeRemittance(route, 'GABCD...1234');
console.log(order.quote.paymentDetails?.pixCopyPaste);
```

---

#### `getRemittanceCorridors()`

Every origin/destination pair the configured anchors can serve end-to-end.

```typescript
const pairs = router.getRemittanceCorridors();
// [{ from: Corridor, to: Corridor }, ...]  — 26 pairs with all three anchors configured
```

---

#### `getSupportedCorridors()`

List all supported country/currency/asset combinations.

```typescript
const corridors = router.getSupportedCorridors();
// [{ country: 'BR', fiatCurrency: 'BRL', cryptoAssets: ['USDC', 'TESOURO'], ... }]
```

---

#### `getAssets()`

Get all tokenized assets across all anchors.

```typescript
const assets = await router.getAssets();
const tesouro = assets.find(a => a.code === 'TESOURO');
console.log(`TESOURO APY: ${tesouro.apy}%`);
```

---

#### `getYieldBearingAssets()`

Filter for yield-bearing stablebonds only.

```typescript
const yieldAssets = await router.getYieldBearingAssets();
// Returns TESOURO (~13% APY), CETES (~10.5%), USTRY (~4.8%)
```

---

#### `on(listener)`

Subscribe to router events.

```typescript
const unsubscribe = router.on((event) => {
  switch (event.type) {
    case 'quote_received':
      console.log(`Got ${event.quotes.length} quotes`);
      break;
    case 'order_completed':
      console.log(`Order done! TX: ${event.order.stellarTxHash}`);
      break;
    case 'error':
      console.error(`${event.anchorId} error: ${event.error}`);
      break;
  }
});

// Later: unsubscribe();
```

---

## Types

### `RampQuote`

| Field | Type | Description |
|-------|------|-------------|
| `anchorId` | `AnchorId` | Which anchor |
| `anchorQuoteId` | `string` | Anchor's internal ID |
| `direction` | `RampDirection` | on-ramp or off-ramp |
| `sourceAsset` | `string` | Source currency |
| `destAsset` | `string` | Destination asset |
| `sourceAmount` | `string` | Amount you pay |
| `destAmount` | `string` | Amount you receive |
| `exchangeRate` | `string` | Rate |
| `fees` | `RampFees` | Fee breakdown |
| `estimatedSeconds` | `number` | Settlement time |
| `expiresAt` | `Date` | Quote expiration |
| `paymentMethod` | `PaymentMethod` | PIX, SPEI, etc. |
| `country` | `Country` | Country code |
| `paymentDetails?` | `PaymentDetails` | PIX QR, SPEI CLABE, etc. |

### `RampOrder`

| Field | Type | Description |
|-------|------|-------------|
| `orderId` | `string` | RampKit order ID |
| `anchorOrderId` | `string` | Anchor's ID |
| `anchorId` | `AnchorId` | Which anchor |
| `status` | `OrderStatus` | Current status |
| `quote` | `RampQuote` | Original quote |
| `stellarAddress` | `string` | User's address |
| `stellarTxHash?` | `string` | Stellar TX |
| `createdAt` | `Date` | Creation time |
| `updatedAt` | `Date` | Last update |

### `OrderStatus`

`'pending_payment'` → `'payment_received'` → `'processing'` → `'stellar_pending'` → `'completed'`

Or: `'failed'` | `'expired'` | `'refunded'`

---

## Anchor Adapters

For advanced use, you can use individual adapters directly:

```typescript
import { EtherfuseAdapter } from 'rampkit-latam-core';

const etherfuse = new EtherfuseAdapter({
  apiKey: 'your-key',
  sandbox: true,
});

const assets = await etherfuse.getAssets();
```
