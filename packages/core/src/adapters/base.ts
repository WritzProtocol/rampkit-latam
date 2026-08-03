/**
 * @rampkit/core — Base Anchor Adapter
 *
 * Abstract interface that all anchor adapters must implement.
 * This ensures a consistent API across Etherfuse, Manteca, and Koywe.
 */

import {
  AnchorId,
  AnchorConfig,
  AnchorAsset,
  Corridor,
  RampQuote,
  RampOrder,
  QuoteRequest,
  ExecuteRampParams,
  OrderStatus,
} from '../types';

/**
 * Abstract base class for anchor adapters.
 * Each anchor (Etherfuse, Manteca, Koywe) extends this class
 * and implements the methods using their specific APIs.
 */
export abstract class BaseAnchorAdapter {
  readonly anchorId: AnchorId;
  protected config: AnchorConfig;
  protected baseUrl: string;

  constructor(anchorId: AnchorId, config: AnchorConfig, defaultBaseUrl: string) {
    this.anchorId = anchorId;
    this.config = config;
    this.baseUrl = config.baseUrl || defaultBaseUrl;
  }

  /**
   * Check if this adapter is properly configured and can accept requests.
   */
  abstract isAvailable(): Promise<boolean>;

  /**
   * Get the corridors (country/currency/asset combinations) this anchor supports.
   */
  abstract getSupportedCorridors(): Corridor[];

  /**
   * Get available tokenized assets from this anchor.
   * For Etherfuse, this includes TESOURO, CETES, USTRY.
   */
  abstract getAssets(): Promise<AnchorAsset[]>;

  /**
   * Request a quote for a ramp operation.
   * Returns null if this anchor doesn't support the requested corridor.
   */
  abstract getQuote(params: QuoteRequest): Promise<RampQuote | null>;

  /**
   * Execute a ramp order using a previously obtained quote.
   * Returns the created order with payment details.
   */
  abstract executeOrder(params: ExecuteRampParams): Promise<RampOrder>;

  /**
   * Get the current status of an order.
   */
  abstract getOrderStatus(anchorOrderId: string): Promise<RampOrder>;

  /**
   * Cancel an order (if supported by the anchor).
   */
  abstract cancelOrder(anchorOrderId: string): Promise<boolean>;

  // ─── Protected Helpers ──────────────────────────────────────

  /**
   * Make an authenticated HTTP request to the anchor's API.
   */
  protected async apiRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    body?: Record<string, unknown>,
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.getAuthHeaders(),
    };

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new RampAdapterError(
        this.anchorId,
        `API request failed: ${response.status} ${response.statusText}`,
        response.status,
        errorBody,
      );
    }

    return response.json() as Promise<T>;
  }

  /**
   * Get anchor-specific authentication headers.
   * Override in subclasses for different auth schemes.
   */
  protected getAuthHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.config.apiKey}`,
    };
  }

  /**
   * Check if this adapter supports a given corridor.
   */
  supportsQuote(params: QuoteRequest): boolean {
    const corridors = this.getSupportedCorridors();
    return corridors.some(
      (c) =>
        c.country === params.country &&
        c.directions.includes(params.direction) &&
        ((params.direction === 'on-ramp' &&
          c.fiatCurrency === params.sourceAsset &&
          c.cryptoAssets.includes(params.destAsset as any)) ||
          (params.direction === 'off-ramp' &&
            c.cryptoAssets.includes(params.sourceAsset as any) &&
            c.fiatCurrency === params.destAsset)),
    );
  }
}

/**
 * Custom error class for anchor adapter failures.
 */
export class RampAdapterError extends Error {
  readonly anchorId: AnchorId;
  readonly statusCode?: number;
  readonly responseBody?: string;

  constructor(
    anchorId: AnchorId,
    message: string,
    statusCode?: number,
    responseBody?: string,
  ) {
    super(`[${anchorId}] ${message}`);
    this.name = 'RampAdapterError';
    this.anchorId = anchorId;
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }
}
