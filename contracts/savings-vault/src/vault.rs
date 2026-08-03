use soroban_sdk::{
    contract, contractimpl, token::TokenClient, Address, Env, symbol_short,
};

use crate::types::{DataKey, Error, VaultState};

const DAY_IN_LEDGERS: u32 = 17_280;
const BUMP_THRESHOLD: u32 = 30 * DAY_IN_LEDGERS;
const BUMP_TO: u32 = 120 * DAY_IN_LEDGERS;
const SECONDS_PER_YEAR: i128 = 31_536_000;
const BPS_DENOMINATOR: i128 = 10_000;



#[contract]
pub struct SavingsVault;

#[contractimpl]
impl SavingsVault {
    /// Initialize the savings vault.
    /// Called once at deploy time via `__constructor`.
    ///
    /// # Arguments
    /// * `owner` - The user who owns this vault (depositor & withdrawer)
    /// * `usdc_token` - USDC SAC contract address on Stellar
    /// * `tesouro_token` - TESOURO token contract address (Etherfuse)
    /// * `yield_rate_bps` - Annual yield in basis points (1325 = 13.25%)
    pub fn __constructor(
        env: Env,
        owner: Address,
        usdc_token: Address,
        tesouro_token: Address,
        yield_rate_bps: u32,
    ) {
        env.storage().instance().set(&DataKey::Owner, &owner);
        env.storage()
            .instance()
            .set(&DataKey::UsdcToken, &usdc_token);
        env.storage()
            .instance()
            .set(&DataKey::TesouroToken, &tesouro_token);
        env.storage()
            .instance()
            .set(&DataKey::YieldRateBps, &yield_rate_bps);
        env.storage().instance().set(&DataKey::Principal, &0i128);
        env.storage()
            .instance()
            .set(&DataKey::DepositCount, &0u32);

        env.storage()
            .persistent()
            .set(&DataKey::AccruedYield, &0i128);
        env.storage()
            .persistent()
            .set(&DataKey::LastAccrualTs, &env.ledger().timestamp());
        env.storage()
            .persistent()
            .set(&DataKey::TotalWithdrawn, &0i128);

        Self::extend_ttls(&env);
    }

    // ─── Deposit ───────────────────────────────────────────────

    /// Deposit USDC into the savings vault.
    /// The deposited amount starts earning TESOURO yield immediately.
    ///
    /// # Flow
    /// 1. User approves USDC transfer
    /// 2. USDC moves from user → contract
    /// 3. Yield starts accruing based on `yield_rate_bps`
    ///
    /// In production, the contract would swap USDC → TESOURO via
    /// Etherfuse's on-chain integration. For demo, yield is simulated.
    pub fn deposit(env: Env, owner: Address, amount: i128) -> Result<(), Error> {
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        Self::require_owner(&env, &owner)?;

        // Accrue any pending yield before modifying principal
        Self::internal_accrue(&env);

        // Transfer USDC from user to vault
        let usdc: Address = env
            .storage()
            .instance()
            .get(&DataKey::UsdcToken)
            .ok_or(Error::NotInitialized)?;
        let token = TokenClient::new(&env, &usdc);
        token.transfer(&owner, &env.current_contract_address(), &amount);

        // Update principal
        let principal: i128 = env
            .storage()
            .instance()
            .get(&DataKey::Principal)
            .unwrap_or(0);
        let new_principal = principal + amount;
        env.storage()
            .instance()
            .set(&DataKey::Principal, &new_principal);

        // Increment deposit counter
        let count: u32 = env
            .storage()
            .instance()
            .get(&DataKey::DepositCount)
            .unwrap_or(0);
        env.storage()
            .instance()
            .set(&DataKey::DepositCount, &(count + 1));

        env.events().publish((symbol_short!("Deposit"), owner.clone()), (amount, new_principal));

        Self::extend_ttls(&env);
        Ok(())
    }

    // ─── Withdraw Yield ────────────────────────────────────────

