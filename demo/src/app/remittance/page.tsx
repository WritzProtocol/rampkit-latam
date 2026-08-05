'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { RemittanceQuote } from 'rampkit-latam-core';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageSelector } from '../../components/LanguageSelector';

const CORRIDORS = [
  { id: 'BR-MX', fromCountry: 'BR', fromCurrency: 'BRL', toCountry: 'MX', toCurrency: 'MXN', fromFlag: '🇧🇷', toFlag: '🇲🇽', send: 'PIX', receive: 'SPEI' },
  { id: 'BR-CL', fromCountry: 'BR', fromCurrency: 'BRL', toCountry: 'CL', toCurrency: 'CLP', fromFlag: '🇧🇷', toFlag: '🇨🇱', send: 'PIX', receive: 'Khipu' },
  { id: 'MX-BR', fromCountry: 'MX', fromCurrency: 'MXN', toCountry: 'BR', toCurrency: 'BRL', fromFlag: '🇲🇽', toFlag: '🇧🇷', send: 'SPEI', receive: 'PIX' },
  { id: 'US-BR', fromCountry: 'US', fromCurrency: 'USD', toCountry: 'BR', toCurrency: 'BRL', fromFlag: '🇺🇸', toFlag: '🇧🇷', send: 'Wire', receive: 'PIX' },
  { id: 'US-MX', fromCountry: 'US', fromCurrency: 'USD', toCountry: 'MX', toCurrency: 'MXN', fromFlag: '🇺🇸', toFlag: '🇲🇽', send: 'Wire', receive: 'SPEI' },
] as const;

const CONTENT = {
  en: {
    back: 'Back to Landing Page',
    title: 'Cross-Border Remittance',
    subtitle: 'Send money between LATAM countries. The router picks the best anchor for each leg independently.',
    corridor: 'Corridor',
    youSend: 'You send',
    recipientGets: 'Recipient gets',
    getQuote: 'Get Quote',
    quoting: 'Finding best route...',
    route: 'Settlement route',
    sendLeg: 'Send leg (on-ramp)',
    bridge: 'Stablecoin bridge',
    receiveLeg: 'Receive leg (off-ramp)',
    via: 'via',
    effectiveRate: 'Effective rate',
    totalFees: 'Total fees',
    eta: 'Estimated time',
    seconds: 'sec',
    send: 'Send Money',
    sending: 'Creating order...',
    paymentTitle: 'Pay to complete the transfer',
    paymentDesc: 'Scan or copy the code below. Once payment settles, the recipient is paid out automatically on the receive leg.',
    copy: 'Copy code',
    copied: 'Copied',
    newTransfer: 'New transfer',
    noRoute: 'No anchor can serve this corridor right now.',
    compare: 'Compared across all configured anchors',
  },
  es: {
    back: 'Volver al Inicio',
    title: 'Remesas Transfronterizas',
    subtitle: 'Envía dinero entre países de LATAM. El router elige el mejor anchor para cada tramo de forma independiente.',
    corridor: 'Corredor',
    youSend: 'Tú envías',
    recipientGets: 'El destinatario recibe',
    getQuote: 'Cotizar',
    quoting: 'Buscando la mejor ruta...',
    route: 'Ruta de liquidación',
    sendLeg: 'Tramo de envío (on-ramp)',
    bridge: 'Puente stablecoin',
    receiveLeg: 'Tramo de recepción (off-ramp)',
    via: 'vía',
    effectiveRate: 'Tasa efectiva',
    totalFees: 'Comisiones totales',
    eta: 'Tiempo estimado',
    seconds: 'seg',
    send: 'Enviar Dinero',
    sending: 'Creando orden...',
    paymentTitle: 'Paga para completar el envío',
    paymentDesc: 'Escanea o copia el código. Cuando el pago se liquide, el destinatario recibe su dinero automáticamente en el tramo de salida.',
    copy: 'Copiar código',
    copied: 'Copiado',
    newTransfer: 'Nuevo envío',
    noRoute: 'Ningún anchor puede cubrir este corredor ahora mismo.',
    compare: 'Comparado entre todos los anchors configurados',
  },
  'pt-BR': {
    back: 'Voltar ao Início',
    title: 'Remessas Internacionais',
    subtitle: 'Envie dinheiro entre países da América Latina. O router escolhe o melhor anchor para cada trecho de forma independente.',
    corridor: 'Corredor',
    youSend: 'Você envia',
    recipientGets: 'O destinatário recebe',
    getQuote: 'Cotar',
    quoting: 'Buscando a melhor rota...',
    route: 'Rota de liquidação',
    sendLeg: 'Trecho de envio (on-ramp)',
    bridge: 'Ponte stablecoin',
    receiveLeg: 'Trecho de recebimento (off-ramp)',
    via: 'via',
    effectiveRate: 'Taxa efetiva',
    totalFees: 'Taxas totais',
    eta: 'Tempo estimado',
    seconds: 'seg',
    send: 'Enviar Dinheiro',
    sending: 'Criando ordem...',
    paymentTitle: 'Pague para concluir a transferência',
    paymentDesc: 'Escaneie ou copie o código. Assim que o pagamento liquidar, o destinatário recebe automaticamente no trecho de saída.',
    copy: 'Copiar código',
    copied: 'Copiado',
    newTransfer: 'Nova transferência',
    noRoute: 'Nenhum anchor cobre este corredor no momento.',
    compare: 'Comparado entre todos os anchors configurados',
  },
};

