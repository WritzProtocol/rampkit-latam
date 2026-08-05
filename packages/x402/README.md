# rampkit-latam-x402

**Price your API in BRL, MXN, or CLP. Let AI agents pay in stablecoin.**

x402 lets you sell an HTTP resource to a machine: the server answers `402 Payment Required`, the
client pays on Stellar, the resource is returned. But x402 prices everything in the settlement
token — and a LATAM developer does not price in USDC. They price in reais and pesos.

This kit lets you declare prices in local currency and resolves them to a stablecoin amount on
every request, using live anchor rates from [`rampkit-latam-core`](https://www.npmjs.com/package/rampkit-latam-core).
Hardcode `0.0875 USDC` and your price drifts with the exchange rate. Declare `R$ 0,50` and it doesn't.

## Install

```bash
npm install rampkit-latam-x402 rampkit-latam-core express
```

## Sell an API

```ts
import express from 'express';
import { RampRouter } from 'rampkit-latam-core';
import { latamPaymentMiddleware } from 'rampkit-latam-x402';

const router = new RampRouter({
  network: 'testnet',
  anchors: { etherfuse: { apiKey: process.env.ETHERFUSE_API_KEY!, sandbox: true } },
});

const app = express();

app.use(latamPaymentMiddleware({
  router,
  payTo: process.env.STELLAR_RECIPIENT!,   // G... account, needs a USDC trustline
  ozApiKey: process.env.OZ_API_KEY!,       // required on testnet and mainnet
  routes: {
    'GET /cotacao': {
      price: { amount: '0.50', currency: 'BRL' },
      description: 'Cotação BRL/USDC — R$ 0,50 por chamada',
    },
  },
}));

app.get('/cotacao', (req, res) => res.json({ pair: 'BRL/USDC', rate: '0.175' }));
app.listen(3001);
```

## Buy as an agent

```ts
import { createLatamPaymentClient, quoteResource } from 'rampkit-latam-x402';

const pay = createLatamPaymentClient({ secretKey: process.env.STELLAR_SECRET_KEY! });

// Check the price before committing to it
const terms = await quoteResource('http://localhost:3001/cotacao');
if (Number(terms.amount) / 1e7 < 0.5) {
  const data = await (await pay('http://localhost:3001/cotacao')).json();
}
```

The payer needs the settlement token but **no XLM** — the facilitator sponsors network fees.

## API

| Export | Purpose |
|---|---|
| `latamPaymentMiddleware(config)` | Express middleware gating routes behind local-currency-priced x402 payment |
| `createLatamPaymentClient(config)` | `fetch` that transparently handles 402 negotiation and signing |
| `quoteResource(url)` | Read a resource's advertised price without paying it |
| `resolveLocalPrice(router, price, asset)` | Convert a local-currency price to token base units |
| `usdc(network)` | USDC settlement asset for `stellar:testnet` / `stellar:pubnet` |

Pricing currencies: `BRL`, `MXN`, `CLP`, `USD`. Anything else throws `UnsupportedCurrencyError`
rather than silently mispricing.

## How pricing resolves

Each request quotes the fiat→token corridor through the router and applies the live rate. If no
anchor can serve the corridor, a fallback rate keeps the API up rather than letting an anchor
outage take down a paid endpoint — `ResolvedPrice.source` tells you which path was taken, and
the `onPriceResolved` callback surfaces every charge for logging.

## Configuration

| Variable | Purpose |
|---|---|
| `STELLAR_RECIPIENT` | `G...` account receiving settlement (needs a USDC trustline) |
| `OZ_API_KEY` | OZ Channels key — [testnet](https://channels.openzeppelin.com/testnet/gen) / [mainnet](https://channels.openzeppelin.com/gen) |
| `STELLAR_SECRET_KEY` | Payer's `S...` secret (client side) |

Going to mainnet is a config change, not a code change: pass `network: 'stellar:pubnet'` and a
mainnet `ozApiKey`.

## Sample app

A complete FX API plus the agent that buys from it lives in
[`examples/x402-agent`](../../examples/x402-agent), including a setup script that provisions
funded testnet accounts with trustlines.

## License

MIT
