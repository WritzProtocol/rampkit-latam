import { RampRouter } from '@rampkit/core';

// Server-side initialized RampRouter with API keys from environment
export const router = new RampRouter({
  network: process.env.STELLAR_NETWORK === 'pubnet' ? 'pubnet' : 'testnet',
  anchors: {
    etherfuse: {
      apiKey: process.env.ETHERFUSE_API_KEY || 'demo-key',
      sandbox: true,
    },
    manteca: {
      apiKey: process.env.MANTECA_API_KEY || 'demo-key',
      sandbox: true,
    },
    koywe: {
      apiKey: process.env.KOYWE_API_KEY || 'demo-key',
      sandbox: true,
    },
  },
});
