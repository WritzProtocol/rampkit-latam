use soroban_sdk::{contracttype, contracterror, Address};

// ─── Storage Keys ──────────────────────────────────────────────

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    /// The user who created this savings vault
    Owner,
    /// USDC token contract address (SAC)
    UsdcToken,
    /// TESOURO token contract address (Etherfuse stablebond)
    TesouroToken,
    /// Annual yield rate in basis points (e.g., 1325 = 13.25% APY)
    YieldRateBps,
    /// Total USDC deposited (principal)
    Principal,
    /// Accrued yield from TESOURO holdings (in USDC equivalent)
    AccruedYield,
    /// Timestamp of last yield accrual calculation
    LastAccrualTs,
    /// Total yield claimed/withdrawn over lifetime
    TotalWithdrawn,
    /// Number of deposits made
    DepositCount,
}

// ─── Error Codes ───────────────────────────────────────────────

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    /// Contract not properly initialized
    NotInitialized = 1,
    /// Caller is not the vault owner
    Unauthorized = 2,
    /// Amount must be positive
    InvalidAmount = 3,
    /// Not enough accrued yield to withdraw
    InsufficientYield = 4,
    /// Not enough principal to withdraw
    InsufficientPrincipal = 5,
    /// Requested withdrawal exceeds total balance
    InsufficientBalance = 6,
}

// ─── State Structs ─────────────────────────────────────────────

/// Complete vault state for dashboard display.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VaultState {
    /// Total USDC deposited
    pub principal: i128,
    /// Current accrued yield (USDC equivalent)
    pub accrued_yield: i128,
    /// Total withdrawn over lifetime
    pub total_withdrawn: i128,
    /// Annual yield rate (basis points)
    pub yield_rate_bps: u32,
    /// Vault owner address
    pub owner: Address,
    /// Number of deposits
    pub deposit_count: u32,
    /// Total balance (principal + yield)
    pub total_balance: i128,
    /// Estimated daily yield in USDC (×10^7 for precision)
    pub daily_yield: i128,
}
