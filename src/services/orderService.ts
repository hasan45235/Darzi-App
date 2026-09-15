import { getDatabase } from "@/database/database.native";

import type { SQLiteDatabase } from "expo-sqlite";

import {
    addOrderItem,
    createOrder,
    deleteOrder,
    deleteOrderItemsForOrder,
    deleteOrdersByCustomerId,
    getAllOrders,
    getCustomerOrderStats as fetchCustomerOrderStats,
    getOrderById,
    getOrderItems,
    getOrdersByCustomerId,
    updateOrder,
    updateOrderStatus,
} from "@/database/repositories/orderRepository";

import {
    ButtonType,
    CreateOrderInput,
    CreateOrderItemInput,
    CustomerOrderStats,
    DesignType,
    Order,
    OrderItem,
    OrderStatus,
    UpdateOrderInput,
} from "@/types/order";

import {
    OrderFormInput,
    validateOrder,
} from "@/utils/validation/orderValidation";

import {
    getNextReceiptNumber,
} from "@/services/receiptNumberService";

import { DEFAULT_ORDER_STATUS } from "@/constants/orderStatus";

export type NewOrderItem = {
    name: string;
    quantity: number;
    unitPrice: number;
    notes?: string;
    designType?: DesignType;
    buttonType?: ButtonType;
};

export type CreateCompleteOrderInput = {
    customerId: number;
    orderDate: string;
    deliveryDate: string;
    tailoringDetails?: string;
    notes?: string;
    items: NewOrderItem[];
    paid: number;
    discount?: number;
    addition?: number;
};

// Edit Order re-sends the whole order every save (no per-item diffing
// UI), so this mirrors CreateCompleteOrderInput minus the fields that
// can never change after creation (customer, order date, receipt #).
export type UpdateCompleteOrderInput = {
    deliveryDate: string;
    status: OrderStatus;
    tailoringDetails?: string;
    notes?: string;
    items: NewOrderItem[];
    paid: number;
    discount?: number;
    addition?: number;
};

// Items don't have a design-type picker everywhere yet, so anything
// left unset defaults to "simple".
const DEFAULT_ITEM_DESIGN_TYPE: DesignType = "simple";
const DEFAULT_ITEM_BUTTON_TYPE: ButtonType = "simple";

export async function getNextOrderReceiptNumber(): Promise<number> {
    return getNextReceiptNumber();
}

export async function validateNewOrder(
    input: OrderFormInput
): Promise<void> {
    const validation = validateOrder(input);

    if (!validation.valid) {
        throw new Error(
            Object.values(validation.errors)[0] ??
            "Invalid order information."
        );
    }
}

function calculateSubtotal(
    items: NewOrderItem[]
): number {
    return items.reduce(
        (sum, item) =>
            sum + item.quantity * item.unitPrice,
        0
    );
}

function validateItems(items: NewOrderItem[]): void {
    if (items.length === 0) {
        throw new Error(
            "Add at least one item to the order."
        );
    }

    for (const item of items) {
        if (!item.name.trim()) {
            throw new Error(
                "Every item must have a name."
            );
        }

        if (item.quantity <= 0) {
            throw new Error(
                "Item quantity must be greater than zero."
            );
        }

        if (item.unitPrice < 0) {
            throw new Error(
                "Item price cannot be negative."
            );
        }
    }
}

// Shared math for create + edit: subtotal comes from the items, discount
// and addition adjust it into the final total, and remaining is
// whatever's left after what's been paid.
function resolveOrderTotals(
    items: NewOrderItem[],
    paid: number,
    discount: number,
    addition: number
): { total: number; remaining: number } {
    validateItems(items);

    if (paid < 0) {
        throw new Error("Paid amount cannot be negative.");
    }

    if (discount < 0 || addition < 0) {
        throw new Error(
            "Discount and addition cannot be negative."
        );
    }

    const subtotal = calculateSubtotal(items);
    const total = Math.max(subtotal - discount + addition, 0);

    if (paid > total) {
        throw new Error(
            "Paid amount cannot be greater than the total."
        );
    }

    return {
        total,
        remaining: total - paid,
    };
}

