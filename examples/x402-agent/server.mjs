/**
 * Sample paid API: sells LATAM FX rates to AI agents.
 *
 * Both routes are priced in local currency. The kit resolves each price to a
 * stablecoin amount per request using live anchor rates, so the operator never
 * hardcodes a USDC figure that drifts as the corridor moves.
 */
import 'dotenv/config';
import express from 'express';
import { RampRouter } from 'rampkit-latam-core';
import { latamPaymentMiddleware } from 'rampkit-latam-x402';

const PORT = process.env.PORT || 3001;

if (!process.env.OZ_API_KEY || !process.env.STELLAR_RECIPIENT) {
  console.error(
    'Missing config. Set STELLAR_RECIPIENT (G...) and OZ_API_KEY in .env — see README.'
  );
  process.exit(1);
}

const router = new RampRouter({
  network: 'testnet',
  anchors: {
    etherfuse: { apiKey: process.env.ETHERFUSE_API_KEY || 'demo-key', sandbox: true },
    manteca: { apiKey: 'demo-key', sandbox: true },
    koywe: { apiKey: 'demo-key', sandbox: true },
  },
});

const app = express();

app.use(
  latamPaymentMiddleware({
    router,
    payTo: process.env.STELLAR_RECIPIENT,
    ozApiKey: process.env.OZ_API_KEY,
    network: process.env.STELLAR_NETWORK || 'stellar:testnet',
    routes: {
      'GET /cotacao': {
        price: { amount: '0.50', currency: 'BRL' },
        description: 'Cotação BRL/USDC em tempo real — R$ 0,50 por chamada',
      },
      'GET /tipo-cambio': {
        price: { amount: '2.00', currency: 'MXN' },
        description: 'Tipo de cambio MXN/USDC en tiempo real — $2.00 MXN por llamada',
      },
    },
    onPriceResolved: (route, price, resolved) => {
      console.log(
        `[price] ${route}: ${price.amount} ${price.currency} -> ${resolved.tokenAmount} USDC ` +
          `(rate ${resolved.rate}, ${resolved.source})`
      );
    },
  })
);

app.get('/cotacao', async (_req, res) => {
  const quote = await router.getBestQuote({
    direction: 'on-ramp',
    sourceAsset: 'BRL',
    destAsset: 'USDC',
    amount: '100',
    country: 'BR',
  });
  res.json({
    pair: 'BRL/USDC',
    rate: quote?.exchangeRate,
    anchor: quote?.anchorId,
    at: new Date().toISOString(),
  });
});

app.get('/tipo-cambio', async (_req, res) => {
  const quote = await router.getBestQuote({
    direction: 'on-ramp',
    sourceAsset: 'MXN',
    destAsset: 'USDC',
    amount: '1000',
    country: 'MX',
  });
  res.json({
    pair: 'MXN/USDC',
    rate: quote?.exchangeRate,
    anchor: quote?.anchorId,
    at: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`Paid FX API on http://localhost:${PORT}`);
  console.log('  GET /cotacao      R$ 0,50');
  console.log('  GET /tipo-cambio  $2.00 MXN');
});
