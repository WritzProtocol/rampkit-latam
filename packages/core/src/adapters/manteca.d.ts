/**
 * @rampkit/core — Manteca Adapter
 *
 * Integrates with Manteca's API for BRL fiat ramps via PIX
 * and QR code payments in Brazil.
 *
 * API Docs: https://manteca.dev
 * Contact:  brazil@manteca.dev
 */
import { BaseAnchorAdapter } from './base';
import { AnchorConfig, AnchorAsset, Corridor, RampQuote, RampOrder, QuoteRequest, ExecuteRampParams } from '../types';
export declare class MantecaAdapter extends BaseAnchorAdapter {
    constructor(config: AnchorConfig);
    isAvailable(): Promise<boolean>;
    getSupportedCorridors(): Corridor[];
    getAssets(): Promise<AnchorAsset[]>;
    getQuote(params: QuoteRequest): Promise<RampQuote | null>;
    executeOrder(params: ExecuteRampParams): Promise<RampOrder>;
    getOrderStatus(anchorOrderId: string): Promise<RampOrder>;
    cancelOrder(anchorOrderId: string): Promise<boolean>;
    protected getAuthHeaders(): Record<string, string>;
    private mapQuoteResponse;
    private mapOrderResponse;
    private getSimulatedQuote;
    private getSimulatedOrder;
}
//# sourceMappingURL=manteca.d.ts.map