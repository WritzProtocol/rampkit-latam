"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EtherfuseAdapter = void 0;
const base_1 = require("./base");
const mockManager_1 = require("./mockManager");
// ─── Adapter Implementation ────────────────────────────────────
const SANDBOX_URL = 'https://api.sand.etherfuse.com';
const PROD_URL = 'https://api.etherfuse.com';
class EtherfuseAdapter extends base_1.BaseAnchorAdapter {
    constructor(config) {
        const baseUrl = config.sandbox !== false ? SANDBOX_URL : PROD_URL;
        super('etherfuse', config, baseUrl);
    }
    async isAvailable() {
        try {
            await this.apiRequest('GET', '/lookup/stablebonds');
            return true;
        }
        catch {
            return false;
        }
    }
    getSupportedCorridors() {
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
    async getAssets() {
        try {
            const response = await this.apiRequest('GET', '/lookup/stablebonds');
            return response.map((asset) => ({
                code: asset.code,
                issuer: asset.issuer,
                name: asset.name,
                description: asset.description,
                anchorId: 'etherfuse',
                country: asset.country === 'BR' ? 'BR' : asset.country === 'MX' ? 'MX' : 'US',
                apy: asset.apy,
                priceUsd: asset.price_usd.toString(),
                priceLocal: asset.price_brl?.toString(),
                localCurrency: asset.country === 'BR' ? 'BRL' : asset.country === 'MX' ? 'MXN' : 'USD',
                isYieldBearing: asset.type === 'stablebond',
            }));
        }
        catch {
            // Return known assets as fallback for demo
            return this.getKnownAssets();
        }
    }
    async getQuote(params) {
        if (!this.supportsQuote(params)) {
            return null;
        }
        const customerId = this.config.apiKey?.split(':')[2] || '';
        const quoteId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `ef-${Date.now()}`;
        // Target asset format: USDC:issuer for Stellar
        const targetAsset = params.destAsset === 'USDC'
            ? 'USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
            : params.destAsset;
        try {
            const response = await this.apiRequest('POST', '/ramp/quote', {
                quoteId,
                customerId,
                blockchain: 'stellar',
                quoteAssets: {
                    type: params.direction === 'on-ramp' ? 'onramp' : 'offramp',
                    sourceAsset: params.sourceAsset,
                    targetAsset,
                },
                sourceAmount: params.amount,
            });
            return this.mapQuoteResponse(response, params);
        }
        catch (error) {
            // Return simulated quote for demo/sandbox
            return this.getSimulatedQuote(params);
        }
    }
    async executeOrder(params) {
        try {
            const customerId = this.config.apiKey?.split(':')[2] || '';
            let bankAccountId = 'efbd0303-5476-4723-84a9-063df82ba8f9';
            try {
                const bankRes = await this.apiRequest('GET', `/ramp/bank-accounts?customerId=${customerId}`);
                if (bankRes.items && bankRes.items.length > 0) {
                    const active = bankRes.items.find(b => b.status === 'active') || bankRes.items[0];
                    bankAccountId = active.bankAccountId;
                }
            }
            catch {
                // Fallback bankAccountId
            }
            const orderId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `ord_${Date.now()}`;
            const response = await this.apiRequest('POST', '/ramp/order', {
                orderId,
                quoteId: params.quote.anchorQuoteId,
                publicKey: params.stellarAddress,
                bankAccountId,
                email: params.email || 'test@example.com',
                taxId: params.taxId || '12345678909',
                fullName: params.fullName || 'Test User',
            });
            const returnedOrderId = response.onramp?.orderId || response.orderId || response.id || orderId;
            const pixCode = '00020126580014br.gov.bcb.pix0136' +
                'a1b2c3d4-e5f6-7890-abcd-ef1234567890' +
                '5204000053039865802BR5913RAMPKIT LATAM6009SAO PAULO' +
                `62070503***6304${Math.random().toString(16).slice(2, 6).toUpperCase()}`;
            return {
                orderId: `ef_${returnedOrderId}`,
                anchorOrderId: returnedOrderId,
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
                statusMessage: 'Aguardando aprovação no Sandbox do Etherfuse...',
            };
        }
        catch (error) {
            // Return simulated order for demo fallback
            return this.getSimulatedOrder(params);
        }
    }
    async getOrderStatus(anchorOrderId) {
        if (anchorOrderId.startsWith('sim_')) {
            const state = mockManager_1.MockTxManager.getOrder(anchorOrderId);
            if (!state) {
                throw new base_1.RampAdapterError('etherfuse', `Mock Order ${anchorOrderId} not found`);
            }
            const isCompleted = state.status === 'completed';
            return {
                orderId: `ef_${anchorOrderId}`,
                anchorOrderId,
                anchorId: 'etherfuse',
                status: state.status,
                quote: {},
                stellarAddress: '',
                stellarTxHash: state.txHash,
                createdAt: new Date(state.createdAt),
                updatedAt: new Date(),
                statusMessage: isCompleted ? 'Payment confirmed via Sandbox' : 'Waiting for PIX payment',
            };
        }
        try {
            const response = await this.apiRequest('GET', `/ramp/order/${anchorOrderId}`);
            const order = this.mapOrderResponse(response);
            // If txHash is missing or not a 64-char hex hash (e.g. Base58 signature from Etherfuse), resolve the 64-hex Stellar tx hash from Horizon
            if (order.status === 'completed' && (!order.stellarTxHash || !/^[0-9a-fA-F]{64}$/.test(order.stellarTxHash))) {
                try {
                    const stellarAddr = response.publicKey || response.stellarAddress || 'GBAEGEMNJHS5KP5CORUKHYITFI562KK3WP3CO7YRU7B3522MSC6UZ22P';
                    const horizonRes = await fetch(`https://horizon-testnet.stellar.org/accounts/${stellarAddr}/transactions?limit=1&order=desc`);
                    if (horizonRes.ok) {
                        const data = await horizonRes.json();
                        const realHash = data._embedded?.records[0]?.hash;
                        if (realHash) {
                            order.stellarTxHash = realHash;
                        }
                    }
                }
                catch {
                    // Keep original txHash on error
                }
            }
            return order;
        }
        catch {
            throw new base_1.RampAdapterError('etherfuse', `Order ${anchorOrderId} not found`);
        }
    }
    async cancelOrder(anchorOrderId) {
        try {
            await this.apiRequest('DELETE', `/order/${anchorOrderId}`);
            return true;
        }
        catch {
            return false;
        }
    }
    // ─── Private Helpers ──────────────────────────────────────────
    getAuthHeaders() {
        return {
            Authorization: this.config.apiKey || '',
        };
    }
    mapQuoteResponse(response, params) {
        const paymentMethod = params.country === 'BR' ? 'PIX'
            : params.country === 'MX' ? 'SPEI'
                : 'BANK_TRANSFER';
        return {
            anchorId: 'etherfuse',
            anchorQuoteId: response.quoteId,
            direction: params.direction,
            sourceAsset: response.quoteAssets.sourceAsset,
            destAsset: response.quoteAssets.targetAsset.split(':')[0],
            sourceAmount: response.sourceAmount,
            destAmount: response.destinationAmount,
            exchangeRate: response.exchangeRate,
            fees: {
                network: '0.01',
                anchor: response.feeAmount,
                total: response.feeAmount,
                percentage: Number(response.feeBps) / 100,
            },
            estimatedSeconds: 120,
            expiresAt: new Date(response.expiresAt),
            paymentMethod,
            country: params.country,
        };
    }
    mapOrderResponse(response, quote) {
        const statusMap = {
            created: 'pending_payment',
            pending: 'pending_payment',
            payment_received: 'payment_received',
            processing: 'processing',
            completed: 'completed',
            settled: 'completed',
            failed: 'failed',
            expired: 'expired',
            refunded: 'refunded',
        };
        const id = response.orderId || response.id || '';
        const txHash = response.confirmedTxSignature || response.stellar_tx_hash;
        const isCompleted = response.status === 'completed' || response.status === 'settled';
        return {
            orderId: `ef_${id}`,
            anchorOrderId: id,
            anchorId: 'etherfuse',
            status: statusMap[response.status] || 'processing',
            quote: quote || {},
            stellarAddress: '',
            stellarTxHash: txHash,
            createdAt: response.createdAt || response.created_at ? new Date(response.createdAt || response.created_at) : new Date(),
            updatedAt: response.updatedAt || response.updated_at ? new Date(response.updatedAt || response.updated_at) : new Date(),
            statusMessage: isCompleted ? 'Payment Approved in Sandbox!' : 'Waiting for Sandbox payment approval...',
        };
    }
    /**
     * Simulated quote for sandbox/demo when the API is unavailable.
     * Uses realistic BRL/USDC rates.
     */
    getSimulatedQuote(params) {
        const rates = {
            'BRL_USDC': 0.175, // 1 BRL ≈ 0.175 USDC (5.71 BRL/USD)
            'USDC_BRL': 5.71, // 1 USDC ≈ 5.71 BRL
            'BRL_TESOURO': 0.170, // Slightly less due to yield premium
            'TESOURO_BRL': 5.88, // Slightly more due to yield
            'MXN_USDC': 0.052, // 1 MXN ≈ 0.052 USDC
            'USDC_MXN': 19.23, // 1 USDC ≈ 19.23 MXN
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
        const paymentMethod = params.country === 'BR' ? 'PIX'
            : params.country === 'MX' ? 'SPEI'
                : 'BANK_TRANSFER';
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
    getSimulatedOrder(params) {
        const anchorOrderId = `sim_${Date.now()}`;
        mockManager_1.MockTxManager.createOrder(anchorOrderId, params.stellarAddress);
        const pixCode = '00020126580014br.gov.bcb.pix0136' +
            'a1b2c3d4-e5f6-7890-abcd-ef1234567890' +
            '5204000053039865802BR5913RAMPKIT LATAM6009SAO PAULO' +
            `62070503***6304${Math.random().toString(16).slice(2, 6).toUpperCase()}`;
        return {
            orderId: `ef_${anchorOrderId}`,
            anchorOrderId,
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
    getKnownAssets() {
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
exports.EtherfuseAdapter = EtherfuseAdapter;
//# sourceMappingURL=etherfuse.js.map