    /// Withdraw accrued yield (interest earned from TESOURO).
    /// Only withdraws yield — principal remains locked.
    ///
    /// This is the "take profits" function. The user can withdraw
    /// yield at any time without touching their principal deposit.
    pub fn withdraw_yield(env: Env, owner: Address, amount: i128) -> Result<(), Error> {
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        Self::require_owner(&env, &owner)?;

        // Accrue yield up to now
        let available = Self::internal_accrue(&env);
        if amount > available {
            return Err(Error::InsufficientYield);
        }

        // Transfer USDC from contract to user
        let usdc: Address = env.storage().instance().get(&DataKey::UsdcToken).unwrap();
        let token = TokenClient::new(&env, &usdc);
        token.transfer(&env.current_contract_address(), &owner, &amount);

        // Update yield balance
        let remaining = available - amount;
        env.storage()
            .persistent()
            .set(&DataKey::AccruedYield, &remaining);

        // Update total withdrawn
        let total_withdrawn: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::TotalWithdrawn)
            .unwrap_or(0);
        env.storage()
            .persistent()
            .set(&DataKey::TotalWithdrawn, &(total_withdrawn + amount));

        env.events().publish((symbol_short!("YieldWd"), owner.clone()), (amount, remaining));

        Self::extend_ttls(&env);
        Ok(())
    }

    // ─── Withdraw Principal ────────────────────────────────────

    /// Withdraw some or all of the principal deposit.
    /// This reduces the yield-earning base.
    ///
    /// For the off-ramp flow, the user would:
    /// 1. withdraw_principal(amount) → gets USDC
    /// 2. Use RampKit SDK to off-ramp USDC → BRL via PIX
    pub fn withdraw_principal(
        env: Env,
        owner: Address,
        amount: i128,
    ) -> Result<(), Error> {
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        Self::require_owner(&env, &owner)?;

        // Accrue yield before modifying principal
        Self::internal_accrue(&env);

        let principal: i128 = env
            .storage()
            .instance()
            .get(&DataKey::Principal)
            .unwrap_or(0);
        if amount > principal {
            return Err(Error::InsufficientPrincipal);
        }

        // Transfer USDC from contract to user
        let usdc: Address = env.storage().instance().get(&DataKey::UsdcToken).unwrap();
        let token = TokenClient::new(&env, &usdc);
        token.transfer(&env.current_contract_address(), &owner, &amount);

        let new_principal = principal - amount;
        env.storage()
            .instance()
            .set(&DataKey::Principal, &new_principal);

        env.events().publish((symbol_short!("PrinWd"), owner.clone()), (amount, new_principal));

        Self::extend_ttls(&env);
        Ok(())
    }

    // ─── Withdraw All ──────────────────────────────────────────

    /// Emergency exit: withdraw all principal + accrued yield.
    /// Closes the vault position entirely.
    pub fn withdraw_all(env: Env, owner: Address) -> Result<(), Error> {
        Self::require_owner(&env, &owner)?;

        let available_yield = Self::internal_accrue(&env);
        let principal: i128 = env
            .storage()
            .instance()
            .get(&DataKey::Principal)
            .unwrap_or(0);
        let total = principal + available_yield;

        if total <= 0 {
            return Err(Error::InsufficientBalance);
        }

        // Transfer everything
        let usdc: Address = env.storage().instance().get(&DataKey::UsdcToken).unwrap();
        let token = TokenClient::new(&env, &usdc);
        token.transfer(&env.current_contract_address(), &owner, &total);

        // Reset state
        env.storage().instance().set(&DataKey::Principal, &0i128);
        env.storage()
            .persistent()
            .set(&DataKey::AccruedYield, &0i128);

        let total_withdrawn: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::TotalWithdrawn)
            .unwrap_or(0);
        env.storage()
            .persistent()
            .set(&DataKey::TotalWithdrawn, &(total_withdrawn + total));

        Self::extend_ttls(&env);
        Ok(())
    }

    // ─── Admin ─────────────────────────────────────────────────

    /// Owner can update the yield rate (e.g., when TESOURO APY changes).
    pub fn set_yield_rate(env: Env, owner: Address, rate_bps: u32) -> Result<(), Error> {
        Self::require_owner(&env, &owner)?;
        // Accrue at the old rate before changing
        Self::internal_accrue(&env);
        env.storage()
            .instance()
            .set(&DataKey::YieldRateBps, &rate_bps);
        Ok(())
    }

    // ─── View Functions ────────────────────────────────────────

    /// Get current available yield without modifying state.
    pub fn get_available_yield(env: Env) -> i128 {
        Self::internal_accrue(&env)
    }

    /// Get complete vault state for the dashboard/UI.
    pub fn get_state(env: Env) -> VaultState {
        Self::internal_accrue(&env);

        let principal: i128 = env
            .storage()
            .instance()
            .get(&DataKey::Principal)
            .unwrap_or(0);
        let accrued_yield: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::AccruedYield)
            .unwrap_or(0);
        let yield_rate_bps: u32 = env
            .storage()
            .instance()
            .get(&DataKey::YieldRateBps)
            .unwrap_or(0);

        // Calculate daily yield: principal × rate_bps / (10000 × 365)
        let daily_yield = if principal > 0 {
            principal
                .checked_mul(yield_rate_bps as i128)
                .unwrap_or(0)
                / (BPS_DENOMINATOR * 365)
        } else {
            0
        };

        VaultState {
            principal,
            accrued_yield,
            total_withdrawn: env
                .storage()
                .persistent()
                .get(&DataKey::TotalWithdrawn)
                .unwrap_or(0),
            yield_rate_bps,
            owner: env.storage().instance().get(&DataKey::Owner).unwrap(),
            deposit_count: env
                .storage()
                .instance()
                .get(&DataKey::DepositCount)
                .unwrap_or(0),
            total_balance: principal + accrued_yield,
            daily_yield,
        }
    }

    // ─── Internal Helpers ──────────────────────────────────────

    fn require_owner(env: &Env, who: &Address) -> Result<(), Error> {
        let owner: Address = env
            .storage()
            .instance()
            .get(&DataKey::Owner)
            .ok_or(Error::NotInitialized)?;
        if *who != owner {
            return Err(Error::Unauthorized);
        }
        who.require_auth();
        Ok(())
    }

    /// Calculate and apply yield accrual since last timestamp.
    ///
    /// Formula: new_yield = principal × elapsed_seconds × rate_bps / (BPS_DENOMINATOR × SECONDS_PER_YEAR)
    ///
    /// For demo purposes, this simulates TESOURO yield.
    /// In production, the contract would hold actual TESOURO tokens
    /// and yield would come from the token's NAV increase.
    fn internal_accrue(env: &Env) -> i128 {
        let principal: i128 = env
            .storage()
            .instance()
            .get(&DataKey::Principal)
            .unwrap_or(0);
        let rate_bps: u32 = env
            .storage()
            .instance()
            .get(&DataKey::YieldRateBps)
            .unwrap_or(0);
        let last_ts: u64 = env
            .storage()
            .persistent()
            .get(&DataKey::LastAccrualTs)
            .unwrap_or(env.ledger().timestamp());
        let now = env.ledger().timestamp();
        let elapsed = now.saturating_sub(last_ts);

        let new_yield = principal
            .checked_mul(elapsed as i128)
            .unwrap_or(0)
            .checked_mul(rate_bps as i128)
            .unwrap_or(0)
            / (BPS_DENOMINATOR * SECONDS_PER_YEAR);

        let current: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::AccruedYield)
            .unwrap_or(0);
        let total = current + new_yield;

        env.storage()
            .persistent()
            .set(&DataKey::AccruedYield, &total);
        env.storage()
            .persistent()
            .set(&DataKey::LastAccrualTs, &now);

        total
    }

    fn extend_ttls(env: &Env) {
        env.storage()
            .instance()
            .extend_ttl(BUMP_THRESHOLD, BUMP_TO);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::AccruedYield, BUMP_THRESHOLD, BUMP_TO);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::LastAccrualTs, BUMP_THRESHOLD, BUMP_TO);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::TotalWithdrawn, BUMP_THRESHOLD, BUMP_TO);
    }
}
