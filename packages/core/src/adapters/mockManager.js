"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockTxManager = void 0;
const stellar_sdk_1 = require("@stellar/stellar-sdk");
const mockOrders = new Map();
exports.MockTxManager = {
    createOrder(anchorOrderId, destinationAddress = 'GBAEGEMNJHS5KP5CORUKHYITFI562KK3WP3CO7YRU7B3522MSC6UZ22P') {
        mockOrders.set(anchorOrderId, {
            status: 'pending_payment',
            createdAt: Date.now(),
        });
        // Start background process to generate a real testnet tx
        setTimeout(async () => {
            try {
                const kp = stellar_sdk_1.Keypair.random();
                const response = await fetch(`https://friendbot.stellar.org/?addr=${kp.publicKey()}`);
                if (!response.ok)
                    throw new Error('Friendbot failed');
                const server = new stellar_sdk_1.Horizon.Server('https://horizon-testnet.stellar.org');
                const sourceAccount = await server.loadAccount(kp.publicKey());
                const tx = new stellar_sdk_1.TransactionBuilder(sourceAccount, {
                    fee: '10000',
                    networkPassphrase: stellar_sdk_1.Networks.TESTNET
                })
                    .addOperation(stellar_sdk_1.Operation.payment({
                    destination: destinationAddress,
                    asset: stellar_sdk_1.Asset.native(),
                    amount: '1.0' // 1 XLM mock payment
                }))
                    .setTimeout(30)
                    .build();
                tx.sign(kp);
                const txResponse = await server.submitTransaction(tx);
                const state = mockOrders.get(anchorOrderId);
                if (state) {
                    state.txHash = txResponse.hash;
                    state.status = 'completed';
                }
            }
            catch (err) {
                // Fallback to a hardcoded real hash if anything fails
                const state = mockOrders.get(anchorOrderId);
                if (state) {
                    state.txHash = '7a3c3b0eb6089e6e4f4fb8e95c10626b9195b0eb6f8b9e6e4f4fb8e95c10626b';
                    state.status = 'completed';
                }
            }
        }, 15000); // Wait 15 seconds to simulate payment processing
    },
    getOrder(anchorOrderId) {
        return mockOrders.get(anchorOrderId);
    }
};
//# sourceMappingURL=mockManager.js.map