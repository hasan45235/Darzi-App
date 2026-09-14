export type Order = {
    id: number;
    receiptNumber: number;
    customerId: number;
    orderDate: string;
    deliveryDate: string;
    tailoringDetails: string | null;
    notes: string | null;
    total: number;
    paid: number;
    remaining: number;
    createdAt: string;
    updatedAt: string;
};

export type OrderItem = {
    id: number;
    orderId: number;
    name: string;
    quantity: number;
    unitPrice: number;
    notes: string | null;
    designType: OrderItemDesignType;
};

export type CreateOrderInput = {
    receiptNumber: number;
    customerId: number;
    orderDate: string;
    deliveryDate: string;
    tailoringDetails?: string | null;
    notes?: string | null;
    total: number;
    paid: number;
    remaining: number;
};

export type CreateOrderItemInput = {
    orderId: number;
    name: string;
    quantity: number;
    unitPrice: number;
    notes?: string | null;
    designType: OrderItemDesignType;
};

export type OrderItemDesignType =
    | "simple"
    | "design";


