import type { OrderStatus } from '../types';
export interface MockOrderState {
    status: OrderStatus;
    txHash?: string;
    createdAt: number;
}
export declare const MockTxManager: {
    createOrder(anchorOrderId: string, destinationAddress?: string): void;
    getOrder(anchorOrderId: string): MockOrderState | undefined;
};
//# sourceMappingURL=mockManager.d.ts.map