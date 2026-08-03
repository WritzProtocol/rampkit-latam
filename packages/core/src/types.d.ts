/**
 * @rampkit/core — Types
 *
 * Core type definitions for the Multi-Anchor Router SDK.
 * These types are shared across all adapters and the router engine.
 */
/** Supported anchor providers */
export type AnchorId = 'etherfuse' | 'manteca' | 'koywe';
/** Supported fiat currencies */
export type FiatCurrency = 'BRL' | 'MXN' | 'CLP' | 'USD';
/** Supported crypto/tokenized assets */
export type CryptoAsset = 'USDC' | 'TESOURO' | 'CETES' | 'USTRY' | 'XLM';
/** Supported countries */
export type Country = 'BR' | 'MX' | 'CL' | 'US';
/** Payment methods by country */
export type PaymentMethod = 'PIX' | 'SPEI' | 'KHIPU' | 'BANK_TRANSFER' | 'QR_CODE';
/** Direction of the ramp operation */
export type RampDirection = 'on-ramp' | 'off-ramp';
/** Fee breakdown for a ramp quote */
export interface RampFees {
    /** Network/gas fee in source currency */
    network: string;
    /** Anchor's service fee in source currency */
    anchor: string;
    /** Total fees in source currency */
    total: string;
    /** Fee percentage (0-100) */
    percentage: number;
}
/**
 * A quote from a specific anchor for a ramp operation.
 * Quotes are time-limited and should be executed before `expiresAt`.
 */
export interface RampQuote {
    /** Which anchor provided this quote */
    anchorId: AnchorId;
    /** Anchor's internal quote ID (for execution) */
    anchorQuoteId: string;
    /** Direction: fiat→crypto or crypto→fiat */
    direction: RampDirection;
    /** Source asset (e.g., 'BRL' for on-ramp, 'USDC' for off-ramp) */
    sourceAsset: string;
    /** Destination asset (e.g., 'USDC' for on-ramp, 'BRL' for off-ramp) */
    destAsset: string;
    /** Amount in source currency */
    sourceAmount: string;
    /** Amount in destination currency (after fees) */
    destAmount: string;
    /** Exchange rate (1 source = X dest) */
    exchangeRate: string;
    /** Fee breakdown */
    fees: RampFees;
    /** Estimated settlement time in seconds */
    estimatedSeconds: number;
    /** When this quote expires (typically 2 minutes) */
    expiresAt: Date;
    /** Available payment method for this quote */
    paymentMethod: PaymentMethod;
    /** Country this quote is valid for */
    country: Country;
    /** Payment details (populated after execution) */
    paymentDetails?: PaymentDetails;
}
/** Payment details returned after order creation */
export interface PaymentDetails {
    /** PIX QR code (base64 or EMV code) */
    pixQrCode?: string;
    /** PIX copy-paste key */
    pixCopyPaste?: string;
    /** SPEI CLABE number */
    speiClabe?: string;
    /** SPEI reference number */
    speiReference?: string;
    /** Generic redirect URL for hosted flows */
    redirectUrl?: string;
}
/** Order status across all anchors */
export type OrderStatus = 'pending_payment' | 'payment_received' | 'processing' | 'stellar_pending' | 'completed' | 'failed' | 'expired' | 'refunded';
/**
 * A ramp order tracked across its lifecycle.
 */
export interface RampOrder {
    /** RampKit internal order ID */
    orderId: string;
    /** Anchor's internal order ID */
    anchorOrderId: string;
    /** Which anchor is processing this order */
    anchorId: AnchorId;
    /** Current status */
    status: OrderStatus;
    /** The quote this order was created from */
    quote: RampQuote;
    /** User's Stellar wallet address (G...) */
    stellarAddress: string;
    /** Stellar transaction hash (when available) */
    stellarTxHash?: string;
    /** When the order was created */
    createdAt: Date;
    /** When the order was last updated */
    updatedAt: Date;
    /** Human-readable status message */
    statusMessage?: string;
}
/**
 * A corridor defines a supported fiat↔crypto path through a specific anchor.
 */
