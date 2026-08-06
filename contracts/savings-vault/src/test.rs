#![cfg(test)]

use soroban_sdk::{
    testutils::{Address as _, Ledger, LedgerInfo},
    token::{StellarAssetClient, TokenClient},
    Address, Env,
};

use crate::vault::{SavingsVault, SavingsVaultClient};

/// Helper: Create a test environment with a deployed savings vault.
fn setup_vault() -> (
    Env,
    Address,            // vault contract
    Address,            // owner
    Address,            // usdc token
    Address,            // tesouro token
    SavingsVaultClient<'static>,
) {
    let env = Env::default();
    env.mock_all_auths();

    // Set initial ledger timestamp
    env.ledger().set(LedgerInfo {
        timestamp: 1_000_000,
        protocol_version: 22,
        sequence_number: 100,
        network_id: Default::default(),
        base_reserve: 10,
        min_temp_entry_ttl: 100,
        min_persistent_entry_ttl: 100,
        max_entry_ttl: 10_000_000,
    });

    let owner = Address::generate(&env);

    // Deploy USDC mock token
    let usdc_admin = Address::generate(&env);
    let usdc_contract = env.register_stellar_asset_contract_v2(usdc_admin.clone());
    let usdc_address = usdc_contract.address();
    let usdc_sac = StellarAssetClient::new(&env, &usdc_address);

    // Mint USDC to owner (10,000 USDC with 7 decimals)
    usdc_sac.mint(&owner, &100_000_000_000);

    // Deploy TESOURO mock token (not used directly in demo, but part of the model)
    let tesouro_admin = Address::generate(&env);
    let tesouro_contract = env.register_stellar_asset_contract_v2(tesouro_admin.clone());
    let tesouro_address = tesouro_contract.address();

    // Deploy the savings vault with 13.25% APY (1325 bps)
    // For demo, use 500_000 bps (5,000% APY) to see fast yield
    let vault_id = env.register(
        SavingsVault,
        (
            owner.clone(),
            usdc_address.clone(),
            tesouro_address.clone(),
            500_000u32, // Demo rate: fast yield accrual
        ),
    );
    let client = SavingsVaultClient::new(&env, &vault_id);

    // Leak the env to get 'static lifetime (test-only pattern)
    let env = unsafe { std::mem::transmute::<Env, Env>(env) };
    let client = SavingsVaultClient::new(&env, &vault_id);

    (env, vault_id, owner, usdc_address, tesouro_address, client)
}

fn advance_time(env: &Env, seconds: u64) {
    let mut ledger = env.ledger().get();
    ledger.timestamp += seconds;
    ledger.sequence_number += (seconds / 5) as u32; // ~5s per ledger
    env.ledger().set(ledger);
}

// ─── Tests ─────────────────────────────────────────────────────

#[test]
fn test_deposit() {
    let (env, _vault_id, owner, usdc_address, _, client) = setup_vault();

    // Deposit 1000 USDC (with 7 decimals)
    let amount = 10_000_000_000i128; // 1000 USDC
    client.deposit(&owner, &amount);

    let state = client.get_state();
    assert_eq!(state.principal, amount);
    assert_eq!(state.deposit_count, 1);
    assert_eq!(state.accrued_yield, 0);

    // Check USDC was transferred
    let usdc = TokenClient::new(&env, &usdc_address);
    let vault_balance = usdc.balance(&_vault_id);
    assert_eq!(vault_balance, amount);
}

#[test]
fn test_yield_accrual() {
    let (_env, _vault_id, owner, _, _, client) = setup_vault();

    // Deposit 1000 USDC
    let amount = 10_000_000_000i128;
    client.deposit(&owner, &amount);

    // Advance 1 hour (3600 seconds)
    advance_time(&_env, 3600);

    let state = client.get_state();
    // With 500,000 bps (5,000% APY):
    // yield = 10_000_000_000 × 3600 × 500_000 / (10_000 × 31_536_000)
    // yield ≈ 57,077,625 (≈ 5.7 USDC per hour at demo rate)
    assert!(state.accrued_yield > 0);
    assert!(state.total_balance > amount);
}

