'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { RampWidget } from '@rampkit/ui';
import { SavingsWidget } from '@rampkit/ui';
import { RampRouter } from '@rampkit/core';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageSelector } from '../../components/LanguageSelector';
import '@rampkit/ui/src/styles/rampkit.css';

// Initialize the router
const router = new RampRouter({
  network: 'testnet',
  anchors: {
    etherfuse: { sandbox: true, apiKey: 'api_sand:c578d6ba-8e4f-4d93-9788-e1e4039e145e:a62b85fc-3621-41c3-8e1c-71debe06a930' },
    manteca: { sandbox: true, apiKey: 'dummy' },
    koywe: { sandbox: true, apiKey: 'dummy' },
  },
});

const CONTENT = {
  en: {
    backToLanding: 'Back to Landing Page',
    liveDemo: 'Live Demo Playground',
    subtitle: 'Interact with the RampWidget and SavingsVault components in a simulated environment.',
    yieldVault: 'Yield Vault',
    fiatRamp: 'Fiat Ramp',
    testnet: 'Testnet Active',
    multiAnchor: 'Multi-Anchor',
  },
  es: {
    backToLanding: 'Volver al Inicio',
    liveDemo: 'Demo Interactiva',
    subtitle: 'Interactúa con los componentes RampWidget y SavingsVault en un entorno simulado.',
    yieldVault: 'Bóveda de Rendimiento',
    fiatRamp: 'Rampa Fiat',
    testnet: 'Testnet Activa',
    multiAnchor: 'Multi-Anchor',
  },
  'pt-BR': {
    backToLanding: 'Voltar ao Início',
    liveDemo: 'Demo Interativa',
    subtitle: 'Interaja com os componentes RampWidget e SavingsVault em um ambiente simulado.',
    yieldVault: 'Cofre de Rendimento',
    fiatRamp: 'Rampa Fiat',
    testnet: 'Testnet Ativa',
    multiAnchor: 'Multi-Anchor',
  },
};

export default function PlaygroundPage() {
  const { locale } = useLanguage();
  const [vaultState, setVaultState] = useState<{
    principal: number;
    accruedYield: number;
    totalWithdrawn: number;
    yieldRateBps: number;
    totalBalance: number;
    dailyYield: number;
    depositCount: number;
  } | null>(null);

  const c = CONTENT[locale] || CONTENT['en'];

  const handleSavingsDeposit = (amount: string) => {
    const numAmount = parseFloat(amount) || 100;
    setVaultState({
      principal: numAmount * 10_000_000,
      accruedYield: 15_000,
      totalWithdrawn: 0,
      yieldRateBps: 1325,
      totalBalance: (numAmount + 0.0015) * 10_000_000,
      dailyYield: 363000,
      depositCount: 1,
    });
  };

  const handleSavingsWithdraw = () => {
    setVaultState(null);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-white/30 font-sans flex flex-col">
      {/* Header */}
      <nav className="w-full border-b border-white/10 bg-[#0A0A0A] shrink-0">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-white rounded-sm flex items-center justify-center">
              <div className="w-2 h-2 bg-black"></div>
            </div>
            <span className="font-semibold text-lg tracking-tight">RampKit LATAM</span>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSelector />
            <Link href="/" className="px-3 py-1.5 border border-white/20 text-gray-300 text-sm font-medium rounded hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2">
              &larr; {c.backToLanding}
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-start p-6 md:p-12">
        <div className="w-full max-w-5xl mb-12 text-center">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            {c.liveDemo}
          </h1>
          <p className="text-gray-400">
            {c.subtitle}
          </p>
        </div>

        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Left Column: Yield Vault */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 px-2">
              <h2 className="text-lg font-bold">{c.yieldVault}</h2>
              <span className="text-xs font-semibold px-2 py-1 rounded bg-green-900/30 text-green-400 border border-green-500/20">
                {c.testnet}
              </span>
            </div>
            <SavingsWidget
              router={router}
              vaultState={vaultState || undefined}
              stellarAddress="GBAEGEMNJHS5KP5CORUKHYITFI562KK3WP3CO7YRU7B3522MSC6UZ22P"
              locale={locale}
              onDeposit={handleSavingsDeposit}
              onWithdraw={handleSavingsWithdraw}
              className="mt-2"
            />
          </div>

          {/* Right Column: Fiat Ramp */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 px-2">
              <h2 className="text-lg font-bold">{c.fiatRamp}</h2>
              <span className="text-xs font-semibold px-2 py-1 rounded bg-blue-900/30 text-blue-400 border border-blue-500/20">
                {c.multiAnchor}
              </span>
            </div>
            <RampWidget
              router={router}
              stellarAddress="GBAEGEMNJHS5KP5CORUKHYITFI562KK3WP3CO7YRU7B3522MSC6UZ22P"
              defaultCountry="BR"
              locale={locale}
              className="mt-2"
              onComplete={(order) => {
                console.log('Order complete:', order);
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
