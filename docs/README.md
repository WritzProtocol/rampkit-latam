# RampKit LATAM — Documentation

## Getting Started

### Prerequisites

- **Node.js** 20+ and npm
- **Rust** (for Soroban contract compilation)
- **Stellar CLI** (`stellar` command)

### 1. Clone & Install

```bash
git clone https://github.com/WritzProtocol/rampkit-latam.git
cd rampkit-latam
npm install
```

### 2. Create Testnet Accounts

```bash
npx tsx scripts/setup-testnet.ts
```

This will:
- Generate Owner and Vault Admin keypairs
- Fund them with XLM via Friendbot
- Add USDC trustlines
- Write a `.env` file with all credentials

### 3. Get Anchor API Keys

| Anchor | Sandbox URL | What to do |
|--------|------------|------------|
| **Etherfuse** | [sandbox.etherfuse.com](https://sandbox.etherfuse.com) | Create account → Create business org → Generate API key |
| **Manteca** | [manteca.dev](https://manteca.dev) | Contact brazil@manteca.dev for sandbox access |
| **Koywe** | [docs.koywe.com](https://docs.koywe.com) | Sign up for sandbox API key |

Add keys to your `.env`:
```env
ETHERFUSE_API_KEY=your_key_here
MANTECA_API_KEY=your_key_here
KOYWE_API_KEY=your_key_here
```

### 4. Fund USDC (Manual Step)

Go to [Circle USDC Faucet](https://faucet.circle.com/) and send testnet USDC to your Owner address. This requires solving a CAPTCHA and cannot be scripted.

### 5. Deploy the Soroban Contract

```bash
chmod +x scripts/deploy-contract.sh
./scripts/deploy-contract.sh
```

### 6. Build & Run

```bash
# Build the SDK
npm run build

# Run the demo app
npm run dev
```

## Project Documentation

- **[SDK Reference](SDK_REFERENCE.md)** — Full API docs for `rampkit-latam-core`
- **[UI Kit Guide](UI_GUIDE.md)** — How to use `rampkit-latam-ui` components
- **[Savings Flow](SAVINGS_FLOW.md)** — Technical deep-dive into the PIX→TESOURO yield loop
