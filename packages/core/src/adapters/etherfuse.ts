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

import { BaseAnchorAdapter, RampAdapterError } from './base';
import {
  AnchorConfig,
  AnchorAsset,
  Corridor,
  RampQuote,
  RampOrder,
  QuoteRequest,
  ExecuteRampParams,
  PaymentDetails,
  OrderStatus,
} from '../types';

// ─── Etherfuse API Response Types ──────────────────────────────

interface EtherfuseQuoteResponse {
  id: string;
  source_amount: number;
  destination_amount: number;
  exchange_rate: number;
  fee: number;
  fee_percentage: number;
  expires_at: string;
  source_currency: string;
  destination_currency: string;
  payment_method: string;
}

interface EtherfuseOrderResponse {
  id: string;
  status: string;
  quote_id: string;
  source_amount: number;
  destination_amount: number;
  payment_details?: {
    pix_qr_code?: string;
    pix_copy_paste?: string;
    redirect_url?: string;
  };
  stellar_tx_hash?: string;
  created_at: string;
  updated_at: string;
}

interface EtherfuseAssetResponse {
  id: string;
  code: string;
  name: string;
  description: string;
  issuer: string;
  apy: number;
  price_usd: number;
  price_brl?: number;
  country: string;
  type: string;
}

// ─── Adapter Implementation ────────────────────────────────────

const SANDBOX_URL = 'https://api.sand.etherfuse.com';
const PROD_URL = 'https://api.etherfuse.com';

