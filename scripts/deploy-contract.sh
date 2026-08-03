#!/bin/bash
# ─────────────────────────────────────────────────────────────
# deploy-contract.sh — Build and deploy the Savings Vault to Stellar Testnet
# ─────────────────────────────────────────────────────────────

set -euo pipefail

echo "🏗️  Building Savings Vault contract..."
cd "$(dirname "$0")/.."

# Build the contract WASM
stellar contract build --manifest-path contracts/savings-vault/Cargo.toml

WASM_PATH="target/wasm32-unknown-unknown/release/rampkit_savings_vault.wasm"

if [ ! -f "$WASM_PATH" ]; then
  echo "❌ Build failed — WASM not found at $WASM_PATH"
  exit 1
fi

echo "✅ Built: $WASM_PATH"
echo "📦 Size: $(wc -c < "$WASM_PATH") bytes"

# Check for required env vars
if [ -z "${OWNER_SECRET:-}" ]; then
  echo ""
  echo "⚠️  Set these env vars before deploying:"
  echo "  export OWNER_SECRET=S..."
  echo "  export USDC_TOKEN=C..."
  echo "  export TESOURO_TOKEN=C..."
  echo ""
  echo "  Then run: stellar contract deploy \\"
  echo "    --wasm $WASM_PATH \\"
  echo "    --source \$OWNER_SECRET \\"
  echo "    --network testnet"
  exit 0
fi

echo "🚀 Deploying to Stellar Testnet..."

CONTRACT_ID=$(stellar contract deploy \
  --wasm "$WASM_PATH" \
  --source "$OWNER_SECRET" \
  --network testnet)

echo "✅ Deployed!"
echo "📋 Contract ID: $CONTRACT_ID"

# Initialize the contract
if [ -n "${USDC_TOKEN:-}" ] && [ -n "${TESOURO_TOKEN:-}" ]; then
  echo "🔧 Initializing contract..."

  OWNER_PK=$(stellar keys address "$OWNER_SECRET" 2>/dev/null || echo "")

  stellar contract invoke \
    --id "$CONTRACT_ID" \
    --source "$OWNER_SECRET" \
    --network testnet \
    -- \
    __constructor \
    --owner "$OWNER_PK" \
    --usdc_token "$USDC_TOKEN" \
    --tesouro_token "$TESOURO_TOKEN" \
    --yield_rate_bps 500000

  echo "✅ Initialized with 50,000% demo APY"
fi

echo ""
echo "📌 Add to your .env:"
echo "SAVINGS_VAULT_CONTRACT_ID=$CONTRACT_ID"
