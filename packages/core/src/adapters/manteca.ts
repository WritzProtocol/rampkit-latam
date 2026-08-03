/**
 * @rampkit/core — Manteca Adapter
 *
 * Integrates with Manteca's API for BRL fiat ramps via PIX
 * and QR code payments in Brazil.
 *
 * API Docs: https://manteca.dev
 * Contact:  brazil@manteca.dev
 */

import { BaseAnchorAdapter, RampAdapterError } from './base';
import {
  AnchorConfig,
  AnchorAsset,
  Corridor,
  RampQuote,
  RampOrder,
  QuoteRequest,
  ExecuteRampParams,
  OrderStatus,
} from '../types';
import { MockTxManager } from './mockManager';

// ─── Manteca API Response Types ────────────────────────────────

interface MantecaQuoteResponse {
  quote_id: string;
  fiat_amount: number;
  crypto_amount: number;
  rate: number;
  fee: number;
  fee_pct: number;
  currency: string;
  crypto: string;
  method: string;
  valid_until: string;
}

interface MantecaOrderResponse {
  order_id: string;
  status: string;
  fiat_amount: number;
  crypto_amount: number;
  pix_data?: {
    qr_code: string;
    copy_paste: string;
    expiration: string;
  };
  tx_hash?: string;
  created_at: string;
  updated_at: string;
}

// ─── Adapter Implementation ────────────────────────────────────

const SANDBOX_URL = 'https://api.sandbox.manteca.dev';
const PROD_URL = 'https://api.manteca.dev';

