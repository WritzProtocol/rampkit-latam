'use client';

import Link from 'next/link';
import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from '../components/LanguageSelector';

const CONTENT = {
  en: {
    features: 'Features',
    corridors: 'Corridors',
    yield: 'Yield',
    docs: 'Documentation',
    launchDemo: 'Launch Demo',
    summit: 'Stellar Builder Summit SP 2026',
    heroTitle: 'The unified payment infrastructure for Latin America.',
    heroSubtitle: 'RampKit is a Multi-Anchor Router SDK. We abstract the fragmented APIs of Etherfuse, Manteca, and Koywe into a single integration, so you can offer BRL, MXN, and CLP fiat ramps instantly.',
    tryDemo: 'Try the PIX Checkout Demo',
    tryRemittance: 'Send a Remittance',
    github: 'View on GitHub',
    whyBuilt: 'Why we built RampKit',
    whyDesc: 'Integrating LATAM payment rails onto Stellar requires connecting to multiple anchors (SEP-24). Each anchor has different API endpoints, schemas, authentication methods, and KYC flows. This fragmentation costs developer weeks of integration time and results in poor price discovery for end users.',
    smartRate: 'Smart Rate Routing',
    smartRateDesc: "Don't force your users to accept a bad exchange rate. RampKit fetches live quotes from Etherfuse, Manteca, and Koywe simultaneously, guaranteeing the lowest fees and best spreads.",
    dropIn: 'Drop-in React UI',
    dropInDesc: 'We abstracted the entire checkout flow into a single `<RampWidget />`. In 3 lines of code, you get PIX/SPEI QR generation, polling, and animated status tracking out of the box.',
    hybridSandbox: 'Hybrid Sandbox',
    hybridSandboxDesc: 'Testing financial APIs is a nightmare. Our Hybrid Sandbox fetches real blockchain exchange rates but simulates the actual fiat payment and KYC, so you can build and demo without friction.',
    supportedCorridors: 'Supported Regional Corridors',
    supportedDesc: 'A single integration unlocks the largest economies in Latin America.',
    country: 'Country',
    currency: 'Currency',
    rail: 'Payment Rail',
    anchors: 'Anchors Handled',
    assets: 'Supported Assets',
    brazil: 'Brazil',
    mexico: 'Mexico',
    chile: 'Chile',
    yieldTitle: 'Frictionless Yield',
    yieldP1: "Stablebonds (like Etherfuse's TESOURO) tokenize sovereign debt to deliver high-yield savings. By simply acquiring TESOURO or depositing via PIX, your balance automatically generates a 13.25% APY yield by default while stored in your account—no extra steps or active management required!",
    yieldP2: 'RampKit makes yield effortless. When a user deposits BRL via PIX for TESOURO, the assets immediately start accruing real-time interest automatically in the Savings Vault.',
    seeYieldDemo: 'See the Yield Demo',
    userBank: 'User Bank',
    pixPayment: 'PIX Payment (BRL)',
    rkSdk: 'RampKit SDK',
    efRouter: 'Etherfuse Router',
    usdcBridge: 'USDC Bridge',
    sorobanVault: 'Savings Vault',
    tesouroContract: 'TESOURO Contract',
    builtFor: 'Built for the Stellar Builder Summit SP 2026.',
  },
  es: {
    features: 'Características',
    corridors: 'Corredores',
    yield: 'Rendimiento',
    docs: 'Documentación',
    launchDemo: 'Lanzar Demo',
    summit: 'Stellar Builder Summit SP 2026',
    heroTitle: 'La infraestructura de pagos unificada para Latinoamérica.',
    heroSubtitle: 'RampKit es un SDK enrutador multi-anchor. Abstraemos las APIs fragmentadas de Etherfuse, Manteca y Koywe en una sola integración para que ofrezcas rampas fiat BRL, MXN y CLP al instante.',
    tryDemo: 'Prueba la Demo PIX',
    tryRemittance: 'Enviar una Remesa',
    github: 'Ver en GitHub',
    whyBuilt: 'Por qué construimos RampKit',
    whyDesc: 'Integrar los rieles de pago de LATAM en Stellar requiere conectarse a múltiples anchors (SEP-24). Cada uno tiene endpoints, esquemas y flujos KYC distintos. Esta fragmentación cuesta semanas de desarrollo y resulta en malos precios para los usuarios.',
    smartRate: 'Enrutamiento Inteligente',
    smartRateDesc: "No obligues a tus usuarios a aceptar una mala tasa. RampKit obtiene cotizaciones en vivo de Etherfuse, Manteca y Koywe simultáneamente, garantizando las comisiones más bajas.",
    dropIn: 'UI React Lista para Usar',
    dropInDesc: 'Abstrajimos todo el flujo de pago en un solo `<RampWidget />`. Con 3 líneas de código, obtienes generación de QRs, sondeo y estado animado listo para usar.',
    hybridSandbox: 'Sandbox Híbrido',
    hybridSandboxDesc: 'Probar APIs financieras es una pesadilla. Nuestro Sandbox obtiene tasas reales de la blockchain pero simula el pago fiat, para que puedas construir y hacer demos sin fricción.',
    supportedCorridors: 'Corredores Regionales Soportados',
    supportedDesc: 'Una sola integración desbloquea las economías más grandes de Latinoamérica.',
    country: 'País',
    currency: 'Moneda',
    rail: 'Riel de Pago',
    anchors: 'Anchors Soportados',
    assets: 'Activos Soportados',
    brazil: 'Brasil',
    mexico: 'México',
    chile: 'Chile',
    yieldTitle: 'Rendimiento sin Fricción',
    yieldP1: "Los Stablebonds (como TESOURO de Etherfuse) tokenizan deuda soberana para ofrecer rendimientos de alto nivel. Al comprar TESOURO o depositar vía PIX, tu saldo genera un rendimiento automático de 13.25% APY por defecto mientras permanezca guardado en tu cuenta, ¡sin pasos adicionales!",
    yieldP2: 'RampKit hace que el rendimiento sea instantáneo. Cuando un usuario deposita BRL vía PIX para obtener TESOURO, sus activos comienzan a generar intereses acumulados en tiempo real inmediatamente en la Bóveda de Ahorro.',
    seeYieldDemo: 'Ver Demo de Rendimiento',
    userBank: 'Banco del Usuario',
    pixPayment: 'Pago PIX (BRL)',
    rkSdk: 'SDK RampKit',
    efRouter: 'Enrutador Etherfuse',
    usdcBridge: 'Puente USDC',
    sorobanVault: 'Bóveda de Ahorro',
    tesouroContract: 'Contrato TESOURO',
    builtFor: 'Construido para el Stellar Builder Summit SP 2026.',
  },
  'pt-BR': {
    features: 'Recursos',
    corridors: 'Corredores',
    yield: 'Rendimento',
    docs: 'Documentação',
    launchDemo: 'Acessar Demo',
    summit: 'Stellar Builder Summit SP 2026',
    heroTitle: 'A infraestrutura de pagamentos unificada da América Latina.',
    heroSubtitle: 'RampKit é um SDK roteador multi-anchor. Abstraímos as APIs fragmentadas da Etherfuse, Manteca e Koywe em uma única integração para você oferecer rampas BRL, MXN e CLP instantaneamente.',
    tryDemo: 'Testar Demo PIX',
    tryRemittance: 'Enviar uma Remessa',
    github: 'Ver no GitHub',
    whyBuilt: 'Por que construímos o RampKit',
    whyDesc: 'Integrar trilhos de pagamento LATAM na Stellar exige conectar múltiplos anchors (SEP-24). Cada anchor tem endpoints e fluxos KYC diferentes. Essa fragmentação custa semanas de desenvolvimento e resulta em preços piores para os usuários.',
    smartRate: 'Roteamento Inteligente',
    smartRateDesc: "Não force seus usuários a aceitarem uma taxa ruim. RampKit busca cotações ao vivo simultaneamente, garantindo as menores taxas e os melhores spreads.",
    dropIn: 'UI React Pronta',
    dropInDesc: 'Abstraímos todo o fluxo de checkout em um único `<RampWidget />`. Em 3 linhas de código, você obtém geração de QR code, polling e rastreamento animado.',
    hybridSandbox: 'Sandbox Híbrido',
    hybridSandboxDesc: 'Testar APIs financeiras é um pesadelo. Nosso Sandbox busca taxas reais da blockchain mas simula o pagamento fiat e KYC para você focar no desenvolvimento.',
    supportedCorridors: 'Corredores Regionais Suportados',
    supportedDesc: 'Uma única integração desbloqueia as maiores economias da América Latina.',
    country: 'País',
    currency: 'Moeda',
    rail: 'Trilho de Pagamento',
    anchors: 'Anchors Suportados',
    assets: 'Ativos Suportados',
    brazil: 'Brasil',
    mexico: 'México',
    chile: 'Chile',
    yieldTitle: 'Rendimento sem Atrito',
    yieldP1: "Stablebonds (como TESOURO da Etherfuse) tokenizam dívida soberana para oferecer alto rendimento. Ao comprar TESOURO ou depositar via PIX, seu saldo gera automaticamente 13,25% de APY por padrão enquanto armazenado na sua conta, sem etapas adicionais!",
    yieldP2: 'O RampKit torna o rendimento instantâneo. Quando um usuário deposita BRL via PIX para obter TESOURO, os ativos começam a acumular juros em tempo real imediatamente no Cofre de Poupança.',
    seeYieldDemo: 'Ver Demo de Rendimento',
    userBank: 'Banco do Usuário',
    pixPayment: 'Pagamento PIX (BRL)',
    rkSdk: 'RampKit SDK',
    efRouter: 'Roteador Etherfuse',
    usdcBridge: 'Ponte USDC',
    sorobanVault: 'Cofre de Poupança',
    tesouroContract: 'Contrato TESOURO',
    builtFor: 'Desenvolvido para o Stellar Builder Summit SP 2026.',
  }
};

