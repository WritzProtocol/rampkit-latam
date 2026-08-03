"use strict";
/**
 * @rampkit/core — Base Anchor Adapter
 *
 * Abstract interface that all anchor adapters must implement.
 * This ensures a consistent API across Etherfuse, Manteca, and Koywe.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RampAdapterError = exports.BaseAnchorAdapter = void 0;
/**
 * Abstract base class for anchor adapters.
 * Each anchor (Etherfuse, Manteca, Koywe) extends this class
 * and implements the methods using their specific APIs.
 */
class BaseAnchorAdapter {
    anchorId;
    config;
    baseUrl;
    constructor(anchorId, config, defaultBaseUrl) {
        this.anchorId = anchorId;
        this.config = config;
        this.baseUrl = config.baseUrl || defaultBaseUrl;
    }
    // ─── Protected Helpers ──────────────────────────────────────
    /**
     * Make an authenticated HTTP request to the anchor's API.
     */
    async apiRequest(method, path, body) {
        const url = `${this.baseUrl}${path}`;
        const headers = {
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
            throw new RampAdapterError(this.anchorId, `API request failed: ${response.status} ${response.statusText}`, response.status, errorBody);
        }
        return response.json();
    }
    /**
     * Get anchor-specific authentication headers.
     * Override in subclasses for different auth schemes.
     */
    getAuthHeaders() {
        return {
            Authorization: `Bearer ${this.config.apiKey}`,
        };
    }
    /**
     * Check if this adapter supports a given corridor.
     */
    supportsQuote(params) {
        const corridors = this.getSupportedCorridors();
        return corridors.some((c) => c.country === params.country &&
            c.directions.includes(params.direction) &&
            ((params.direction === 'on-ramp' &&
                c.fiatCurrency === params.sourceAsset &&
                c.cryptoAssets.includes(params.destAsset)) ||
                (params.direction === 'off-ramp' &&
                    c.cryptoAssets.includes(params.sourceAsset) &&
                    c.fiatCurrency === params.destAsset)));
    }
}
exports.BaseAnchorAdapter = BaseAnchorAdapter;
/**
 * Custom error class for anchor adapter failures.
 */
class RampAdapterError extends Error {
    anchorId;
    statusCode;
    responseBody;
    constructor(anchorId, message, statusCode, responseBody) {
        super(`[${anchorId}] ${message}`);
        this.name = 'RampAdapterError';
        this.anchorId = anchorId;
        this.statusCode = statusCode;
        this.responseBody = responseBody;
    }
}
exports.RampAdapterError = RampAdapterError;
//# sourceMappingURL=base.js.map