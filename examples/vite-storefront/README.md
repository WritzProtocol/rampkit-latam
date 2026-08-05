# Vite Storefront — second-app example

A fictional Brazilian solar-panel store that accepts PIX and settles in USDC on Stellar.

Its only purpose is to prove the bounty's reusability bar: **"works in a second app."** Nothing
here is linked to the RampKit monorepo. This project is deliberately excluded from the root
npm workspace, so `npm install` resolves `rampkit-latam-core` and `rampkit-latam-ui` from the
public npm registry exactly as any third-party developer would get them — and it's built on
Vite, not the Next.js stack the main demo uses.

## Run it

```bash
cd examples/vite-storefront
npm install
npm run dev     # http://localhost:5173
```

## What integration actually costs

The entire checkout is a router instance plus one component:

```tsx
import { RampRouter } from 'rampkit-latam-core';
import { RampWidget } from 'rampkit-latam-ui';
import 'rampkit-latam-ui/src/styles/rampkit.css';

const router = new RampRouter({
  network: 'testnet',
  anchors: { etherfuse: { apiKey: '...', sandbox: true } },
});

<RampWidget router={router} stellarAddress="G..." defaultCountry="BR" locale="pt-BR" />
```

Clicking **Comprar com PIX** opens the widget, which queries every configured anchor in
parallel and renders the comparison — on a R$2.400 order it returns Etherfuse at 413,70 USDC
(1.5% fee) against Manteca at 403,56 USDC (5.0% fee), flagging the better rate.

## API keys

Without real credentials the anchor sandboxes return 401 and the SDK falls back to simulated
quotes, which is why the demo works out of the box. To hit the live Etherfuse sandbox, add:

```bash
echo "VITE_ETHERFUSE_API_KEY=your_key" > .env.local
```