export interface Corridor {
    /** Which anchor serves this corridor */
    anchorId: AnchorId;
    /** Country code */
    country: Country;
    /** Fiat currency */
    fiatCurrency: FiatCurrency;
    /** Available crypto assets */
    cryptoAssets: CryptoAsset[];
    /** Available payment methods */
    paymentMethods: PaymentMethod[];
    /** Supported directions */
    directions: RampDirection[];
    /** Minimum amount in fiat */
    minAmount?: string;
    /** Maximum amount in fiat */
    maxAmount?: string;
}
/** Configuration for a specific anchor adapter */
export interface AnchorConfig {
    /** API key or access token */
    apiKey: string;
    /** API secret (if required) */
    apiSecret?: string;
    /** Use sandbox environment */
    sandbox?: boolean;
    /** Custom base URL override */
    baseUrl?: string;
}
/**
 * Global configuration for the RampKit Router.
 */
export interface RampKitConfig {
    /** Stellar network to use */
    network: 'testnet' | 'pubnet';
    /** Anchor-specific configurations (only configured anchors are used) */
    anchors: Partial<Record<AnchorId, AnchorConfig>>;
    /** Default strategy for selecting best quote */
    defaultStrategy?: QuoteStrategy;
    /** Webhook URL for order status updates */
    webhookUrl?: string;
}
/** Strategy for selecting the best quote */
export type QuoteStrategy = 'cheapest' | 'fastest' | 'most_reliable';
/** Parameters for requesting quotes */
export interface QuoteRequest {
    /** Direction of the ramp */
    direction: RampDirection;
    /** Source asset (fiat for on-ramp, crypto for off-ramp) */
    sourceAsset: string;
    /** Destination asset (crypto for on-ramp, fiat for off-ramp) */
    destAsset: string;
    /** Amount in source currency */
    amount: string;
    /** Country (determines payment methods) */
    country: Country;
    /** Filter by specific anchors (optional, defaults to all configured) */
    anchorIds?: AnchorId[];
    /** Filter by payment method (optional) */
    paymentMethod?: PaymentMethod;
}
/** Parameters for executing a ramp order */
export interface ExecuteRampParams {
    /** The quote to execute */
    quote: RampQuote;
    /** User's Stellar address (G...) */
    stellarAddress: string;
    /** User's email (required by some anchors for KYC) */
    email?: string;
    /** User's tax ID (CPF for Brazil, CURP for Mexico) */
    taxId?: string;
    /** User's full name */
    fullName?: string;
}
/**
 * Information about a tokenized asset available through an anchor.
 * Used for displaying yield-bearing asset details (e.g., TESOURO).
 */
export interface AnchorAsset {
    /** Asset code on Stellar */
    code: CryptoAsset;
    /** Stellar asset issuer */
    issuer: string;
    /** Human-readable name */
    name: string;
    /** Description */
    description: string;
    /** Anchor providing this asset */
    anchorId: AnchorId;
    /** Country of the underlying asset */
    country: Country;
    /** Annual percentage yield (if yield-bearing) */
    apy?: number;
    /** Current price in USD */
    priceUsd?: string;
    /** Current price in local fiat */
    priceLocal?: string;
    /** Local fiat currency */
    localCurrency?: FiatCurrency;
    /** Is this a yield-bearing stablebond? */
    isYieldBearing: boolean;
}
/** Events emitted by the router for UI updates */
export type RampEvent = {
    type: 'quote_received';
    quotes: RampQuote[];
} | {
    type: 'order_created';
    order: RampOrder;
} | {
    type: 'status_updated';
    order: RampOrder;
} | {
    type: 'order_completed';
    order: RampOrder;
} | {
    type: 'order_failed';
    order: RampOrder;
    error: string;
} | {
    type: 'error';
    error: string;
    anchorId?: AnchorId;
};
/** Event listener callback */
export type RampEventListener = (event: RampEvent) => void;
//# sourceMappingURL=types.d.ts.map