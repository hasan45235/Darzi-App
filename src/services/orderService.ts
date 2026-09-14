import {
    addOrderItem,
    createOrder,
    deleteOrder,
    getAllOrders,
    getOrderById,
    getOrderItems,
    getOrdersByCustomerId,
} from "@/database/repositories/orderRepository";

import {
    CreateOrderInput,
    CreateOrderItemInput,
    Order,
    OrderItem,
} from "@/types/order";

import {
    OrderFormInput,
    validateOrder,
} from "@/utils/validation/orderValidation";

import {
    getNextReceiptNumber,
} from "@/services/receiptNumberService";

export type NewOrderItem = {
    name: string;
    quantity: number;
    unitPrice: number;
    notes?: string;
};

export type CreateCompleteOrderInput = {
    customerId: number;
    orderDate: string;
    deliveryDate: string;
    tailoringDetails?: string;
    notes?: string;
    items: NewOrderItem[];
    paid: number;
};

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

function calculateTotal(
    items: NewOrderItem[]
): number {
    return items.reduce(
        (total, item) =>
            total + item.quantity * item.unitPrice,
        0
    );
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

    if (input.items.length === 0) {
        throw new Error(
            "Add at least one item to the order."
        );
    }

    for (const item of input.items) {
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

    if (input.paid < 0) {
        throw new Error(
            "Paid amount cannot be negative."
        );
    }

    const total = calculateTotal(input.items);

    if (input.paid > total) {
        throw new Error(
            "Paid amount cannot be greater than the total."
        );
    }

    const remaining = total - input.paid;

    const receiptNumber =
        await getNextReceiptNumber();

    const orderInput: CreateOrderInput = {
        receiptNumber,
        customerId: input.customerId,
        orderDate: input.orderDate,
        deliveryDate: input.deliveryDate,
        tailoringDetails:
            input.tailoringDetails?.trim() || null,
        notes: input.notes?.trim() || null,
        total,
        paid: input.paid,
        remaining,
    };

    const orderId =
        await createOrder(orderInput);

    try {
        for (const item of input.items) {
            const itemInput: CreateOrderItemInput = {
                orderId,
                name: item.name,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                notes: item.notes,
            };

            await addOrderItem(itemInput);
        }

        return orderId;
    } catch (error) {
        await deleteOrder(orderId);
        throw error;
    }
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