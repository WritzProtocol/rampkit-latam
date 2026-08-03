/**
 * @rampkit/ui — SavingsWidget Component
 *
 * Displays yield-bearing savings information (TESOURO APY)
 * and provides deposit/withdraw via PIX on/off-ramp flow.
 *
 * Usage:
 * ```tsx
 * <SavingsWidget
 *   router={router}
 *   vaultState={state}
 *   stellarAddress="G..."
 *   locale="pt-BR"
 * />
 * ```
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { RampRouter, AnchorAsset } from '@rampkit/core';

export interface VaultState {
  principal: number;
  accruedYield: number;
  totalWithdrawn: number;
  yieldRateBps: number;
  totalBalance: number;
  dailyYield: number;
  depositCount: number;
}

export interface SavingsWidgetProps {
  /** Configured RampRouter instance */
  router: RampRouter;
  /** Current vault state from Soroban contract */
  vaultState?: VaultState;
  /** User's Stellar wallet address */
  stellarAddress: string;
  /** Language */
  locale?: 'pt-BR' | 'es' | 'en';
  /** Called when user wants to deposit (triggers ramp flow) */
  onDeposit?: (amount: string) => void;
  /** Called when user wants to withdraw */
  onWithdraw?: (amount: string) => void;
  /** Custom CSS class */
  className?: string;
}

const LABELS: Record<string, Record<string, string>> = {
  'pt-BR': {
    title: 'Poupança Stellar',
    subtitle: 'Rendimento TESOURO via Etherfuse',
    apy: 'APY',
    principal: 'Depositado',
    yield: 'Rendimento',
    totalBalance: 'Saldo total',
    dailyYield: 'Rendimento diário',
    totalWithdrawn: 'Total sacado',
    deposits: 'Depósitos',
    deposit: 'Depositar via PIX',
    withdraw: 'Sacar via PIX',
    noVault: 'Nenhuma poupança ativa. Deposite para começar a render!',
    poweredBy: 'Powered by TESOURO · Etherfuse',
  },
  es: {
    title: 'Ahorro Stellar',
    subtitle: 'Rendimiento TESOURO via Etherfuse',
    apy: 'APY',
    principal: 'Depositado',
    yield: 'Rendimiento',
    totalBalance: 'Saldo total',
    dailyYield: 'Rendimiento diario',
    totalWithdrawn: 'Total retirado',
    deposits: 'Depósitos',
    deposit: 'Depositar vía PIX',
    withdraw: 'Retirar vía PIX',
    noVault: 'Sin ahorro activo. ¡Deposite para empezar a generar rendimientos!',
    poweredBy: 'Powered by TESOURO · Etherfuse',
  },
  en: {
    title: 'Stellar Savings',
    subtitle: 'TESOURO yield via Etherfuse',
    apy: 'APY',
    principal: 'Deposited',
    yield: 'Yield earned',
    totalBalance: 'Total balance',
    dailyYield: 'Daily yield',
    totalWithdrawn: 'Total withdrawn',
    deposits: 'Deposits',
    deposit: 'Deposit via PIX',
    withdraw: 'Withdraw via PIX',
    noVault: 'No active savings. Deposit to start earning yield!',
    poweredBy: 'Powered by TESOURO · Etherfuse',
  },
};