export default function LandingPage() {
  const { locale } = useLanguage();
  const c = CONTENT[locale];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-white/30 font-sans">
      
      {/* Navigation / Header */}
      <nav className="w-full border-b border-white/10 bg-[#0A0A0A]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-white rounded-sm flex items-center justify-center">
              <div className="w-2 h-2 bg-black"></div>
            </div>
            <span className="font-semibold text-lg tracking-tight">RampKit LATAM</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-400 font-medium">
            <a href="#features" className="hover:text-white transition-colors">{c.features}</a>
            <a href="#corridors" className="hover:text-white transition-colors">{c.corridors}</a>
            <a href="#yield" className="hover:text-white transition-colors">{c.yield}</a>
            <a href="https://github.com/WritzProtocol/rampkit-latam" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">{c.docs}</a>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSelector />
            <Link href="/playground" className="px-4 py-2 bg-white text-black font-semibold text-sm rounded hover:bg-gray-200 transition-colors">
              {c.launchDemo}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 md:pt-32 md:pb-32 flex flex-col items-center border-b border-white/5">
        <div className="mb-8 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs text-gray-400">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
          {c.summit}
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-center max-w-4xl leading-[1.1] mb-6">
          {c.heroTitle}
        </h1>
        
        <p className="text-lg md:text-xl text-gray-400 text-center max-w-2xl mb-10 leading-relaxed">
          {c.heroSubtitle}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-16">
          <Link href="/playground" className="px-6 py-3 bg-white text-black font-medium rounded text-center hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
            {c.tryDemo}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
          <Link href="/remittance" className="px-6 py-3 border border-white/20 bg-transparent text-white font-medium rounded text-center hover:bg-white/5 transition-colors">
            {c.tryRemittance}
          </Link>
          <a href="https://github.com/WritzProtocol/rampkit-latam" target="_blank" rel="noopener noreferrer" className="px-6 py-3 border border-white/10 bg-transparent text-white font-medium rounded text-center hover:bg-white/5 transition-colors">
            {c.github}
          </a>
        </div>

        {/* Hero Code Snippet */}
        <div className="w-full max-w-3xl rounded-lg border border-white/10 bg-[#111] overflow-hidden shadow-2xl">
          <div className="flex items-center px-4 py-3 border-b border-white/10 bg-[#1A1A1A]">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
            </div>
            <div className="ml-4 text-xs font-mono text-gray-500">router.ts</div>
          </div>
          <div className="p-6 overflow-x-auto">
            <pre className="text-sm font-mono leading-relaxed text-gray-300">
              <code>
<span className="text-gray-500">// Fetch quotes from all LATAM anchors in parallel</span>{'\n'}
<span className="text-blue-400">const</span> router = <span className="text-purple-400">new</span> RampRouter(config);{'\n\n'}
<span className="text-blue-400">const</span> quotes = <span className="text-purple-400">await</span> router.getQuotes({'{'}{'\n'}
{'  '}direction: <span className="text-green-400">'on-ramp'</span>,{'\n'}
{'  '}sourceAsset: <span className="text-green-400">'BRL'</span>,{'\n'}
{'  '}amount: <span className="text-green-400">'1000'</span>,{'\n'}
{'}'});{'\n\n'}
<span className="text-gray-500">// RampKit guarantees quotes[0] is the cheapest rate</span>{'\n'}
<span className="text-blue-400">const</span> order = <span className="text-purple-400">await</span> router.executeRamp(quotes[0], stellarAddress);{'\n'}
console.log(<span className="text-green-400">'PIX QR Code:'</span>, order.quote.paymentDetails.pixCopyPaste);
              </code>
            </pre>
          </div>
        </div>
      </section>

      {/* The Problem & Solution Section */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-24 border-b border-white/5">
        <div className="mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">{c.whyBuilt}</h2>
          <p className="text-gray-400 max-w-3xl text-lg leading-relaxed">
            {c.whyDesc}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="p-8 rounded border border-white/10 bg-[#111]">
            <h3 className="text-xl font-bold mb-3 text-white">{c.smartRate}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              {c.smartRateDesc}
            </p>
          </div>
          <div className="p-8 rounded border border-white/10 bg-[#111]">
            <h3 className="text-xl font-bold mb-3 text-white">{c.dropIn}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              {c.dropInDesc}
            </p>
          </div>
          <div className="p-8 rounded border border-white/10 bg-[#111]">
            <h3 className="text-xl font-bold mb-3 text-white">{c.hybridSandbox}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              {c.hybridSandboxDesc}
            </p>
          </div>
        </div>
      </section>

      {/* Supported Corridors */}
      <section id="corridors" className="max-w-6xl mx-auto px-6 py-24 border-b border-white/5">
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">{c.supportedCorridors}</h2>
          <p className="text-gray-400 max-w-2xl text-lg">
            {c.supportedDesc}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#111] border-y border-white/10">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-300">{c.country}</th>
                <th className="px-6 py-4 font-semibold text-gray-300">{c.currency}</th>
                <th className="px-6 py-4 font-semibold text-gray-300">{c.rail}</th>
                <th className="px-6 py-4 font-semibold text-gray-300">{c.anchors}</th>
                <th className="px-6 py-4 font-semibold text-gray-300">{c.assets}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              <tr className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-5 flex items-center gap-3">
                  <span className="text-xs font-semibold px-2 py-1 rounded bg-gray-800 text-gray-300 border border-gray-700">BR</span>
                  <span className="font-medium">{c.brazil}</span>
                </td>
                <td className="px-6 py-5 text-gray-400">BRL</td>
                <td className="px-6 py-5">
                  <span className="px-2 py-1 bg-green-500/10 text-green-400 rounded text-xs border border-green-500/20">PIX</span>
                </td>
                <td className="px-6 py-5 text-gray-400">Etherfuse, Manteca</td>
                <td className="px-6 py-5 font-mono text-xs">USDC, TESOURO</td>
              </tr>
              <tr className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-5 flex items-center gap-3">
                  <span className="text-xs font-semibold px-2 py-1 rounded bg-gray-800 text-gray-300 border border-gray-700">MX</span>
                  <span className="font-medium">{c.mexico}</span>
                </td>
                <td className="px-6 py-5 text-gray-400">MXN</td>
                <td className="px-6 py-5">
                  <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded text-xs border border-blue-500/20">SPEI</span>
                </td>
                <td className="px-6 py-5 text-gray-400">Etherfuse, Koywe</td>
                <td className="px-6 py-5 font-mono text-xs">USDC, CETES</td>
              </tr>
              <tr className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-5 flex items-center gap-3">
                  <span className="text-xs font-semibold px-2 py-1 rounded bg-gray-800 text-gray-300 border border-gray-700">CL</span>
                  <span className="font-medium">{c.chile}</span>
                </td>
                <td className="px-6 py-5 text-gray-400">CLP</td>
                <td className="px-6 py-5">
                  <span className="px-2 py-1 bg-purple-500/10 text-purple-400 rounded text-xs border border-purple-500/20">Khipu</span>
                </td>
                <td className="px-6 py-5 text-gray-400">Koywe</td>
                <td className="px-6 py-5 font-mono text-xs">USDC</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Yield & Soroban Section */}
      <section id="yield" className="max-w-6xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="text-sm font-bold tracking-widest text-gray-500 uppercase mb-3">Smart Contracts</div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">{c.yieldTitle}</h2>
            <p className="text-gray-400 text-lg leading-relaxed mb-6">
              {c.yieldP1}
            </p>
            <p className="text-gray-400 text-lg leading-relaxed mb-8">
              {c.yieldP2}
            </p>
            <Link href="/playground" className="inline-flex items-center gap-2 text-white font-medium hover:text-gray-300 transition-colors border-b border-white pb-1">
              {c.seeYieldDemo}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
            </Link>
          </div>
          
          <div className="relative">
            {/* Visual representation of the flow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white/5 rounded-xl border border-white/10 pointer-events-none"></div>
            <div className="p-8 bg-[#0d0d0d] rounded-xl border border-white/10 shadow-2xl flex flex-col gap-6">
              
              <div className="flex items-center justify-between p-4 bg-[#151515] rounded border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-green-900/50 flex items-center justify-center border border-green-500/30 text-green-400">
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11m16-11v11M8 14v3m4-3v3m4-3v3" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-200">{c.userBank}</div>
                    <div className="text-xs text-gray-500">{c.pixPayment}</div>
                  </div>
                </div>
                <div className="text-sm font-mono text-gray-400">R$ 1,000</div>
              </div>

              <div className="flex justify-center -my-2 text-gray-600">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M19 12l-7 7-7-7"/></svg>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#151515] rounded border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-blue-900/50 flex items-center justify-center border border-blue-500/30 text-blue-400">
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-200">{c.rkSdk}</div>
                    <div className="text-xs text-gray-500">{c.efRouter}</div>
                  </div>
                </div>
                <div className="text-sm font-mono text-gray-400">{c.usdcBridge}</div>
              </div>

              <div className="flex justify-center -my-2 text-gray-600">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M19 12l-7 7-7-7"/></svg>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#151515] rounded border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-purple-900/50 flex items-center justify-center border border-purple-500/30 text-purple-400">
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-purple-400">{c.sorobanVault}</div>
                    <div className="text-xs text-gray-500">{c.tesouroContract}</div>
                  </div>
                </div>
                <div className="text-sm font-mono text-green-400 font-bold">+13.25% APY</div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-white/10 bg-[#050505]">
        <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-white/50 rounded-sm"></div>
            <span className="font-semibold text-gray-500 tracking-tight">RampKit LATAM</span>
          </div>
          <p className="text-sm text-gray-600 text-center md:text-left">
            {c.builtFor}
          </p>
          <div className="flex gap-4">
            <a href="https://github.com/WritzProtocol/rampkit-latam" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 hover:text-white transition-colors">GitHub Repository</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