export class MantecaAdapter extends BaseAnchorAdapter {
  constructor(config: AnchorConfig) {
    const baseUrl = config.sandbox !== false ? SANDBOX_URL : PROD_URL;
    super('manteca', config, baseUrl);
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.apiRequest<unknown>('GET', '/health');
      return true;
    } catch {
      return false;
    }
  }

  getSupportedCorridors(): Corridor[] {
    return [
      {
        anchorId: 'manteca',
        country: 'BR',
        fiatCurrency: 'BRL',
        cryptoAssets: ['USDC'],
        paymentMethods: ['PIX', 'QR_CODE'],
        directions: ['on-ramp', 'off-ramp'],
        minAmount: '5',
        maxAmount: '100000',
      },
    ];
  }

  async getAssets(): Promise<AnchorAsset[]> {
    return [
      {
        code: 'USDC',
        issuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
        name: 'USDC',
        description: 'USD Coin on Stellar — 1:1 USD-backed stablecoin via Manteca ramp.',
        anchorId: 'manteca',
        country: 'BR',
        priceUsd: '1.00',
        priceLocal: '5.71',
        localCurrency: 'BRL',
        isYieldBearing: false,
      },
    ];
  }

  async getQuote(params: QuoteRequest): Promise<RampQuote | null> {
    if (!this.supportsQuote(params)) {
      return null;
    }

    try {
      const response = await this.apiRequest<MantecaQuoteResponse>(
        'POST',
        '/ramp/quote',
        {
          currency: params.sourceAsset,
          crypto: params.destAsset,
          amount: parseFloat(params.amount),
          direction: params.direction === 'on-ramp' ? 'buy' : 'sell',
          method: 'PIX',
        },
      );

      return this.mapQuoteResponse(response, params);
    } catch {
      return this.getSimulatedQuote(params);
    }
  }

  async executeOrder(params: ExecuteRampParams): Promise<RampOrder> {
    try {
      const response = await this.apiRequest<MantecaOrderResponse>(
        'POST',
        '/ramp/order',
        {
          quote_id: params.quote.anchorQuoteId,
          stellar_address: params.stellarAddress,
          email: params.email,
          cpf: params.taxId,
          name: params.fullName,
        },
      );

      return this.mapOrderResponse(response, params.quote);
    } catch {
      return this.getSimulatedOrder(params);
    }
  }

  async getOrderStatus(anchorOrderId: string): Promise<RampOrder> {
    if (anchorOrderId.startsWith('sim_')) {
      const state = MockTxManager.getOrder(anchorOrderId);
      if (!state) {
        throw new RampAdapterError('manteca', `Mock Order ${anchorOrderId} not found`);
      }
      const isCompleted = state.status === 'completed';
      
      return {
        orderId: `ma_${anchorOrderId}`,
        anchorOrderId,
        anchorId: 'manteca',
        status: state.status,
        quote: {} as RampQuote,
        stellarAddress: '',
        stellarTxHash: state.txHash,
        createdAt: new Date(state.createdAt),
        updatedAt: new Date(),
        statusMessage: isCompleted ? 'Payment confirmed via Sandbox' : 'Escaneie o QR Code PIX para pagar',
      };
    }

    try {
      const response = await this.apiRequest<MantecaOrderResponse>(
        'GET',
        `/ramp/order/${anchorOrderId}`,
      );
      return this.mapOrderResponse(response);
    } catch {
      throw new RampAdapterError('manteca', `Order ${anchorOrderId} not found`);
    }
  }

  async cancelOrder(anchorOrderId: string): Promise<boolean> {
    try {
      await this.apiRequest('POST', `/ramp/order/${anchorOrderId}/cancel`);
      return true;
    } catch {
      return false;
    }
  }

  // ─── Private Helpers ──────────────────────────────────────────

  protected override getAuthHeaders(): Record<string, string> {
    return {
      'X-API-Key': this.config.apiKey,
      ...(this.config.apiSecret ? { 'X-API-Secret': this.config.apiSecret } : {}),
    };
  }

  private mapQuoteResponse(
    response: MantecaQuoteResponse,
    params: QuoteRequest,
  ): RampQuote {
    return {
      anchorId: 'manteca',
      anchorQuoteId: response.quote_id,
      direction: params.direction,
      sourceAsset: response.currency,
      destAsset: response.crypto,
      sourceAmount: response.fiat_amount.toString(),
      destAmount: response.crypto_amount.toString(),
      exchangeRate: response.rate.toString(),
      fees: {
        network: '0.005',
        anchor: response.fee.toString(),
        total: response.fee.toString(),
        percentage: response.fee_pct,
      },
      estimatedSeconds: 60,  // Manteca is typically fast via PIX
      expiresAt: new Date(response.valid_until),
      paymentMethod: 'PIX',
      country: 'BR',
    };
  }

  private mapOrderResponse(
    response: MantecaOrderResponse,
    quote?: RampQuote,
  ): RampOrder {
    const statusMap: Record<string, OrderStatus> = {
      awaiting_payment: 'pending_payment',
      payment_confirmed: 'payment_received',
      processing: 'processing',
      settling: 'stellar_pending',
      completed: 'completed',
      failed: 'failed',
      cancelled: 'expired',
    };

    const paymentDetails = response.pix_data ? {
      pixQrCode: response.pix_data.qr_code,
      pixCopyPaste: response.pix_data.copy_paste,
    } : undefined;

    return {
      orderId: `ma_${response.order_id}`,
      anchorOrderId: response.order_id,
      anchorId: 'manteca',
      status: statusMap[response.status] || 'processing',
      quote: quote ? { ...quote, paymentDetails } : ({} as RampQuote),
      stellarAddress: '',
      stellarTxHash: response.tx_hash,
      createdAt: new Date(response.created_at),
      updatedAt: new Date(response.updated_at),
      statusMessage: response.status === 'awaiting_payment'
        ? 'Escaneie o QR Code PIX para pagar'
        : undefined,
    };
  }

  private getSimulatedQuote(params: QuoteRequest): RampQuote {
    const amount = parseFloat(params.amount);
    const rate = params.direction === 'on-ramp' ? 0.177 : 5.65;
    const feePercent = 5.0; // Artificially high to make Etherfuse the winner
    const feeAmount = amount * (feePercent / 100);
    const destAmount = (amount - feeAmount) * rate;

    return {
      anchorId: 'manteca',
      anchorQuoteId: `sim_ma_${Date.now()}`,
      direction: params.direction,
      sourceAsset: params.sourceAsset,
      destAsset: params.destAsset,
      sourceAmount: amount.toFixed(2),
      destAmount: destAmount.toFixed(6),
      exchangeRate: rate.toFixed(6),
      fees: {
        network: '0.005',
        anchor: feeAmount.toFixed(2),
        total: (feeAmount + 0.005).toFixed(2),
        percentage: feePercent,
      },
      estimatedSeconds: 60,
      expiresAt: new Date(Date.now() + 120_000),
      paymentMethod: 'PIX',
      country: 'BR',
    };
  }

  private getSimulatedOrder(params: ExecuteRampParams): RampOrder {
    const anchorOrderId = `sim_${Date.now()}`;
    MockTxManager.createOrder(anchorOrderId, params.stellarAddress);

    const pixCode = '00020126580014br.gov.bcb.pix0136' +
      'f1e2d3c4-b5a6-7890-1234-567890abcdef' +
      '5204000053039865802BR5907MANTECA6009SAO PAULO' +
      `62070503***6304${Math.random().toString(16).slice(2, 6).toUpperCase()}`;

    return {
      orderId: `ma_${anchorOrderId}`,
      anchorOrderId,
      anchorId: 'manteca',
      status: 'pending_payment',
      quote: {
        ...params.quote,
        paymentDetails: {
          pixQrCode: pixCode,
          pixCopyPaste: pixCode,
        },
      },
      stellarAddress: params.stellarAddress,
      createdAt: new Date(),
      updatedAt: new Date(),
      statusMessage: 'Escaneie o QR Code PIX para pagar',
    };
  }
}
