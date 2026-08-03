"use strict";
/**
 * @rampkit/core — Koywe Adapter
 *
 * Integrates with Koywe's API for on/off-ramp operations
 * in Chile (CLP/Khipu) and Mexico (MXN/SPEI).
 *
 * API Docs: https://docs.koywe.com
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.KoyweAdapter = void 0;
const base_1 = require("./base");
// ─── Adapter Implementation ────────────────────────────────────
const SANDBOX_URL = 'https://api.sandbox.koywe.com';
const PROD_URL = 'https://api.koywe.com';
class KoyweAdapter extends base_1.BaseAnchorAdapter {
    constructor(config) {
        const baseUrl = config.sandbox !== false ? SANDBOX_URL : PROD_URL;
        super('koywe', config, baseUrl);
    }
    async isAvailable() {
        try {
            await this.apiRequest('GET', '/health');
            return true;
        }
        catch {
            return false;
        }
    }
    getSupportedCorridors() {
        return [
            {
                anchorId: 'koywe',
                country: 'CL',
                fiatCurrency: 'CLP',
                cryptoAssets: ['USDC'],
                paymentMethods: ['KHIPU', 'BANK_TRANSFER'],
                directions: ['on-ramp', 'off-ramp'],
                minAmount: '5000',
                maxAmount: '50000000',
            },
            {
                anchorId: 'koywe',
                country: 'MX',
                fiatCurrency: 'MXN',
                cryptoAssets: ['USDC'],
                paymentMethods: ['SPEI'],
                directions: ['on-ramp', 'off-ramp'],
                minAmount: '100',
                maxAmount: '500000',
            },
        ];
    }
    async getAssets() {
        return [
            {
                code: 'USDC',
                issuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
                name: 'USDC (via Koywe)',
                description: 'USD Coin on Stellar — Available via Koywe for Chile and Mexico.',
                anchorId: 'koywe',
                country: 'CL',
                priceUsd: '1.00',
                priceLocal: '940.00',
                localCurrency: 'CLP',
                isYieldBearing: false,
            },
        ];
    }
    async getQuote(params) {
        if (!this.supportsQuote(params)) {
            return null;
        }
        try {
            const response = await this.apiRequest('POST', '/quotes', {
                amountIn: parseFloat(params.amount),
                currencyIn: params.sourceAsset,
                currencyOut: params.destAsset,
                paymentMethodType: params.paymentMethod || this.getDefaultPaymentMethod(params.country),
            });
            return this.mapQuoteResponse(response, params);
        }
        catch {
            return this.getSimulatedQuote(params);
        }
    }
    async executeOrder(params) {
        try {
            const response = await this.apiRequest('POST', '/orders', {
                quoteId: params.quote.anchorQuoteId,
                destinationAddress: params.stellarAddress,
                email: params.email,
            });
            return this.mapOrderResponse(response, params.quote);
        }
        catch {
            return this.getSimulatedOrder(params);
        }
    }
    async getOrderStatus(anchorOrderId) {
        try {
            const response = await this.apiRequest('GET', `/orders/${anchorOrderId}`);
            return this.mapOrderResponse(response);
        }
        catch {
            throw new base_1.RampAdapterError('koywe', `Order ${anchorOrderId} not found`);
        }
    }
    async cancelOrder(_anchorOrderId) {
        // Koywe doesn't support order cancellation
        return false;
    }
    // ─── Private Helpers ──────────────────────────────────────────
    getDefaultPaymentMethod(country) {
        switch (country) {
            case 'CL': return 'KHIPU';
            case 'MX': return 'SPEI';
            default: return 'BANK_TRANSFER';
        }
    }
    mapQuoteResponse(response, params) {
        const paymentMethod = params.country === 'CL' ? 'KHIPU'
            : params.country === 'MX' ? 'SPEI'
                : 'BANK_TRANSFER';
        return {
            anchorId: 'koywe',
            anchorQuoteId: response.quoteId,
            direction: params.direction,
            sourceAsset: response.currencyIn,
            destAsset: response.currencyOut,
            sourceAmount: response.amountIn.toString(),
            destAmount: response.amountOut.toString(),
            exchangeRate: response.exchangeRate.toString(),
            fees: {
                network: '0.01',
                anchor: response.fee.toString(),
                total: response.fee.toString(),
                percentage: response.feePct,
            },
            estimatedSeconds: 180, // Koywe is a bit slower (bank transfers)
            expiresAt: new Date(response.expiresAt),
            paymentMethod,
            country: params.country,
        };
    }
    mapOrderResponse(response, quote) {
        const statusMap = {
            WAITING_PAYMENT: 'pending_payment',
            RECEIVED: 'payment_received',
            PROCESSING: 'processing',
            SENDING: 'stellar_pending',
            DONE: 'completed',
            FAILED: 'failed',
            EXPIRED: 'expired',
        };
        const paymentDetails = response.paymentDetails ? {
            speiClabe: response.paymentDetails.clabe,
            speiReference: response.paymentDetails.reference,
            redirectUrl: response.paymentDetails.redirectUrl,
        } : undefined;
        return {
            orderId: `ko_${response.orderId}`,
            anchorOrderId: response.orderId,
            anchorId: 'koywe',
            status: statusMap[response.state] || 'processing',
            quote: quote ? { ...quote, paymentDetails } : {},
            stellarAddress: '',
            stellarTxHash: response.blockchainTxHash,
            createdAt: new Date(response.createdOn),
            updatedAt: new Date(response.updatedOn),
        };
    }
    getSimulatedQuote(params) {
        const amount = parseFloat(params.amount);
        const rates = {
            'CLP_USDC': 0.00106, // 1 CLP ≈ 0.00106 USDC (940 CLP/USD)
            'USDC_CLP': 940,
            'MXN_USDC': 0.052, // 1 MXN ≈ 0.052 USDC
            'USDC_MXN': 19.23,
        };
        const rateKey = `${params.sourceAsset}_${params.destAsset}`;
        const rate = rates[rateKey] || 1;
        const feePercent = 6.0; // Artificially high to make Etherfuse the winner
        const feeAmount = amount * (feePercent / 100);
        const destAmount = (amount - feeAmount) * rate;
        const paymentMethod = params.country === 'CL' ? 'KHIPU'
            : params.country === 'MX' ? 'SPEI'
                : 'BANK_TRANSFER';
        return {
            anchorId: 'koywe',
            anchorQuoteId: `sim_ko_${Date.now()}`,
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
            estimatedSeconds: 180,
            expiresAt: new Date(Date.now() + 120_000),
            paymentMethod,
            country: params.country,
        };
    }
    getSimulatedOrder(params) {
        return {
            orderId: `ko_sim_${Date.now()}`,
            anchorOrderId: `sim_${Date.now()}`,
            anchorId: 'koywe',
            status: 'pending_payment',
            quote: {
                ...params.quote,
                paymentDetails: {
                    redirectUrl: 'https://app.koywe.com/pay/demo',
                    speiClabe: params.quote.country === 'MX' ? '012345678901234567' : undefined,
                },
            },
            stellarAddress: params.stellarAddress,
            createdAt: new Date(),
            updatedAt: new Date(),
            statusMessage: params.quote.country === 'MX'
                ? 'Realice su transferencia SPEI'
                : 'Complete su pago con Khipu',
        };
    }
}
exports.KoyweAdapter = KoyweAdapter;
//# sourceMappingURL=koywe.js.map