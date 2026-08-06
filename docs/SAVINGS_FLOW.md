# Savings Flow — PIX → USDC → TESOURO → Yield → PIX

## Overview

This document explains the end-to-end savings flow that RampKit LATAM enables:
a Brazilian user deposits BRL via PIX, earns ~13% APY from TESOURO (tokenized Brazilian government bonds), and withdraws back to PIX whenever they want.

## The Complete Flow

```mermaid
sequenceDiagram
    participant U as 🧑 User (Brazil)
    participant APP as PoupaStellar App
    participant SDK as rampkit-latam-core
    participant EF as Etherfuse API
    participant SN as Stellar Network
    participant SC as Soroban Vault

    rect rgb(10, 50, 10)
    Note over U, EF: Phase 1: ON-RAMP (PIX → USDC)
    U->>APP: "Quero depositar R$ 100"
    APP->>SDK: router.getQuotes({ BRL→USDC, 100 })
    SDK->>EF: POST /ramp/quote
    EF-->>SDK: Quote: R$ 100 → 17.50 USDC
    SDK-->>APP: quotes[]
    APP->>U: Shows PIX QR code
    U->>EF: Scans PIX QR → pays R$ 100
    EF->>SN: Sends 17.50 USDC to user's G... address
    end

    rect rgb(50, 10, 50)
    Note over APP, SC: Phase 2: DEPOSIT INTO VAULT
    APP->>SC: deposit(owner, 17.50 USDC)
    Note over SC: Validates amount > 0<br>Transfers USDC user→vault<br>Updates principal<br>Starts yield accrual
    SC-->>APP: ✅ Deposited
    end

    rect rgb(50, 50, 10)
    Note over SC, SC: Phase 3: YIELD ACCRUAL
    Note over SC: yield = principal × elapsed × rate_bps<br>           / (10,000 × 31,536,000)<br><br>At 13.25% APY on 17.50 USDC:<br>  Daily: ~$0.0064<br>  Monthly: ~$0.19<br>  Yearly: ~$2.32
    end

    rect rgb(10, 10, 50)
    Note over U, EF: Phase 4: OFF-RAMP (USDC → PIX)
    U->>APP: "Quero sacar"
    APP->>SC: withdraw_yield(owner, yield_amount)
    SC-->>APP: USDC transferred to user wallet
    APP->>SDK: router.getQuotes({ USDC→BRL, off-ramp })
    SDK->>EF: POST /ramp/quote (sell)
    EF-->>SDK: Quote: 2.32 USDC → R$ 13.24
    APP->>U: Confirms off-ramp
    EF->>U: PIX sent to user's bank account
    end
```

## How TESOURO Works

### What is TESOURO?

**TESOURO** is a tokenized Brazilian government bond (Letras do Tesouro Nacional — LTN) issued by **Etherfuse** as a "Stablebond" on the Stellar network.

| Property | Value |
|----------|-------|
| **Full Name** | Tokenized Brazilian Treasury Bond |
| **Underlying** | LTN (Letra do Tesouro Nacional) |
| **Yield** | ~13.25% APY (tracks Selic rate) |
| **Currency** | BRL-denominated |
| **Backing** | 1:1 reserve-backed by regulated custodians |
| **Network** | Stellar (also Solana, Base, Polygon) |
| **Issuer** | Etherfuse |

### How Yield Works

1. **NAV-Based**: TESOURO's price increases over time as the underlying bond accrues interest
2. **Compounding**: Yield compounds on-chain automatically
3. **Realization**: Users realize yield when they redeem TESOURO for USDC/BRL

### In Our Smart Contract

For the demo, the Soroban Savings Vault **simulates** TESOURO yield through a time-based accrual formula:

```
new_yield = principal × elapsed_seconds × rate_bps / (10,000 × 31,536,000)
```

In production, the contract would:
1. Accept USDC deposits
2. Swap USDC → TESOURO via Etherfuse's on-chain integration
3. Hold TESOURO tokens (which appreciate in value)
4. On withdrawal, swap TESOURO → USDC and send to user

## Soroban Contract — Savings Vault

### Key Functions

| Function | Who Can Call | What It Does |
|----------|-------------|--------------|
| `deposit(owner, amount)` | Owner | USDC → vault, starts earning yield |
| `withdraw_yield(owner, amount)` | Owner | Takes only profits, principal stays |
| `withdraw_principal(owner, amount)` | Owner | Partial principal withdrawal |
| `withdraw_all(owner)` | Owner | Emergency exit: everything |
| `get_state()` | Anyone | Returns full vault state |
| `get_available_yield()` | Anyone | Current claimable yield |

### Security Model

1. **`require_owner()`** — Every write function validates caller is the vault owner
2. **`require_auth()`** — Soroban native authentication (no custom crypto)
3. **Overflow protection** — `checked_mul()` prevents arithmetic overflow
4. **TTL management** — Storage entries are extended on every interaction

### Demo vs Production Rates

| Setting | Demo | Production |
|---------|------|-----------|
| `yield_rate_bps` | 500,000 (5,000% APY) | 1,325 (13.25% APY) |
| Purpose | See yield move in real time | Match actual TESOURO rate |
| Yield per hour (on $1,000) | ~$5.71 | ~$0.0151 |

`rate_bps` is an annual rate in basis points, so the annual multiplier is `rate_bps / 10,000` — 500,000 bps means 50× per year (5,000% APY), and 1,325 bps means 0.1325× (13.25% APY). `scripts/deploy-contract.sh` deploys with the demo rate so yield is visible within seconds; change `--yield_rate_bps` to `1325` for a realistic deployment.

## Regulatory Considerations

> [!WARNING]
> This is a hackathon demo, not a financial product. Production deployment requires:

1. **SPSAV Registration** — Brazil requires Virtual Asset Service Providers to register with the Central Bank (BCB)
2. **CPF Matching** — All PIX transactions must match the user's CPF (tax ID)
3. **Asset Segregation** — User funds must be segregated from operational funds
4. **FX Reporting** — Stablecoin operations may be classified as foreign exchange
5. **KYC/AML** — All anchors handle KYC; apps should verify compliance status

## Why This Architecture?

### Why not just buy TESOURO directly?

You can — but the UX is terrible:
1. You need a Stellar wallet
2. You need to understand what a "Stablebond" is
3. You need to interact with Etherfuse's API directly
4. You need to manage trustlines
5. There's no single-step "PIX → earn yield → PIX out" flow

**RampKit LATAM abstracts all of this** into `<SavingsWidget />` — the user sees "deposit via PIX, earn 13%, withdraw via PIX."

### Why a Soroban contract?

The smart contract adds:
- **On-chain yield policy** — can't withdraw more than you've earned
- **Composability** — other contracts can interact with the vault
- **Transparency** — all yield calculations are verifiable on-chain
- **Automation** — yield accrues without any off-chain service
