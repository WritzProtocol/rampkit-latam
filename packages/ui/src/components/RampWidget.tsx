/**
 * @rampkit/ui — RampWidget Component
 *
 * The main drop-in widget for fiat on/off-ramp.
 * Combines amount input, currency selection, multi-anchor quotes,
 * and order execution into a single embeddable component.
 *
 * Usage:
 * ```tsx
 * import { RampWidget } from '@rampkit/ui';
 *
 * <RampWidget
 *   router={router}
 *   stellarAddress="G..."
 *   defaultCountry="BR"
 *   locale="pt-BR"
 *   onComplete={(order) => console.log('Done!', order)}
 * />
 * ```
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { RampRouter, RampQuote, RampOrder, Country, RampDirection } from '@rampkit/core';
import { QuoteCard } from './QuoteCard';
import { StatusTracker } from './StatusTracker';

export interface RampWidgetProps {
  /** Configured RampRouter instance */
  router: RampRouter;
  /** User's Stellar wallet address */
  stellarAddress: string;
  /** Default country */
  defaultCountry?: Country;
  /** Default direction */
  defaultDirection?: RampDirection;
  /** Language */
  locale?: 'pt-BR' | 'es' | 'en';
  /** Called when an order completes */
  onComplete?: (order: RampOrder) => void;
  /** Called on error */
  onError?: (error: Error) => void;
  /** Custom CSS class */
  className?: string;
}

interface CurrencyOption {
  code: string;
  flag: string;
  country: Country;
}

const CURRENCIES: CurrencyOption[] = [
  { code: 'BRL', flag: '🇧🇷', country: 'BR' },
  { code: 'MXN', flag: '🇲🇽', country: 'MX' },
  { code: 'CLP', flag: '🇨🇱', country: 'CL' },
];

const CRYPTO_OPTIONS = ['USDC', 'TESOURO', 'CETES'];

const LABELS: Record<string, Record<string, string>> = {
  'pt-BR': {
    title: 'Ramp',
    onRamp: 'Comprar',
    offRamp: 'Vender',
    amount: 'Valor',
    youPay: 'Você paga',
    youReceive: 'Você recebe',
    getQuotes: 'Buscar cotações',
    execute: 'Confirmar',
    loading: 'Buscando melhores taxas...',
    noQuotes: 'Nenhuma cotação disponível para este corredor.',
    processing: 'Processando seu pedido...',
    completed: 'Transação concluída!',
    newTransaction: 'Nova transação',
    stellarAddress: 'Endereço Stellar',
  },
  es: {
    title: 'Ramp',
    onRamp: 'Comprar',
    offRamp: 'Vender',
    amount: 'Monto',
    youPay: 'Usted paga',
    youReceive: 'Usted recibe',
    getQuotes: 'Buscar cotizaciones',
    execute: 'Confirmar',
    loading: 'Buscando mejores tasas...',
    noQuotes: 'No hay cotizaciones disponibles para este corredor.',
    processing: 'Procesando su pedido...',
    completed: '¡Transacción completada!',
    newTransaction: 'Nueva transacción',
    stellarAddress: 'Dirección Stellar',
  },
  en: {
    title: 'Ramp',
    onRamp: 'Buy',
    offRamp: 'Sell',
    amount: 'Amount',
    youPay: 'You pay',
    youReceive: 'You receive',
    getQuotes: 'Get quotes',
    execute: 'Confirm',
    loading: 'Fetching best rates...',
    noQuotes: 'No quotes available for this corridor.',
    processing: 'Processing your order...',
    completed: 'Transaction complete!',
    newTransaction: 'New transaction',
    stellarAddress: 'Stellar Address',
  },
};

type WidgetStep = 'input' | 'quotes' | 'executing' | 'tracking' | 'completed';

