import { useState } from 'react';
import { RampRouter } from 'rampkit-latam-core';
import { RampWidget } from 'rampkit-latam-ui';
import 'rampkit-latam-ui/src/styles/rampkit.css';
import './app.css';

// A different app, a different stack (Vite instead of Next.js), the same two
// npm packages. Nothing from the RampKit monorepo is linked here.
const router = new RampRouter({
  network: 'testnet',
  anchors: {
    etherfuse: { apiKey: import.meta.env.VITE_ETHERFUSE_API_KEY ?? 'demo-key', sandbox: true },
    manteca: { apiKey: 'demo-key', sandbox: true },
    koywe: { apiKey: 'demo-key', sandbox: true },
  },
});

const PRODUCT = {
  name: 'Kit Solar Residencial 600W',
  priceBrl: 2400,
  blurb: 'Painel + inversor + instalação. Pague via PIX, liquidado em USDC na Stellar.',
};

export function App() {
  const [checkout, setCheckout] = useState(false);

  return (
    <div className="page">
      <header>
        <span className="logo">Loja Solar</span>
        <span className="badge">second-app example</span>
      </header>

      <main>
        <section className="product">
          <div className="thumb">☀️</div>
          <h1>{PRODUCT.name}</h1>
          <p className="blurb">{PRODUCT.blurb}</p>
          <div className="price">
            R$ {PRODUCT.priceBrl.toLocaleString('pt-BR')}
          </div>
          {!checkout && (
            <button className="buy" onClick={() => setCheckout(true)}>
              Comprar com PIX
            </button>
          )}
        </section>

        {checkout && (
          <section className="checkout">
            <h2>Checkout</h2>
            <RampWidget
              router={router}
              stellarAddress="GBAEGEMNJHS5KP5CORUKHYITFI562KK3WP3CO7YRU7B3522MSC6UZ22P"
              defaultCountry="BR"
              locale="pt-BR"
              onComplete={(order) => console.log('order complete', order)}
            />
          </section>
        )}
      </main>

      <footer>
        Powered by <code>rampkit-latam-core</code> + <code>rampkit-latam-ui</code>, installed from npm.
      </footer>
    </div>
  );
}