const STELLAR_ADDRESS = 'GBAEGEMNJHS5KP5CORUKHYITFI562KK3WP3CO7YRU7B3522MSC6UZ22P';

export default function RemittancePage() {
  const { locale } = useLanguage();
  const c = CONTENT[locale] || CONTENT['en'];

  const [corridorId, setCorridorId] = useState<string>('BR-MX');
  const [amount, setAmount] = useState('500');
  const [quote, setQuote] = useState<RemittanceQuote | null>(null);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const corridor = CORRIDORS.find((x) => x.id === corridorId)!;

  const handleQuote = async () => {
    setLoading(true);
    setError(null);
    setQuote(null);
    setOrder(null);
    try {
      const res = await fetch('/api/remittance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromCountry: corridor.fromCountry,
          fromCurrency: corridor.fromCurrency,
          toCountry: corridor.toCountry,
          toCurrency: corridor.toCurrency,
          amount,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || c.noRoute);
      setQuote(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!quote) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch('/api/remittance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute',
          quote,
          stellarAddress: STELLAR_ADDRESS,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setOrder(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const paymentCode =
    order?.quote?.paymentDetails?.pixCopyPaste ||
    order?.quote?.paymentDetails?.speiClabe ||
    order?.anchorOrderId;

  const handleCopy = () => {
    navigator.clipboard.writeText(paymentCode || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setQuote(null);
    setOrder(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-white/30 font-sans flex flex-col">
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
            <Link
              href="/"
              className="px-3 py-1.5 border border-white/20 text-gray-300 text-sm font-medium rounded hover:bg-white/5 hover:text-white transition-colors"
            >
              &larr; {c.back}
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center p-6 md:p-12">
        <div className="w-full max-w-2xl mb-10 text-center">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">{c.title}</h1>
          <p className="text-gray-400">{c.subtitle}</p>
        </div>

        <div className="w-full max-w-2xl border border-white/10 rounded-lg p-6 md:p-8 bg-white/[0.02]">
          {!order && (
            <>
              <label className="block text-xs uppercase tracking-wider text-gray-500 mb-3">
                {c.corridor}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
                {CORRIDORS.map((x) => (
                  <button
                    key={x.id}
                    onClick={() => {
                      setCorridorId(x.id);
                      reset();
                    }}
                    className={`flex items-center justify-between px-4 py-3 rounded border text-sm transition-colors ${
                      corridorId === x.id
                        ? 'border-white/40 bg-white/10 text-white'
                        : 'border-white/10 text-gray-400 hover:border-white/25 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{x.fromFlag}</span>
                      <span className="text-gray-500">&rarr;</span>
                      <span>{x.toFlag}</span>
                      <span className="ml-1 font-medium">
                        {x.fromCurrency} &rarr; {x.toCurrency}
                      </span>
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">
                      {x.send}/{x.receive}
                    </span>
                  </button>
                ))}
              </div>

              <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">
                {c.youSend}
              </label>
              <div className="flex items-center gap-3 mb-6">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    reset();
                  }}
                  className="flex-1 bg-black border border-white/15 rounded px-4 py-3 text-2xl font-semibold focus:outline-none focus:border-white/40"
                />
                <span className="text-xl font-medium text-gray-400 w-16">
                  {corridor.fromCurrency}
                </span>
              </div>

              <button
                onClick={handleQuote}
                disabled={loading || !amount}
                className="w-full py-3 rounded bg-white text-black font-semibold hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? c.quoting : c.getQuote}
              </button>
            </>
          )}

          {error && (
            <div className="mt-4 px-4 py-3 rounded border border-red-500/30 bg-red-950/30 text-red-300 text-sm">
              {error}
            </div>
          )}

          {quote && !order && (
            <div className="mt-8 pt-6 border-t border-white/10">
              <div className="flex items-baseline justify-between mb-6">
                <span className="text-sm text-gray-400">{c.recipientGets}</span>
                <span className="text-3xl font-bold text-green-400">
                  {parseFloat(quote.receiveAmount).toLocaleString(locale, {
                    maximumFractionDigits: 2,
                  })}{' '}
                  <span className="text-lg text-gray-400">{corridor.toCurrency}</span>
                </span>
              </div>

              <div className="text-xs uppercase tracking-wider text-gray-500 mb-3">{c.route}</div>
              <div className="space-y-2 mb-6 font-mono text-sm">
                <div className="flex items-center justify-between px-3 py-2 rounded bg-white/5">
                  <span className="text-gray-400">{c.sendLeg}</span>
                  <span>
                    {parseFloat(quote.sendAmount).toFixed(2)} {corridor.fromCurrency}{' '}
                    <span className="text-gray-500">
                      {c.via} {quote.sendLeg.anchorId}
                    </span>
                  </span>
                </div>
                <div className="flex items-center justify-between px-3 py-2 rounded bg-white/5">
                  <span className="text-gray-400">{c.bridge}</span>
                  <span className="text-blue-300">
                    {parseFloat(quote.sendLeg.destAmount).toFixed(4)} {quote.bridgeAsset}
                  </span>
                </div>
                <div className="flex items-center justify-between px-3 py-2 rounded bg-white/5">
                  <span className="text-gray-400">{c.receiveLeg}</span>
                  <span>
                    {parseFloat(quote.receiveAmount).toFixed(2)} {corridor.toCurrency}{' '}
                    <span className="text-gray-500">
                      {c.via} {quote.receiveLeg.anchorId}
                    </span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6 text-center">
                <div className="border border-white/10 rounded py-3">
                  <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">
                    {c.effectiveRate}
                  </div>
                  <div className="font-mono text-sm">{parseFloat(quote.effectiveRate).toFixed(4)}</div>
                </div>
                <div className="border border-white/10 rounded py-3">
                  <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">
                    {c.totalFees}
                  </div>
                  <div className="font-mono text-sm">{quote.totalFeePercentage.toFixed(2)}%</div>
                </div>
                <div className="border border-white/10 rounded py-3">
                  <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">
                    {c.eta}
                  </div>
                  <div className="font-mono text-sm">
                    {quote.estimatedSeconds} {c.seconds}
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-gray-600 text-center mb-4">{c.compare}</p>

              <button
                onClick={handleSend}
                disabled={sending}
                className="w-full py-3 rounded bg-green-500 text-black font-semibold hover:bg-green-400 transition-colors disabled:opacity-40"
              >
                {sending ? c.sending : c.send}
              </button>
            </div>
          )}

          {order && (
            <div>
              <h2 className="text-xl font-bold mb-2">{c.paymentTitle}</h2>
              <p className="text-sm text-gray-400 mb-6">{c.paymentDesc}</p>

              <div className="p-4 rounded bg-black border border-white/15 mb-4">
                <code className="text-xs text-gray-300 break-all font-mono leading-relaxed">
                  {paymentCode}
                </code>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCopy}
                  className="flex-1 py-3 rounded border border-white/20 text-sm font-medium hover:bg-white/5 transition-colors"
                >
                  {copied ? c.copied : c.copy}
                </button>
                <button
                  onClick={reset}
                  className="flex-1 py-3 rounded bg-white text-black text-sm font-semibold hover:bg-gray-200 transition-colors"
                >
                  {c.newTransfer}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