export const RampWidget: React.FC<RampWidgetProps> = ({
  router,
  stellarAddress,
  defaultCountry = 'BR',
  defaultDirection = 'on-ramp',
  locale = 'pt-BR',
  onComplete,
  onError,
  className,
}) => {
  const [step, setStep] = useState<WidgetStep>('input');
  const [direction, setDirection] = useState<RampDirection>(defaultDirection);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(CURRENCIES.find((c) => c.country === defaultCountry) || CURRENCIES[0]);
  const [cryptoAsset, setCryptoAsset] = useState('USDC');
  const [quotes, setQuotes] = useState<RampQuote[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<RampQuote | null>(null);
  const [order, setOrder] = useState<RampOrder | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const l = LABELS[locale] || LABELS['en'];

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleGetQuotes = useCallback(async () => {
    if (!amount || parseFloat(amount) <= 0) return;

    setIsLoading(true);
    setError(null);
    setQuotes([]);

    try {
      const sourceAsset = direction === 'on-ramp' ? currency.code : cryptoAsset;
      const destAsset = direction === 'on-ramp' ? cryptoAsset : currency.code;

      const results = await router.getQuotes({
        direction,
        sourceAsset,
        destAsset,
        amount,
        country: currency.country,
      });

      setQuotes(results);
      setStep('quotes');

      if (results.length > 0) {
        setSelectedQuote(results[0]); // Auto-select best
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get quotes';
      setError(message);
      onError?.(err instanceof Error ? err : new Error(message));
    } finally {
      setIsLoading(false);
    }
  }, [amount, direction, currency, cryptoAsset, router, onError]);

  const handleExecute = useCallback(async () => {
    if (!selectedQuote) return;

    setStep('executing');
    setError(null);

    try {
      const result = await router.executeRamp(selectedQuote, stellarAddress);
      setOrder(result);
      setStep('tracking');

      // Start polling for status updates
      pollRef.current = setInterval(async () => {
        try {
          const updated = await router.getStatus(result.orderId, result.anchorId);
          setOrder(updated);

          if (updated.status === 'completed') {
            clearInterval(pollRef.current!);
            pollRef.current = null;
            setStep('completed');
            onComplete?.(updated);
          } else if (updated.status === 'failed' || updated.status === 'expired') {
            clearInterval(pollRef.current!);
            pollRef.current = null;
            setError(updated.statusMessage || 'Order failed');
          }
        } catch {
          // Ignore polling errors
        }
      }, 5000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to execute order';
      setError(message);
      setStep('quotes');
      onError?.(err instanceof Error ? err : new Error(message));
    }
  }, [selectedQuote, stellarAddress, router, onComplete, onError]);

  const handleReset = useCallback(() => {
    setStep('input');
    setAmount('');
    setQuotes([]);
    setSelectedQuote(null);
    setOrder(null);
    setError(null);
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  return (
    <div className={`rk-widget ${className || ''}`}>
      <div className="rk-card" style={{ maxWidth: '440px', margin: '0 auto' }}>
        {/* Direction Toggle */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: 'var(--rk-bg-glass)', borderRadius: 'var(--rk-radius-md)', padding: '4px' }}>
          <button
            className={`rk-button ${direction === 'on-ramp' ? 'rk-button--primary' : 'rk-button--outline'}`}
            onClick={() => setDirection('on-ramp')}
            style={{ flex: 1, padding: '10px', fontSize: '14px' }}
          >
            {l.onRamp}
          </button>
          <button
            className={`rk-button ${direction === 'off-ramp' ? 'rk-button--primary' : 'rk-button--outline'}`}
            onClick={() => setDirection('off-ramp')}
            style={{ flex: 1, padding: '10px', fontSize: '14px' }}
          >
            {l.offRamp}
          </button>
        </div>

        {/* Step: Input */}
        {(step === 'input' || step === 'quotes') && (
          <>
            {/* Amount Input */}
            <div className="rk-input-group">
              <label className="rk-input-group__label">
                {direction === 'on-ramp' ? l.youPay : l.youReceive}
              </label>
              <div className="rk-input-group__wrapper">
                <input
                  className="rk-input"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (step === 'quotes') setStep('input');
                  }}
                  id="rk-amount-input"
                />
                <select
                  className="rk-currency-selector"
                  value={currency.code}
                  onChange={(e) => {
                    const found = CURRENCIES.find((c) => c.code === e.target.value);
                    if (found) setCurrency(found);
                  }}
                  id="rk-currency-select"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Crypto Asset Selector */}
            <div className="rk-input-group">
              <label className="rk-input-group__label">
                {direction === 'on-ramp' ? l.youReceive : l.youPay}
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {CRYPTO_OPTIONS.map((asset) => (
                  <button
                    key={asset}
                    className={`rk-button ${cryptoAsset === asset ? 'rk-button--primary' : 'rk-button--outline'}`}
                    onClick={() => setCryptoAsset(asset)}
                    style={{ flex: 1, padding: '10px', fontSize: '13px' }}
                  >
                    {asset === 'TESOURO' ? '🇧🇷 ' : asset === 'CETES' ? '🇲🇽 ' : '💲 '}
                    {asset}
                  </button>
                ))}
              </div>
            </div>

            {/* Get Quotes Button */}
            {step === 'input' && (
              <button
                className="rk-button rk-button--primary"
                onClick={handleGetQuotes}
                disabled={isLoading || !amount || parseFloat(amount) <= 0}
                id="rk-get-quotes-btn"
              >
                {isLoading ? l.loading : l.getQuotes}
              </button>
            )}
          </>
        )}

        {/* Step: Quotes */}
        {step === 'quotes' && quotes.length > 0 && (
          <div className="rk-animate-slide" style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              {quotes.map((quote, idx) => (
                <QuoteCard
                  key={`${quote.anchorId}-${idx}`}
                  quote={quote}
                  isBest={idx === 0}
                  isSelected={selectedQuote?.anchorQuoteId === quote.anchorQuoteId}
                  onSelect={setSelectedQuote}
                  locale={locale}
                />
              ))}
            </div>

            <button
              className="rk-button rk-button--success"
              onClick={handleExecute}
              disabled={!selectedQuote}
              id="rk-execute-btn"
            >
              {l.execute}
            </button>
          </div>
        )}

        {step === 'quotes' && quotes.length === 0 && !isLoading && (
          <p style={{ textAlign: 'center', color: 'var(--rk-text-muted)', padding: '24px 0' }}>
            {l.noQuotes}
          </p>
        )}

        {/* Step: Executing */}
        {step === 'executing' && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', animation: 'rk-pulse 1.5s ease-in-out infinite' }}>
              ⏳
            </div>
            <p style={{ color: 'var(--rk-text-secondary)' }}>{l.processing}</p>
          </div>
        )}

        {/* Step: Tracking */}
        {(step === 'tracking' || step === 'completed') && order && (
          <div className="rk-animate-slide">
            <StatusTracker
              status={order.status}
              stellarTxHash={order.stellarTxHash}
              statusMessage={order.statusMessage}
              locale={locale}
            />

            {/* PIX QR Code */}
            {order.quote.paymentDetails?.pixCopyPaste && order.status === 'pending_payment' && (
              <div style={{
                background: 'var(--rk-bg-glass)',
                border: '1px solid var(--rk-border)',
                borderRadius: 'var(--rk-radius-md)',
                padding: '20px',
                marginTop: '16px',
                textAlign: 'center',
              }}>
                <p style={{ fontSize: '13px', color: 'var(--rk-text-secondary)', marginBottom: '12px' }}>
                  {locale === 'pt-BR' ? '📋 Copie o código PIX:' : '📋 Copy PIX code:'}
                </p>
                <code style={{
                  display: 'block',
                  padding: '12px',
                  background: 'var(--rk-bg-secondary)',
                  borderRadius: 'var(--rk-radius-sm)',
                  fontSize: '11px',
                  wordBreak: 'break-all',
                  color: 'var(--rk-text-accent)',
                  fontFamily: 'var(--rk-font-mono)',
                }}>
                  {order.quote.paymentDetails.pixCopyPaste}
                </code>
              </div>
            )}

            {step === 'completed' && (
              <div style={{ textAlign: 'center', marginTop: '24px' }}>
                <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--rk-text-success)', marginBottom: '16px' }}>
                  ✅ {l.completed}
                </p>
                <button
                  className="rk-button rk-button--outline"
                  onClick={handleReset}
                >
                  {l.newTransaction}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div style={{
            marginTop: '16px',
            padding: '12px 16px',
            background: 'rgba(245, 87, 108, 0.1)',
            border: '1px solid rgba(245, 87, 108, 0.3)',
            borderRadius: 'var(--rk-radius-sm)',
            color: 'var(--rk-text-warning)',
            fontSize: '13px',
          }}>
            ⚠️ {error}
          </div>
        )}
      </div>
    </div>
  );
};
