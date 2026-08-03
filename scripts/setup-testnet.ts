/**
 * setup-testnet.ts — Create testnet accounts for RampKit LATAM demo
 *
 * Creates owner + vault accounts, funds with XLM via Friendbot,
 * and adds USDC trustlines.
 *
 * Usage: npx tsx scripts/setup-testnet.ts
 */

import * as StellarSdk from '@stellar/stellar-sdk';
import * as fs from 'fs';
import * as path from 'path';

const FRIENDBOT_URL = 'https://friendbot.stellar.org';
const USDC_ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

interface AccountInfo {
  name: string;
  publicKey: string;
  secretKey: string;
}

async function fundAccount(publicKey: string): Promise<void> {
  const response = await fetch(`${FRIENDBOT_URL}?addr=${publicKey}`);
  if (!response.ok) {
    throw new Error(`Friendbot failed for ${publicKey}: ${response.statusText}`);
  }
  console.log(`  ✅ Funded: ${publicKey.slice(0, 8)}...${publicKey.slice(-4)}`);
}

async function addUsdcTrustline(
  server: StellarSdk.Horizon.Server,
  keypair: StellarSdk.Keypair,
): Promise<void> {
  const account = await server.loadAccount(keypair.publicKey());
  const usdcAsset = new StellarSdk.Asset('USDC', USDC_ISSUER);

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: '100',
    networkPassphrase: StellarSdk.Networks.TESTNET,
  })
    .addOperation(StellarSdk.Operation.changeTrust({ asset: usdcAsset }))
    .setTimeout(30)
    .build();

  tx.sign(keypair);
  await server.submitTransaction(tx);
  console.log(`  ✅ USDC trustline added for ${keypair.publicKey().slice(0, 8)}...`);
}

async function main(): Promise<void> {
  console.log('🚀 RampKit LATAM — Testnet Setup\n');

  const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');

  // Generate keypairs
  const accounts: AccountInfo[] = [
    {
      name: 'OWNER',
      ...(() => {
        const kp = StellarSdk.Keypair.random();
        return { publicKey: kp.publicKey(), secretKey: kp.secret() };
      })(),
    },
    {
      name: 'VAULT_ADMIN',
      ...(() => {
        const kp = StellarSdk.Keypair.random();
        return { publicKey: kp.publicKey(), secretKey: kp.secret() };
      })(),
    },
  ];

  // Fund accounts
  console.log('💰 Funding accounts via Friendbot...');
  for (const account of accounts) {
    await fundAccount(account.publicKey);
  }

  // Add USDC trustlines
  console.log('\n🔗 Adding USDC trustlines...');
  for (const account of accounts) {
    const keypair = StellarSdk.Keypair.fromSecret(account.secretKey);
    await addUsdcTrustline(server, keypair);
  }

  // Write .env file
  const envContent = accounts
    .map((a) => `${a.name}_PUBLIC_KEY=${a.publicKey}\n${a.name}_SECRET_KEY=${a.secretKey}`)
    .join('\n\n');

  const envExtra = `
# ─── Network ───────────────────────────────────────
STELLAR_NETWORK=testnet
HORIZON_URL=https://horizon-testnet.stellar.org
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org

# ─── USDC ──────────────────────────────────────────
USDC_ISSUER=${USDC_ISSUER}
# NOTE: Fund USDC manually via https://faucet.circle.com/ (requires CAPTCHA)

# ─── Anchor API Keys ──────────────────────────────
# Get from: https://sandbox.etherfuse.com
ETHERFUSE_API_KEY=
# Get from: https://manteca.dev
MANTECA_API_KEY=
# Get from: https://docs.koywe.com
KOYWE_API_KEY=

# ─── Contract (set after deploy) ──────────────────
SAVINGS_VAULT_CONTRACT_ID=
`;

  const envPath = path.join(__dirname, '..', '.env');
  fs.writeFileSync(envPath, envContent + '\n' + envExtra);

  console.log('\n📄 .env file written to:', envPath);
  console.log('\n📋 Accounts:');
  for (const account of accounts) {
    console.log(`  ${account.name}:`);
    console.log(`    Public:  ${account.publicKey}`);
    console.log(`    Secret:  ${account.secretKey}`);
  }

  console.log('\n⚠️  Next steps:');
  console.log('  1. Fund OWNER with USDC → https://faucet.circle.com/');
  console.log('  2. Get Etherfuse sandbox key → https://sandbox.etherfuse.com');
  console.log('  3. Deploy contract → ./scripts/deploy-contract.sh');
  console.log('\n✅ Setup complete!');
}

main().catch((err) => {
  console.error('❌ Setup failed:', err);
  process.exit(1);
});
