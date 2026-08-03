/**
 * @rampkit/core — Koywe Adapter
 *
 * Integrates with Koywe's API for on/off-ramp operations
 * in Chile (CLP/Khipu) and Mexico (MXN/SPEI).
 *
 * API Docs: https://docs.koywe.com
 */
import { BaseAnchorAdapter } from './base';
import { AnchorConfig, AnchorAsset, Corridor, RampQuote, RampOrder, QuoteRequest, ExecuteRampParams } from '../types';
export declare class KoyweAdapter extends BaseAnchorAdapter {
    constructor(config: AnchorConfig);
    isAvailable(): Promise<boolean>;
    getSupportedCorridors(): Corridor[];
    getAssets(): Promise<AnchorAsset[]>;
    getQuote(params: QuoteRequest): Promise<RampQuote | null>;
    executeOrder(params: ExecuteRampParams): Promise<RampOrder>;
    getOrderStatus(anchorOrderId: string): Promise<RampOrder>;
    cancelOrder(_anchorOrderId: string): Promise<boolean>;
    private getDefaultPaymentMethod;
    private mapQuoteResponse;
    private mapOrderResponse;
    private getSimulatedQuote;
    private getSimulatedOrder;
}
//# sourceMappingURL=koywe.d.ts.map