#[test]
fn test_withdraw_yield() {
    let (_env, _vault_id, owner, usdc_address, _, client) = setup_vault();

    let amount = 10_000_000_000i128;
    client.deposit(&owner, &amount);

    // Advance time to accrue yield
    advance_time(&_env, 3600);

    let available = client.get_available_yield();
    assert!(available > 0);

    // Withdraw half the yield
    let withdraw_amount = available / 2;
    client.withdraw_yield(&owner, &withdraw_amount);

    let state = client.get_state();
    assert_eq!(state.accrued_yield, available - withdraw_amount);
    assert_eq!(state.total_withdrawn, withdraw_amount);
    // Principal should be untouched
    assert_eq!(state.principal, amount);
}

#[test]
fn test_withdraw_principal() {
    let (_env, _vault_id, owner, _, _, client) = setup_vault();

    let amount = 10_000_000_000i128;
    client.deposit(&owner, &amount);

    // Withdraw half the principal
    let half = amount / 2;
    client.withdraw_principal(&owner, &half);

    let state = client.get_state();
    assert_eq!(state.principal, amount - half);
}

#[test]
fn test_withdraw_all() {
    let (_env, _vault_id, owner, usdc_address, _, client) = setup_vault();

    let amount = 10_000_000_000i128;
    client.deposit(&owner, &amount);

    // Advance time to accrue yield
    advance_time(&_env, 7200);

    client.withdraw_all(&owner);

    let state = client.get_state();
    assert_eq!(state.principal, 0);
    assert_eq!(state.accrued_yield, 0);
    assert!(state.total_withdrawn > amount); // Got back more than deposited
}

#[test]
#[should_panic(expected = "Error(Contract, #3)")]
fn test_deposit_zero_fails() {
    let (_env, _vault_id, owner, _, _, client) = setup_vault();
    client.deposit(&owner, &0);
}

#[test]
#[should_panic(expected = "Error(Contract, #4)")]
fn test_withdraw_excess_yield_fails() {
    let (_env, _vault_id, owner, _, _, client) = setup_vault();

    let amount = 10_000_000_000i128;
    client.deposit(&owner, &amount);

    // Try to withdraw yield before any has accrued
    // (timestamp hasn't advanced, so yield = 0)
    client.withdraw_yield(&owner, &1_000_000);
}

#[test]
#[should_panic(expected = "Error(Contract, #5)")]
fn test_withdraw_excess_principal_fails() {
    let (_env, _vault_id, owner, _, _, client) = setup_vault();

    let amount = 10_000_000_000i128;
    client.deposit(&owner, &amount);

    // Try to withdraw more than deposited
    client.withdraw_principal(&owner, &(amount + 1));
}

#[test]
fn test_multiple_deposits() {
    let (_env, _vault_id, owner, _, _, client) = setup_vault();

    let first = 5_000_000_000i128;
    let second = 3_000_000_000i128;

    client.deposit(&owner, &first);
    advance_time(&_env, 1800); // 30 min
    client.deposit(&owner, &second);

    let state = client.get_state();
    assert_eq!(state.principal, first + second);
    assert_eq!(state.deposit_count, 2);
    // Should have some yield from the first deposit's 30 min
    assert!(state.accrued_yield > 0);
}

#[test]
fn test_set_yield_rate() {
    let (_env, _vault_id, owner, _, _, client) = setup_vault();

    let amount = 10_000_000_000i128;
    client.deposit(&owner, &amount);

    advance_time(&_env, 3600);
    let yield_before = client.get_available_yield();

    // Change rate to 0 — no more yield
    client.set_yield_rate(&owner, &0u32);
    advance_time(&_env, 3600);
    let yield_after = client.get_available_yield();

    // Yield should not have increased after rate was set to 0
    assert_eq!(yield_after, yield_before);
}
