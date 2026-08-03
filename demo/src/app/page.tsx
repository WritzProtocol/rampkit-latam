'use client';

import React, { useState, useMemo } from 'react';
import { RampWidget, SavingsWidget } from '@rampkit/ui';
import type { RampRouter, QuoteRequest, RampQuote, RampOrder, ExecuteRampParams, AnchorAsset, AnchorId } from '@rampkit/core';

// Create a proxy router that implements the methods needed by the widgets
// but routes traffic through our Next.js API routes to hide API keys.
class ProxyRouter {
  async getQuotes(params: QuoteRequest): Promise<RampQuote[]> {
    const res = await fetch('/api/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async executeRamp(quote: RampQuote, stellarAddress: string): Promise<RampOrder> {
    const res = await fetch('/api/ramp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'execute', quote, stellarAddress }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async getStatus(orderId: string, anchorId: AnchorId): Promise<RampOrder> {
    const res = await fetch(`/api/ramp?orderId=${orderId}&anchorId=${anchorId}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async getYieldBearingAssets(): Promise<AnchorAsset[]> {
    const res = await fetch('/api/assets');
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
}

export default function Home() {
  const [stellarAddress, setStellarAddress] = useState('GBABCD... (Demo Address)');
  const [vaultState, setVaultState] = useState({
    principal: 0,
    accruedYield: 0,
    totalWithdrawn: 0,
    yieldRateBps: 1325,
    totalBalance: 0,
    dailyYield: 0,
    depositCount: 0,
  });

  // Use useMemo to avoid recreating the proxy router on every render
  const router = useMemo(() => new ProxyRouter() as unknown as RampRouter, []);

  // Handle deposit from savings widget
  const handleDeposit = (amount: string) => {
    // In a real app, this would open the RampWidget or scroll to it
    // with the amount pre-filled and destination set to TESOURO/USDC
    const rampSection = document.getElementById('ramp-section');
    if (rampSection) {
      rampSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Simulate on-chain vault state updates when orders complete
  const handleOrderComplete = (order: RampOrder) => {
    if (order.quote.direction === 'on-ramp') {
      const amount = parseFloat(order.quote.destAmount);
      // Simulate USDC deposit into vault
      setVaultState(prev => {
        const principal = prev.principal + (amount * 10000000); // 7 decimals
        const dailyYield = (principal * prev.yieldRateBps) / (10000 * 365);
        return {
          ...prev,
          principal,
          totalBalance: principal + prev.accruedYield,
          dailyYield,
          depositCount: prev.depositCount + 1,
        };
      });
    }
  };

  return (
    <main className="app-container">
      <header className="app-header">
        <h1 className="app-title">PoupaStellar</h1>
        <p className="app-subtitle">
          A sua conta rendimento global. Deposite em Reais via PIX,
          ganhe 13% ao ano e saque quando quiser.
        </p>
      </header>

      <div className="app-grid">
        {/* Savings Vault Section */}
        <section>
          <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600 }}>Cofre de Rendimento</h2>
            <div style={{ fontSize: '12px', color: 'var(--rk-text-muted)', background: 'var(--rk-bg-card)', padding: '4px 8px', borderRadius: '4px' }}>
              Rede: Stellar Testnet
            </div>
          </div>
          <SavingsWidget
            router={router}
            vaultState={vaultState}
            stellarAddress={stellarAddress}
            locale="pt-BR"
            onDeposit={handleDeposit}
          />
        </section>

        {/* Ramp Section */}
        <section id="ramp-section">
          <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600 }}>Câmbio Inteligente</h2>
            <div style={{ fontSize: '12px', color: 'var(--rk-text-muted)', background: 'var(--rk-bg-card)', padding: '4px 8px', borderRadius: '4px' }}>
              Multi-Anchor Router
            </div>
          </div>
          <RampWidget
            router={router}
            stellarAddress={stellarAddress}
            locale="pt-BR"
            defaultCountry="BR"
            onComplete={handleOrderComplete}
          />
        </section>
      </div>
    </main>
  );
}
