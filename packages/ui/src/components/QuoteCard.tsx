/**
 * @rampkit/ui — QuoteCard Component
 *
 * Displays a single ramp quote from an anchor with rate,
 * fees, estimated time, and payment method. Supports "best rate" badge.
 */

import React from 'react';
import type { RampQuote } from 'rampkit-latam-core';

export interface QuoteCardProps {
  /** The quote to display */
  quote: RampQuote;
  /** Whether this is the best quote */
  isBest?: boolean;
  /** Whether this card is currently selected */
  isSelected?: boolean;
  /** Called when the user clicks this card */
  onSelect?: (quote: RampQuote) => void;
  locale?: 'pt-BR' | 'es' | 'en';
}

const AnchorIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display: 'inline', verticalAlign: 'middle'}}><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>);
const LightningIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display: 'inline', verticalAlign: 'middle'}}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>);
const BankIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display: 'inline', verticalAlign: 'middle'}}><rect x="3" y="12" width="18" height="6"></rect><polygon points="12 4 4 10 20 10 12 4"></polygon><path d="M4 18v2M20 18v2M8 18v2M16 18v2"></path></svg>);
const TransferIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display: 'inline', verticalAlign: 'middle'}}><polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="14" x2="21" y2="3"></line><polyline points="8 21 3 21 3 16"></polyline><line x1="20" y1="10" x2="3" y2="21"></line></svg>);
const PhoneIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display: 'inline', verticalAlign: 'middle'}}><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>);

const ANCHOR_LABELS: Record<string, { name: string; icon: React.ReactNode }> = {
  etherfuse: { name: 'Etherfuse', icon: <AnchorIcon /> },
  manteca: { name: 'Manteca', icon: <AnchorIcon /> },
  koywe: { name: 'Koywe', icon: <AnchorIcon /> },
};

const PAYMENT_ICONS: Record<string, React.ReactNode> = {
  PIX: <LightningIcon />,
  SPEI: <BankIcon />,
  KHIPU: <TransferIcon />,
  BANK_TRANSFER: <BankIcon />,
  QR_CODE: <PhoneIcon />,
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
  const anchor = ANCHOR_LABELS[quote.anchorId] || { name: quote.anchorId, icon: <AnchorIcon /> };
  const paymentIcon = PAYMENT_ICONS[quote.paymentMethod] || <BankIcon />;
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
          <div className="rk-quote-card__anchor-icon">
            {anchor.icon}
          </div>
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
