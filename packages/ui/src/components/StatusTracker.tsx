/**
 * @rampkit/ui — StatusTracker Component
 *
 * Visual step-by-step order progress tracker.
 * Shows: Payment → Processing → Stellar Settlement → Complete
 */

import React from 'react';
import type { OrderStatus } from '@rampkit/core';

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
  icon: string;
}

const STEPS: Step[] = [
  {
    id: 'payment',
    label: { 'pt-BR': 'Pagamento', es: 'Pago', en: 'Payment' },
    icon: '💳',
  },
  {
    id: 'processing',
    label: { 'pt-BR': 'Processando', es: 'Procesando', en: 'Processing' },
    icon: '⚙️',
  },
  {
    id: 'stellar',
    label: { 'pt-BR': 'Stellar', es: 'Stellar', en: 'Stellar' },
    icon: '🌟',
  },
  {
    id: 'complete',
    label: { 'pt-BR': 'Concluído', es: 'Completado', en: 'Complete' },
    icon: '✅',
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
    ? `https://${network === 'testnet' ? 'testnet.' : ''}stellar.expert/explorer/${network}/tx/${stellarTxHash}`
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
                {isCompleted ? '✓' : isActive ? step.icon : idx + 1}
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
          {isError ? '❌ ' : ''}
          {statusMessage}
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
            🔗 {locale === 'pt-BR' ? 'Ver no Stellar Explorer' : locale === 'es' ? 'Ver en Stellar Explorer' : 'View on Stellar Explorer'}
          </a>
        </p>
      )}
    </div>
  );
};
