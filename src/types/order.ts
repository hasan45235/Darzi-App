export type DesignType = "simple" | "design";

// Separate from DesignType: a garment can have custom design work but
// plain buttons, or a simple garment with fancy buttons - so this is
// tracked independently per item.
export type ButtonType = "simple" | "fancy";

// The lifecycle of an order: waiting to be started -> in progress ->
// completed, with cancelled reachable from either of the first two.
export type OrderStatus =
    | "waiting"
    | "in_progress"
    | "completed"
    | "cancelled";

export type Order = {
    id: number;
    receiptNumber: number;
    customerId: number;
    orderDate: string;
    deliveryDate: string;
    status: OrderStatus;
    tailoringDetails: string | null;
    notes: string | null;
    total: number;
    paid: number;
    remaining: number;
    discount: number;
    addition: number;
    createdAt: string;
    updatedAt: string;
};

export type OrderItem = {
    id: number;
    orderId: number;
    name: string;
    quantity: number;
    designType: DesignType;
    buttonType: ButtonType;
    unitPrice: number;
    notes: string | null;
};

export type CreateOrderInput = {
    receiptNumber: number;
    customerId: number;
    orderDate: string;
    deliveryDate: string;
    status: OrderStatus;
    tailoringDetails?: string | null;
    notes?: string | null;
    total: number;
    paid: number;
    remaining: number;
    discount: number;
    addition: number;
};

export type CreateOrderItemInput = {
    orderId: number;
    name: string;
    quantity: number;
    designType: DesignType;
    buttonType: ButtonType;
    unitPrice: number;
    notes?: string | null;
};

// Everything about an order that Edit Order is allowed to change.
// Receipt number, customer, and order date are permanent once created.
export type UpdateOrderInput = {
    deliveryDate: string;
    status: OrderStatus;
    tailoringDetails?: string | null;
    notes?: string | null;
    total: number;
    paid: number;
    remaining: number;
    discount: number;
    addition: number;
};

// One row per customer from a GROUP BY query - powers the order
// count / last-order-date shown on each customer list row.
export type CustomerOrderStats = {
    customerId: number;
    orderCount: number;
    lastOrderDate: string;
};