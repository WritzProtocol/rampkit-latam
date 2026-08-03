/**
 * @rampkit/ui — QuoteCard Component
 *
 * Displays a single ramp quote from an anchor with rate,
 * fees, estimated time, and payment method. Supports "best rate" badge.
 */

import React from 'react';
import type { RampQuote } from '@rampkit/core';

export interface QuoteCardProps {
  /** The quote to display */
  quote: RampQuote;
  /** Whether this is the best quote */
  isBest?: boolean;
  /** Whether this card is currently selected */
  isSelected?: boolean;
  /** Called when the user clicks this card */
  onSelect?: (quote: RampQuote) => void;
  /** Language for labels */
  locale?: 'pt-BR' | 'es' | 'en';
}

const ANCHOR_LABELS: Record<string, { name: string; emoji: string }> = {
  etherfuse: { name: 'Etherfuse', emoji: '🔗' },
  manteca: { name: 'Manteca', emoji: '🧈' },
  koywe: { name: 'Koywe', emoji: '🌿' },
};

const PAYMENT_ICONS: Record<string, string> = {
  PIX: '⚡',
  SPEI: '🏦',
  KHIPU: '🔄',
  BANK_TRANSFER: '🏛️',
  QR_CODE: '📱',
};

const LABELS: Record<string, Record<string, string>> = {
  'pt-BR': {
    bestRate: 'Melhor taxa',
    fee: 'Taxa',
    time: 'Tempo',
    method: 'Método',
    seconds: 'seg',
    minutes: 'min',
    select: 'Selecionar',
  },
  es: {
    bestRate: 'Mejor tasa',
    fee: 'Comisión',
    time: 'Tiempo',
    method: 'Método',
    seconds: 'seg',
    minutes: 'min',
    select: 'Seleccionar',
  },
  en: {
    bestRate: 'Best rate',
    fee: 'Fee',
    time: 'Time',
    method: 'Method',
    seconds: 'sec',
    minutes: 'min',
    select: 'Select',
  },
};

export const QuoteCard: React.FC<QuoteCardProps> = ({
  quote,
  isBest = false,
  isSelected = false,
  onSelect,
  locale = 'pt-BR',
}) => {
  const anchor = ANCHOR_LABELS[quote.anchorId] || { name: quote.anchorId, emoji: '🔗' };
  const paymentIcon = PAYMENT_ICONS[quote.paymentMethod] || '💳';
  const l = LABELS[locale] || LABELS['en'];

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}${l.seconds}`;
    return `~${Math.ceil(seconds / 60)}${l.minutes}`;
  };

  const classNames = [
    'rk-card',
    'rk-quote-card',
    isSelected && 'rk-quote-card--selected',
    isBest && 'rk-quote-card--best',
    'rk-animate-in',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classNames}
      onClick={() => onSelect?.(quote)}
      role="button"
      tabIndex={0}
      aria-label={`${anchor.name}: ${quote.destAmount} ${quote.destAsset}`}
      onKeyDown={(e) => e.key === 'Enter' && onSelect?.(quote)}
    >
      <div className="rk-quote-card__header">
        <div className="rk-quote-card__anchor">
          <div className="rk-quote-card__anchor-logo">{anchor.emoji}</div>
          <span className="rk-quote-card__anchor-name">{anchor.name}</span>
        </div>
        {isBest && (
          <span className="rk-quote-card__badge">{l.bestRate}</span>
        )}
      </div>

      <div className="rk-quote-card__amount">
        {parseFloat(quote.destAmount).toLocaleString(locale, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 6,
        })}{' '}
        {quote.destAsset}
      </div>

      <div className="rk-quote-card__rate">
        1 {quote.sourceAsset} = {parseFloat(quote.exchangeRate).toFixed(4)}{' '}
        {quote.destAsset}
      </div>

      <div className="rk-quote-card__details">
        <div className="rk-quote-card__detail">
          <div className="rk-quote-card__detail-label">{l.fee}</div>
          <div className="rk-quote-card__detail-value">
            {quote.fees.percentage.toFixed(1)}%
          </div>
        </div>
        <div className="rk-quote-card__detail">
          <div className="rk-quote-card__detail-label">{l.time}</div>
          <div className="rk-quote-card__detail-value">
            {formatTime(quote.estimatedSeconds)}
          </div>
        </div>
        <div className="rk-quote-card__detail">
          <div className="rk-quote-card__detail-label">{l.method}</div>
          <div className="rk-quote-card__detail-value">
            {paymentIcon} {quote.paymentMethod}
          </div>
        </div>
      </div>
    </div>
  );
};
