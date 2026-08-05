/**
 * Provisions the two testnet accounts x402 needs: a recipient (receives
 * settlement) and a payer (the agent). Both need a USDC trustline — without one
 * on the recipient, the SAC transfer fails at settlement with op_no_trust.
 *
 * Two steps can't be scripted (both are Captcha/auth-gated) and are printed at
 * the end: funding the payer with test USDC, and generating an OZ Channels key.
 */
import fs from 'fs/promises';
import {
  Keypair,
  Horizon,
  Networks,
  TransactionBuilder,
  Operation,
  Asset,
  BASE_FEE,
} from '@stellar/stellar-sdk';

const USDC_ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
const horizon = new Horizon.Server('https://horizon-testnet.stellar.org');

async function fund(address) {
  const res = await fetch(`https://friendbot.stellar.org?addr=${address}`);
  if (!res.ok) throw new Error(`Friendbot failed for ${address}`);
}

async function addTrustline(kp) {
  const account = await horizon.loadAccount(kp.publicKey());
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(Operation.changeTrust({ asset: new Asset('USDC', USDC_ISSUER) }))
    .setTimeout(60)
    .build();
  tx.sign(kp);
  return horizon.submitTransaction(tx);
}

const recipient = Keypair.random();
const payer = Keypair.random();

console.log('Funding accounts via Friendbot...');
await Promise.all([fund(recipient.publicKey()), fund(payer.publicKey())]);
await new Promise((r) => setTimeout(r, 2000));

console.log('Adding USDC trustlines...');
await Promise.all([addTrustline(recipient), addTrustline(payer)]);

await fs.writeFile(
  '.env',
  `STELLAR_NETWORK=stellar:testnet
STELLAR_RECIPIENT=${recipient.publicKey()}
STELLAR_SECRET_KEY=${payer.secret()}
OZ_API_KEY=
`
);

console.log('\nWrote .env. Two manual steps remain:\n');
console.log(`  1. Fund the payer with test USDC: https://faucet.circle.com`);
console.log(`     (select Stellar testnet, paste ${payer.publicKey()})`);
console.log(`  2. Generate an OZ Channels key: https://channels.openzeppelin.com/testnet/gen`);
console.log(`     then set OZ_API_KEY in .env\n`);
