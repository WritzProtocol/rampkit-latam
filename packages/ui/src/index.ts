/**
 * @rampkit/ui — Public API
 *
 * Drop-in React components for Stellar fiat ramps.
 *
 * @example
 * ```tsx
 * import { RampWidget, SavingsWidget, QuoteCard, StatusTracker } from '@rampkit/ui';
 * import '@rampkit/ui/src/styles/rampkit.css';
 * ```
 */

export { RampWidget } from './components/RampWidget';
export type { RampWidgetProps } from './components/RampWidget';

export { QuoteCard } from './components/QuoteCard';
export type { QuoteCardProps } from './components/QuoteCard';

export { StatusTracker } from './components/StatusTracker';
export type { StatusTrackerProps } from './components/StatusTracker';

export { SavingsWidget } from './components/SavingsWidget';
export type { SavingsWidgetProps, VaultState } from './components/SavingsWidget';
