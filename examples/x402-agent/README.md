# x402 Agent Example — a LATAM API sold to machines

A paid FX-rate API priced in **BRL and MXN**, sold to AI agents over x402, plus the agent
that buys from it. This is the sample app for [`rampkit-latam-x402`](../../packages/x402).

## The problem it solves

x402 settles in a stablecoin, so its prices are denominated in tokens. A Brazilian developer
does not think in USDC — they think "R$ 0,50 per call." Hardcoding the USDC equivalent means
the price silently drifts as BRL/USDC moves.

`rampkit-latam-x402` closes that gap: you declare the price in local currency, and the kit
resolves it to a token amount **per request** using the same `RampRouter` that powers RampKit's
ramps, so the charge always tracks the live corridor rate.

```js
app.use(latamPaymentMiddleware({
  router,
  payTo: process.env.STELLAR_RECIPIENT,
  ozApiKey: process.env.OZ_API_KEY,
  routes: {
    'GET /cotacao':     { price: { amount: '0.50', currency: 'BRL' } },
    'GET /tipo-cambio': { price: { amount: '2.00', currency: 'MXN' } },
  },
}));
```

Resolution verified against live anchor quotes:

| Declared price | Settles as | Rate source |
|---|---|---|
| R$ 0,50 | 0.0875000 USDC (`875000` base units) | anchor quote |
| $2.00 MXN | 0.1040000 USDC (`1040000` base units) | anchor quote |
| 500 CLP | 0.5250000 USDC | fallback (no CLP anchor configured) |

Unsupported currencies are rejected up front rather than mispriced.

## Setup

```bash
npm install
npm run setup      # creates 2 testnet accounts + USDC trustlines, writes .env
```

`setup.mjs` handles everything scriptable. **Two steps are Captcha-gated and must be done by
hand** — the run prints both with the addresses filled in:

1. Fund the payer with test USDC at [faucet.circle.com](https://faucet.circle.com) (select Stellar testnet)
2. Generate an OZ Channels key at [channels.openzeppelin.com/testnet/gen](https://channels.openzeppelin.com/testnet/gen), then set `OZ_API_KEY` in `.env`

Step 2 is not optional. The facilitator verifies and settles every payment, and without a valid
key the server exits at startup with `no supported payment kinds loaded from any facilitator`.

## Run

```bash
npm run server     # terminal 1 — http://localhost:3001
npm run agent      # terminal 2
```

The agent checks each resource's advertised price first, applies a per-call budget, and only
then pays:

```
/cotacao
  asking 0.0875 USDC — Cotação BRL/USDC em tempo real — R$ 0,50 por chamada
  paid, got: { pair: 'BRL/USDC', rate: '0.175000', anchor: 'etherfuse', ... }
```

The agent's account holds USDC but **no XLM** — the facilitator sponsors network fees, so
agents never need to manage a gas balance.

## Verification status

The kit compiles, the middleware wires up, the local-currency pricing is verified against live
anchor rates (table above), and `npm run setup` provisions real funded testnet accounts with
trustlines. **The end-to-end paid request has not been run**, because it requires the two
credentials above, which are Captcha-gated and cannot be provisioned programmatically.

## Note on the local dependency

`rampkit-latam-x402` is referenced as `file:../../packages/x402` because it is not published to
npm yet. Once published, this becomes a normal registry dependency.
