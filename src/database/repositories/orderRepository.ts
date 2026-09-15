import type { SQLiteDatabase } from "expo-sqlite";

import { getDatabase } from "@/database/database.native";

import {
    CreateOrderInput,
    CreateOrderItemInput,
    CustomerOrderStats,
    Order,
    OrderItem,
    OrderStatus,
    UpdateOrderInput,
} from "@/types/order";

// Every write function below takes an optional `executor` - the plain
// database connection for a one-off call, or a `txn` handle from
// `withExclusiveTransactionAsync` when it needs to be part of a bigger
// atomic operation (see createCompleteOrder / updateCompleteOrder in
// orderService.ts, which insert an order plus all of its items as one
// unit: either the whole thing lands, or none of it does).
export async function createOrder(
    input: CreateOrderInput,
    executor?: SQLiteDatabase
): Promise<number> {
    const db = executor ?? await getDatabase();

    const now = new Date().toISOString();

    const result = await db.runAsync(
        `
        INSERT INTO orders (
            receipt_number,
            customer_id,
            order_date,
            delivery_date,
            design_type,
            status,
            tailoring_details,
            notes,
            total,
            paid,
            remaining,
            discount,
            addition,
            created_at,
            updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        input.receiptNumber,
        input.customerId,
        input.orderDate,
        input.deliveryDate,
        "simple",
        input.status,
        input.tailoringDetails ?? null,
        input.notes ?? null,
        input.total,
        input.paid,
        input.remaining,
        input.discount,
        input.addition,
        now,
        now
    );

    return result.lastInsertRowId;
}

export async function getOrderById(
    id: number
): Promise<Order | null> {
    const db = await getDatabase();

    return db.getFirstAsync<Order>(
        `
        SELECT
            id,
            receipt_number AS receiptNumber,
            customer_id AS customerId,
            order_date AS orderDate,
            delivery_date AS deliveryDate,
            status,
            tailoring_details AS tailoringDetails,
            notes,
            total,
            paid,
            remaining,
            discount,
            addition,
            created_at AS createdAt,
            updated_at AS updatedAt
        FROM orders
        WHERE id = ?
        `,
        id
    );
}

export async function getOrdersByCustomerId(
    customerId: number
): Promise<Order[]> {
    const db = await getDatabase();

    return db.getAllAsync<Order>(
        `
        SELECT
            id,
            receipt_number AS receiptNumber,
            customer_id AS customerId,
            order_date AS orderDate,
            delivery_date AS deliveryDate,
            status,
            tailoring_details AS tailoringDetails,
            notes,
            total,
            paid,
            remaining,
            discount,
            addition,
            created_at AS createdAt,
            updated_at AS updatedAt
        FROM orders
        WHERE customer_id = ?
        ORDER BY created_at DESC
        `,
        customerId
    );
}

export async function getAllOrders(): Promise<Order[]> {
    const db = await getDatabase();

    return db.getAllAsync<Order>(
        `
        SELECT
            id,
            receipt_number AS receiptNumber,
            customer_id AS customerId,
            order_date AS orderDate,
            delivery_date AS deliveryDate,
            status,
            tailoring_details AS tailoringDetails,
            notes,
            total,
            paid,
            remaining,
            discount,
            addition,
            created_at AS createdAt,
            updated_at AS updatedAt
        FROM orders
        ORDER BY created_at DESC
        `
    );
}

export async function updateOrder(
    id: number,
    input: UpdateOrderInput,
    executor?: SQLiteDatabase
): Promise<void> {
    const db = executor ?? await getDatabase();

    await db.runAsync(
        `
        UPDATE orders
        SET
            delivery_date = ?,
            status = ?,
            tailoring_details = ?,
            notes = ?,
            total = ?,
            paid = ?,
            remaining = ?,
            discount = ?,
            addition = ?,
            updated_at = ?
        WHERE id = ?
        `,
        input.deliveryDate,
        input.status,
        input.tailoringDetails ?? null,
        input.notes ?? null,
        input.total,
        input.paid,
        input.remaining,
        input.discount,
        input.addition,
        new Date().toISOString(),
        id
    );
}

// Lightweight status-only update for the quick-change control on Order
// Details, so bumping a status doesn't require re-sending every other
// field the way a full Edit Order save does.
export async function updateOrderStatus(
    id: number,
    status: OrderStatus,
    executor?: SQLiteDatabase
): Promise<void> {
    const db = executor ?? await getDatabase();

    await db.runAsync(
        `
        UPDATE orders
        SET status = ?, updated_at = ?
        WHERE id = ?
        `,
        status,
        new Date().toISOString(),
        id
    );
}

// Used only by permanentlyDeleteCustomer() in customerService: orders
// have ON DELETE RESTRICT on customer_id, so a customer row can't be
// removed while any of their orders still exist. order_items cascades
// automatically once its parent order is gone.
export async function deleteOrdersByCustomerId(
    customerId: number,
    executor?: SQLiteDatabase
): Promise<void> {
    const db = executor ?? await getDatabase();

    await db.runAsync(
        `
        DELETE FROM orders
        WHERE customer_id = ?
        `,
        customerId
    );
}

// One row per customer that has at least one order. Used to enrich the
// customer list (order count + last order date) without an N+1 query
// per row.
export async function getCustomerOrderStats(): Promise<CustomerOrderStats[]> {
    const db = await getDatabase();

    return db.getAllAsync<CustomerOrderStats>(
        `
        SELECT
            customer_id AS customerId,
            COUNT(*) AS orderCount,
            MAX(order_date) AS lastOrderDate
        FROM orders
        GROUP BY customer_id
        `
    );
}

export async function addOrderItem(
    input: CreateOrderItemInput,
    executor?: SQLiteDatabase
): Promise<number> {
    const db = executor ?? await getDatabase();

    const result = await db.runAsync(
        `
        INSERT INTO order_items (
            order_id,
            name,
            quantity,
            design_type,
            button_type,
            unit_price,
            notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        input.orderId,
        input.name.trim(),
        input.quantity,
        input.designType,
        input.buttonType,
        input.unitPrice,
        input.notes?.trim() || null
    );

    return result.lastInsertRowId;
}

export async function getOrderItems(
    orderId: number
): Promise<OrderItem[]> {
    const db = await getDatabase();

    return db.getAllAsync<OrderItem>(
        `
        SELECT
            id,
            order_id AS orderId,
            name,
            quantity,
            design_type AS designType,
            button_type AS buttonType,
            unit_price AS unitPrice,
            notes
        FROM order_items
        WHERE order_id = ?
        ORDER BY id ASC
        `,
        orderId
    );
}

export async function deleteOrder(
    id: number
): Promise<void> {
    const db = await getDatabase();

    await db.runAsync(
        `
        DELETE FROM orders
        WHERE id = ?
        `,
        id
    );
}

// Edit Order has no per-item add/remove/edit diffing UI - it re-sends
// the full item list on every save, so the simplest correct update is
// to clear out the old items first and re-insert the new set.
export async function deleteOrderItemsForOrder(
    orderId: number,
    executor?: SQLiteDatabase
): Promise<void> {
    const db = executor ?? await getDatabase();

    await db.runAsync(
        `
        DELETE FROM order_items
        WHERE order_id = ?
        `,
        orderId
    );
}