export async function createCompleteOrder(
    input: CreateCompleteOrderInput
): Promise<number> {
    if (!input.customerId) {
        throw new Error("Customer is required.");
    }

    if (!input.deliveryDate.trim()) {
        throw new Error("Delivery date is required.");
    }

    const discount = input.discount ?? 0;
    const addition = input.addition ?? 0;

    const { total, remaining } = resolveOrderTotals(
        input.items,
        input.paid,
        discount,
        addition
    );

    const receiptNumber =
        await getNextReceiptNumber();

    const orderInput: CreateOrderInput = {
        receiptNumber,
        customerId: input.customerId,
        orderDate: input.orderDate,
        deliveryDate: input.deliveryDate,
        status: DEFAULT_ORDER_STATUS,
        tailoringDetails:
            input.tailoringDetails?.trim() || null,
        notes: input.notes?.trim() || null,
        total,
        paid: input.paid,
        remaining,
        discount,
        addition,
    };

    const db = await getDatabase();

    let orderId = 0;

    // The order row and every one of its items go in as one atomic unit:
    // if any item fails to insert, the transaction rolls back the order
    // too, so a bad order never ends up half-created (no items, or only
    // some) sitting in the list.
    await db.withExclusiveTransactionAsync(async (txn) => {
        orderId = await createOrder(orderInput, txn);

        for (const item of input.items) {
            const itemInput: CreateOrderItemInput = {
                orderId,
                name: item.name,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                notes: item.notes,
                designType:
                    item.designType ??
                    DEFAULT_ITEM_DESIGN_TYPE,
                buttonType:
                    item.buttonType ??
                    DEFAULT_ITEM_BUTTON_TYPE,
            };

            await addOrderItem(itemInput, txn);
        }
    });

    return orderId;
}

export async function updateCompleteOrder(
    orderId: number,
    input: UpdateCompleteOrderInput
): Promise<void> {
    const existing = await getOrderById(orderId);

    if (!existing) {
        throw new Error("Order not found.");
    }

    if (!input.deliveryDate.trim()) {
        throw new Error("Delivery date is required.");
    }

    const discount = input.discount ?? 0;
    const addition = input.addition ?? 0;

    const { total, remaining } = resolveOrderTotals(
        input.items,
        input.paid,
        discount,
        addition
    );

    const orderUpdate: UpdateOrderInput = {
        deliveryDate: input.deliveryDate,
        status: input.status,
        tailoringDetails:
            input.tailoringDetails?.trim() || null,
        notes: input.notes?.trim() || null,
        total,
        paid: input.paid,
        remaining,
        discount,
        addition,
    };

    const db = await getDatabase();

    // Same reasoning as createCompleteOrder: the order update and the
    // full item replacement (no per-item diffing UI exists, so the old
    // items are cleared and the new set re-inserted) happen as one
    // atomic unit, so a failure partway through can't leave the order
    // updated with only some - or none - of its items.
    await db.withExclusiveTransactionAsync(async (txn) => {
        await updateOrder(orderId, orderUpdate, txn);
        await deleteOrderItemsForOrder(orderId, txn);

        for (const item of input.items) {
            await addOrderItem(
                {
                    orderId,
                    name: item.name,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    notes: item.notes,
                    designType:
                        item.designType ??
                        DEFAULT_ITEM_DESIGN_TYPE,
                    buttonType:
                        item.buttonType ??
                        DEFAULT_ITEM_BUTTON_TYPE,
                },
                txn
            );
        }
    });
}

export async function findOrderById(
    id: number
): Promise<Order | null> {
    return getOrderById(id);
}

export async function getOrders(): Promise<Order[]> {
    return getAllOrders();
}

export async function getCustomerOrders(
    customerId: number
): Promise<Order[]> {
    return getOrdersByCustomerId(customerId);
}

export async function getCustomerOrderStats(): Promise<CustomerOrderStats[]> {
    return fetchCustomerOrderStats();
}

export async function getItemsForOrder(
    orderId: number
): Promise<OrderItem[]> {
    return getOrderItems(orderId);
}

export async function addItemToOrder(
    input: CreateOrderItemInput
): Promise<number> {
    if (!input.name.trim()) {
        throw new Error("Item name is required.");
    }

    if (input.quantity <= 0) {
        throw new Error(
            "Item quantity must be greater than zero."
        );
    }

    if (input.unitPrice < 0) {
        throw new Error(
            "Item price cannot be negative."
        );
    }

    return addOrderItem(input);
}

export async function removeOrder(
    id: number
): Promise<void> {
    const order = await getOrderById(id);

    if (!order) {
        throw new Error("Order not found.");
    }

    await deleteOrder(id);
}

// Quick status-only change (Order Details' status picker) - doesn't
// touch items, payment, or any other field the way a full Edit Order
// save does.
export async function changeOrderStatus(
    id: number,
    status: OrderStatus
): Promise<void> {
    const order = await getOrderById(id);

    if (!order) {
        throw new Error("Order not found.");
    }

    await updateOrderStatus(id, status);
}

// Used only by permanentlyDeleteCustomer() in customerService - removing
// a customer for good means removing every order (and, via cascade,
// every item) that still points at them first, since the foreign key
// restricts deleting a customer while any of their orders exist.
export async function deleteAllOrdersForCustomer(
    customerId: number,
    executor?: SQLiteDatabase
): Promise<void> {
    return deleteOrdersByCustomerId(customerId, executor);
}
