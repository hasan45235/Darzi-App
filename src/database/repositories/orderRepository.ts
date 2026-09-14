import { getDatabase } from "@/database/database.native";

import {
    CreateOrderInput,
    CreateOrderItemInput,
    Order,
    OrderItem,
} from "@/types/order";

export async function createOrder(
    input: CreateOrderInput
): Promise<number> {
    const db = await getDatabase();

    const now = new Date().toISOString();

    const result = await db.runAsync(
        `
    INSERT INTO orders (
      receipt_number,
      customer_id,
      order_date,
      delivery_date,
      design_type,
      tailoring_details,
      notes,
      total,
      paid,
      remaining,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
        input.receiptNumber,
        input.customerId,
        input.orderDate,
        input.deliveryDate,
        input.tailoringDetails ?? null,
        input.notes ?? null,
        input.total,
        input.paid,
        input.remaining,
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
      design_type AS designType,
      delivery_date AS deliveryDate,
      tailoring_details AS tailoringDetails,
      notes,
      total,
      paid,
      remaining,
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
      design_type AS designType,
      tailoring_details AS tailoringDetails,
      notes,
      total,
      paid,
      remaining,
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
      design_type AS designType,
      order_date AS orderDate,
      delivery_date AS deliveryDate,
      tailoring_details AS tailoringDetails,
      notes,
      total,
      paid,
      remaining,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM orders
    ORDER BY created_at DESC
    `
    );
}

export async function addOrderItem(
    input: CreateOrderItemInput
): Promise<number> {
    const db = await getDatabase();

    const result = await db.runAsync(
        `
    INSERT INTO order_items (
      order_id,
      name,
      quantity,
      design_type,
      unit_price,
      notes
    )
    VALUES (?, ?, ?, ?, ?)
    `,
        input.orderId,
        input.name.trim(),
        input.quantity,
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
      unit_price AS unitPrice,
      notes
      design_type AS designType,
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