export const SavingsWidget: React.FC<SavingsWidgetProps> = ({
  router,
  vaultState,
  stellarAddress,
  locale = 'pt-BR',
  onDeposit,
  onWithdraw,
  className,
}) => {
  const [tesouroAsset, setTesouroAsset] = useState<AnchorAsset | null>(null);
  const [animatedYield, setAnimatedYield] = useState(0);

  const l = LABELS[locale] || LABELS['en'];
  const apy = vaultState
    ? (vaultState.yieldRateBps / 100).toFixed(2)
    : tesouroAsset?.apy?.toFixed(2) || '13.25';

  // Fetch TESOURO asset info
  useEffect(() => {
    (async () => {
      try {
        const assets = await router.getYieldBearingAssets();
        const tesouro = assets.find((a) => a.code === 'TESOURO');
        if (tesouro) setTesouroAsset(tesouro);
      } catch {
        // Use defaults
      }
    })();
  }, [router]);

  // Animate yield counter
  useEffect(() => {
    if (!vaultState || vaultState.accruedYield <= 0) return;

    // Simulate real-time yield accrual (visual only)
    const perSecondYield = vaultState.dailyYield / 86400;
    let current = vaultState.accruedYield;

    const interval = setInterval(() => {
      current += perSecondYield;
      setAnimatedYield(current);
    }, 1000);

    return () => clearInterval(interval);
  }, [vaultState]);

  const formatUSDC = (amount: number): string => {
    // USDC has 7 decimals on Stellar
    const usdc = amount / 10_000_000;
    return usdc.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  };

  const displayYield = animatedYield > 0 ? animatedYield : (vaultState?.accruedYield || 0);

  return (
    <div className={`rk-widget ${className || ''}`}>
      <div className="rk-card rk-savings" style={{ maxWidth: '440px', margin: '0 auto' }}>
        {/* Header */}
        <h3 style={{
          fontSize: '18px',
          fontWeight: 700,
          marginBottom: '4px',
          color: 'var(--rk-text-primary)',
        }}>
          {l.title}
        </h3>
        <p style={{
          fontSize: '13px',
          color: 'var(--rk-text-muted)',
          marginBottom: '24px',
        }}>
          {l.subtitle}
        </p>

        {/* APY Display */}
        <div className="rk-savings__yield-display">
          <div className="rk-savings__apy">{apy}%</div>
          <div className="rk-savings__apy-label">{l.apy}</div>

          {/* Yield Orb (only when there's a balance) */}
          {vaultState && vaultState.principal > 0 && (
            <div className="rk-savings__yield-orb">
              <div className="rk-savings__yield-value">
                ${formatUSDC(displayYield)}
              </div>
              <div className="rk-savings__yield-label">{l.yield}</div>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        {vaultState && vaultState.principal > 0 ? (
          <>
            <div className="rk-savings__stats">
              <div className="rk-savings__stat">
                <div className="rk-savings__stat-value">
                  ${formatUSDC(vaultState.principal)}
                </div>
                <div className="rk-savings__stat-label">{l.principal}</div>
              </div>
              <div className="rk-savings__stat">
                <div className="rk-savings__stat-value" style={{ color: 'var(--rk-text-success)' }}>
                  ${formatUSDC(vaultState.totalBalance)}
                </div>
                <div className="rk-savings__stat-label">{l.totalBalance}</div>
              </div>
              <div className="rk-savings__stat">
                <div className="rk-savings__stat-value">
                  ${formatUSDC(vaultState.dailyYield)}
                </div>
                <div className="rk-savings__stat-label">{l.dailyYield}</div>
              </div>
              <div className="rk-savings__stat">
                <div className="rk-savings__stat-value">{vaultState.depositCount}</div>
                <div className="rk-savings__stat-label">{l.deposits}</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="rk-button rk-button--success"
                onClick={() => onDeposit?.('100')}
                style={{ flex: 1 }}
                id="rk-savings-deposit-btn"
              >
                {l.deposit}
              </button>
              <button
                className="rk-button rk-button--outline"
                onClick={() => onWithdraw?.(formatUSDC(vaultState.accruedYield))}
                style={{ flex: 1 }}
                id="rk-savings-withdraw-btn"
              >
                {l.withdraw}
              </button>
            </div>
          </>
        ) : (
          <>
            <p style={{
              textAlign: 'center',
              color: 'var(--rk-text-secondary)',
              padding: '16px 0',
              fontSize: '14px',
            }}>
              {l.noVault}
            </p>
            <button
              className="rk-button rk-button--success"
              onClick={() => onDeposit?.('100')}
              id="rk-savings-first-deposit-btn"
            >
              {l.deposit}
            </button>
          </>
        )}

        {/* Footer */}
        <p style={{
          textAlign: 'center',
          fontSize: '11px',
          color: 'var(--rk-text-muted)',
          marginTop: '20px',
        }}>
          🔗 {l.poweredBy}
        </p>
      </div>
    </div>
  );
};
