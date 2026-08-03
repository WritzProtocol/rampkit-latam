/**
 * @rampkit/ui — StatusTracker Component
 *
 * Visual step-by-step order progress tracker.
 * Shows: Payment → Processing → Stellar Settlement → Complete
 */

import React from 'react';
import type { OrderStatus } from 'rampkit-latam-core';

export interface StatusTrackerProps {
  /** Current order status */
  status: OrderStatus;
  /** Stellar transaction hash (shown when available) */
  stellarTxHash?: string;
  /** Status message from the anchor */
  statusMessage?: string;
  /** Language for labels */
  locale?: 'pt-BR' | 'es' | 'en';
  /** Network for explorer link */
  network?: 'testnet' | 'pubnet';
}

interface Step {
  id: string;
  label: Record<string, string>;
  icon: React.ReactNode;
}

const CheckIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>);
const PaymentIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>);
const ProcessingIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>);
const StellarIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>);
const LinkIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display: 'inline', marginRight: '4px', verticalAlign: 'middle', marginTop: '-2px'}}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>);
const ErrorIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display: 'inline', marginRight: '4px', verticalAlign: 'middle', color: 'var(--rk-text-warning)', marginTop: '-2px'}}><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>);

const STEPS: Step[] = [
  {
    id: 'payment',
    label: { 'pt-BR': 'Pagamento', es: 'Pago', en: 'Payment' },
    icon: <PaymentIcon />,
  },
  {
    id: 'processing',
    label: { 'pt-BR': 'Processando', es: 'Procesando', en: 'Processing' },
    icon: <ProcessingIcon />,
  },
  {
    id: 'stellar',
    label: { 'pt-BR': 'Stellar', es: 'Stellar', en: 'Stellar' },
    icon: <StellarIcon />,
  },
  {
    id: 'complete',
    label: { 'pt-BR': 'Concluído', es: 'Completado', en: 'Complete' },
    icon: <CheckIcon />,
  },
];

const STATUS_TO_STEP: Record<OrderStatus, number> = {
  pending_payment: 0,
  payment_received: 1,
  processing: 1,
  stellar_pending: 2,
  completed: 3,
  failed: -1,
  expired: -1,
  refunded: -1,
};

const LOCALIZED_MESSAGES: Record<string, Record<string, string>> = {
  'Payment Approved in Sandbox!': {
    'pt-BR': '¡Pagamento Aprovado no Sandbox do Etherfuse!',
    es: '¡Pago Aprobado en el Sandbox de Etherfuse!',
    en: 'Payment Approved in Etherfuse Sandbox!',
  },
  'Waiting for Sandbox payment approval...': {
    'pt-BR': 'Aguardando aprovação do pagamento no Sandbox...',
    es: 'Esperando aprobación del pago en el Sandbox...',
    en: 'Waiting for Sandbox payment approval...',
  },
  '¡Pagamento Aprovado no Sandbox do Etherfuse!': {
    'pt-BR': '¡Pagamento Aprovado no Sandbox do Etherfuse!',
    es: '¡Pago Aprobado en el Sandbox de Etherfuse!',
    en: 'Payment Approved in Etherfuse Sandbox!',
  },
};

export const StatusTracker: React.FC<StatusTrackerProps> = ({
  status,
  stellarTxHash,
  statusMessage,
  locale = 'pt-BR',
  network = 'testnet',
}) => {
  const currentStep = STATUS_TO_STEP[status] ?? -1;
  const isError = status === 'failed' || status === 'expired' || status === 'refunded';
  const progressPercent = isError ? 0 : Math.min((currentStep / (STEPS.length - 1)) * 100, 100);

  const explorerUrl = stellarTxHash
    ? `https://stellar.expert/explorer/${network === 'testnet' ? 'testnet' : 'public'}/tx/${stellarTxHash}`
    : null;

  return (
    <div className="rk-widget">
      <div className="rk-status-tracker">
        <div className="rk-status-tracker__line">
          <div
            className="rk-status-tracker__progress"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {STEPS.map((step, idx) => {
          const isCompleted = idx < currentStep;
          const isActive = idx === currentStep;

          const dotClass = [
            'rk-status-tracker__dot',
            isCompleted && 'rk-status-tracker__dot--completed',
            isActive && 'rk-status-tracker__dot--active',
          ]
            .filter(Boolean)
            .join(' ');

          const labelClass = [
            'rk-status-tracker__label',
            isActive && 'rk-status-tracker__label--active',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <div key={step.id} className="rk-status-tracker__step">
              <div className={dotClass}>
                {isCompleted ? <CheckIcon /> : isActive ? step.icon : idx + 1}
              </div>
              <span className={labelClass}>
                {step.label[locale] || step.label['en']}
              </span>
            </div>
          );
        })}
      </div>

      {statusMessage && (
        <p
          style={{
            textAlign: 'center',
            fontSize: '14px',
            color: isError ? 'var(--rk-text-warning)' : 'var(--rk-text-secondary)',
            marginTop: '12px',
          }}
        >
          {isError ? <ErrorIcon /> : ''}
          {LOCALIZED_MESSAGES[statusMessage]?.[locale] || statusMessage}
        </p>
      )}

      {explorerUrl && (
        <p style={{ textAlign: 'center', marginTop: '8px' }}>
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'var(--rk-text-accent)',
              fontSize: '13px',
              textDecoration: 'none',
            }}
          >
            <LinkIcon /> {locale === 'pt-BR' ? 'Ver no Stellar Explorer' : locale === 'es' ? 'Ver en Stellar Explorer' : 'View on Stellar Explorer'}
          </a>
        </p>
      )}
    </div>
  );
};