export class EtherfuseAdapter extends BaseAnchorAdapter {
  constructor(config: AnchorConfig) {
    const baseUrl = config.sandbox !== false ? SANDBOX_URL : PROD_URL;
    super('etherfuse', config, baseUrl);
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.apiRequest<unknown>('GET', '/lookup/stablebonds');
      return true;
    } catch {
      return false;
    }
  }

  getSupportedCorridors(): Corridor[] {
    return [
      {
        anchorId: 'etherfuse',
        country: 'BR',
        fiatCurrency: 'BRL',
        cryptoAssets: ['USDC', 'TESOURO'],
        paymentMethods: ['PIX'],
        directions: ['on-ramp', 'off-ramp'],
        minAmount: '10',
        maxAmount: '50000',
      },
      {
        anchorId: 'etherfuse',
        country: 'MX',
        fiatCurrency: 'MXN',
        cryptoAssets: ['USDC', 'CETES'],
        paymentMethods: ['SPEI', 'BANK_TRANSFER'],
        directions: ['on-ramp', 'off-ramp'],
        minAmount: '100',
        maxAmount: '500000',
      },
      {
        anchorId: 'etherfuse',
        country: 'US',
        fiatCurrency: 'USD',
        cryptoAssets: ['USDC', 'USTRY'],
        paymentMethods: ['BANK_TRANSFER'],
        directions: ['on-ramp', 'off-ramp'],
        minAmount: '10',
        maxAmount: '100000',
      },
    ];
  }

  async getAssets(): Promise<AnchorAsset[]> {
    try {
      const response = await this.apiRequest<EtherfuseAssetResponse[]>(
        'GET',
        '/lookup/stablebonds',
      );

      return response.map((asset) => ({
        code: asset.code as any,
        issuer: asset.issuer,
        name: asset.name,
        description: asset.description,
        anchorId: 'etherfuse' as const,
        country: asset.country === 'BR' ? 'BR' as const : asset.country === 'MX' ? 'MX' as const : 'US' as const,
        apy: asset.apy,
        priceUsd: asset.price_usd.toString(),
        priceLocal: asset.price_brl?.toString(),
        localCurrency: asset.country === 'BR' ? 'BRL' as const : asset.country === 'MX' ? 'MXN' as const : 'USD' as const,
        isYieldBearing: asset.type === 'stablebond',
      }));
    } catch {
      // Return known assets as fallback for demo
      return this.getKnownAssets();
    }
  }

  async getQuote(params: QuoteRequest): Promise<RampQuote | null> {
    if (!this.supportsQuote(params)) {
      return null;
    }

    try {
      const response = await this.apiRequest<EtherfuseQuoteResponse>(
        'POST',
        '/ramp/quote',
        {
          source_currency: params.sourceAsset,
          destination_currency: params.destAsset,
          amount: parseFloat(params.amount),
          direction: params.direction === 'on-ramp' ? 'buy' : 'sell',
          country: params.country,
        },
      );

      return this.mapQuoteResponse(response, params);
    } catch (error) {
      // Return simulated quote for demo/sandbox
      return this.getSimulatedQuote(params);
    }
  }

  async executeOrder(params: ExecuteRampParams): Promise<RampOrder> {
    try {
      const response = await this.apiRequest<EtherfuseOrderResponse>(
        'POST',
        '/order',
        {
          quote_id: params.quote.anchorQuoteId,
          stellar_address: params.stellarAddress,
          email: params.email,
          tax_id: params.taxId,
          full_name: params.fullName,
        },
      );

      return this.mapOrderResponse(response, params.quote);
    } catch (error) {
      // Return simulated order for demo
      return this.getSimulatedOrder(params);
    }
  }

  async getOrderStatus(anchorOrderId: string): Promise<RampOrder> {
    try {
      const response = await this.apiRequest<EtherfuseOrderResponse>(
        'GET',
        `/order/${anchorOrderId}`,
      );

      return this.mapOrderResponse(response);
    } catch {
      throw new RampAdapterError('etherfuse', `Order ${anchorOrderId} not found`);
    }
  }

  async cancelOrder(anchorOrderId: string): Promise<boolean> {
    try {
      await this.apiRequest('DELETE', `/order/${anchorOrderId}`);
      return true;
    } catch {
      return false;
    }
  }

  // ─── Private Helpers ──────────────────────────────────────────

  private mapQuoteResponse(
    response: EtherfuseQuoteResponse,
    params: QuoteRequest,
  ): RampQuote {
    const paymentMethod = params.country === 'BR' ? 'PIX' as const
      : params.country === 'MX' ? 'SPEI' as const
      : 'BANK_TRANSFER' as const;

    return {
      anchorId: 'etherfuse',
      anchorQuoteId: response.id,
      direction: params.direction,
      sourceAsset: response.source_currency,
      destAsset: response.destination_currency,
      sourceAmount: response.source_amount.toString(),
      destAmount: response.destination_amount.toString(),
      exchangeRate: response.exchange_rate.toString(),
      fees: {
        network: '0.01',
        anchor: response.fee.toString(),
        total: response.fee.toString(),
        percentage: response.fee_percentage,
      },
      estimatedSeconds: 120,
      expiresAt: new Date(response.expires_at),
      paymentMethod,
      country: params.country,
    };
  }

  private mapOrderResponse(
    response: EtherfuseOrderResponse,
    quote?: RampQuote,
  ): RampOrder {
    const statusMap: Record<string, OrderStatus> = {
      pending: 'pending_payment',
      payment_received: 'payment_received',
      processing: 'processing',
      completed: 'completed',
      failed: 'failed',
      expired: 'expired',
      refunded: 'refunded',
    };

    return {
      orderId: `ef_${response.id}`,
      anchorOrderId: response.id,
      anchorId: 'etherfuse',
      status: statusMap[response.status] || 'processing',
      quote: quote || ({} as RampQuote),
      stellarAddress: '',
      stellarTxHash: response.stellar_tx_hash,
      createdAt: new Date(response.created_at),
      updatedAt: new Date(response.updated_at),
    };
  }

  /**
   * Simulated quote for sandbox/demo when the API is unavailable.
   * Uses realistic BRL/USDC rates.
   */
  private getSimulatedQuote(params: QuoteRequest): RampQuote {
    const rates: Record<string, number> = {
      'BRL_USDC': 0.175,    // 1 BRL ≈ 0.175 USDC (5.71 BRL/USD)
      'USDC_BRL': 5.71,     // 1 USDC ≈ 5.71 BRL
      'BRL_TESOURO': 0.170, // Slightly less due to yield premium
      'TESOURO_BRL': 5.88,  // Slightly more due to yield
      'MXN_USDC': 0.052,    // 1 MXN ≈ 0.052 USDC
      'USDC_MXN': 19.23,    // 1 USDC ≈ 19.23 MXN
      'MXN_CETES': 0.050,
      'USD_USDC': 1.0,
      'USDC_USD': 1.0,
    };

    const rateKey = `${params.sourceAsset}_${params.destAsset}`;
    const rate = rates[rateKey] || 1;
    const amount = parseFloat(params.amount);
    const feePercent = 1.5; // 1.5% typical anchor fee
    const feeAmount = amount * (feePercent / 100);
    const destAmount = (amount - feeAmount) * rate;

    const paymentMethod = params.country === 'BR' ? 'PIX' as const
      : params.country === 'MX' ? 'SPEI' as const
      : 'BANK_TRANSFER' as const;

    return {
      anchorId: 'etherfuse',
      anchorQuoteId: `sim_ef_${Date.now()}`,
      direction: params.direction,
      sourceAsset: params.sourceAsset,
      destAsset: params.destAsset,
      sourceAmount: amount.toFixed(2),
      destAmount: destAmount.toFixed(6),
      exchangeRate: rate.toFixed(6),
      fees: {
        network: '0.01',
        anchor: feeAmount.toFixed(2),
        total: (feeAmount + 0.01).toFixed(2),
        percentage: feePercent,
      },
      estimatedSeconds: 90,
      expiresAt: new Date(Date.now() + 120_000), // 2 minutes
      paymentMethod,
      country: params.country,
    };
  }

  private getSimulatedOrder(params: ExecuteRampParams): RampOrder {
    const pixCode = '00020126580014br.gov.bcb.pix0136' +
      'a1b2c3d4-e5f6-7890-abcd-ef1234567890' +
      '5204000053039865802BR5913RAMPKIT LATAM6009SAO PAULO' +
      `62070503***6304${Math.random().toString(16).slice(2, 6).toUpperCase()}`;

    return {
      orderId: `ef_sim_${Date.now()}`,
      anchorOrderId: `sim_${Date.now()}`,
      anchorId: 'etherfuse',
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
      statusMessage: 'Aguardando pagamento via PIX',
    };
  }

  private getKnownAssets(): AnchorAsset[] {
    return [
      {
        code: 'TESOURO',
        issuer: 'GBKNOT2L2LMQNBM4BXHXHBZTNZIKPZXHAU4XNQAUHBIFZOCQGRFNL6I',
        name: 'TESOURO',
        description: 'Tokenized Brazilian Treasury Bond (LTN) — Yield-bearing BRL stablebond backed by government debt.',
        anchorId: 'etherfuse',
        country: 'BR',
        apy: 13.25,
        priceUsd: '0.175',
        priceLocal: '1.00',
        localCurrency: 'BRL',
        isYieldBearing: true,
      },
      {
        code: 'CETES',
        issuer: 'GBKNOT2L2LMQNBM4BXHXHBZTNZIKPZXHAU4XNQAUHBIFZOCQGRFNL6I',
        name: 'CETES',
        description: 'Tokenized Mexican Treasury Certificate — Yield-bearing MXN stablebond.',
        anchorId: 'etherfuse',
        country: 'MX',
        apy: 10.5,
        priceUsd: '0.052',
        priceLocal: '1.00',
        localCurrency: 'MXN',
        isYieldBearing: true,
      },
      {
        code: 'USTRY',
        issuer: 'GBKNOT2L2LMQNBM4BXHXHBZTNZIKPZXHAU4XNQAUHBIFZOCQGRFNL6I',
        name: 'USTRY',
        description: 'Tokenized US Treasury Bill — Yield-bearing USD stablebond.',
        anchorId: 'etherfuse',
        country: 'US',
        apy: 4.8,
        priceUsd: '1.00',
        isYieldBearing: true,
      },
    ];
  }
}
