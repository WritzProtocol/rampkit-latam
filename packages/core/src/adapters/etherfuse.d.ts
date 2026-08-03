/**
 * @rampkit/core — Etherfuse Adapter
 *
 * Integrates with Etherfuse's API for on/off-ramp operations and
 * yield-bearing stablebond access (TESOURO, CETES, USTRY).
 *
 * API Docs: https://docs.etherfuse.com
 * Sandbox:  https://api.sand.etherfuse.com
 * Prod:     https://api.etherfuse.com
 */
import { BaseAnchorAdapter } from './base';
import { AnchorConfig, AnchorAsset, Corridor, RampQuote, RampOrder, QuoteRequest, ExecuteRampParams } from '../types';
export declare class EtherfuseAdapter extends BaseAnchorAdapter {
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
    /**
     * Simulated quote for sandbox/demo when the API is unavailable.
     * Uses realistic BRL/USDC rates.
     */
    private getSimulatedQuote;
    private getSimulatedOrder;
    private getKnownAssets;
}
//# sourceMappingURL=etherfuse.d.ts.map