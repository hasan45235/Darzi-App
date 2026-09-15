import type { SQLiteDatabase } from "expo-sqlite";

import { getDatabase } from "@/database/database.native";

import {
    CreateCustomerInput,
    Customer,
    UpdateCustomerInput,
} from "@/types/customer";

// SQLite has no boolean type - is_active comes back as 0/1, so every
// row read here needs mapping into the Customer type's real boolean.
type CustomerRow = Omit<Customer, "isActive"> & {
    isActive: number;
};

function mapCustomerRow(row: CustomerRow): Customer {
    return {
        ...row,
        isActive: row.isActive === 1,
    };
}

export async function createCustomer(
    input: CreateCustomerInput
): Promise<number> {
    const db = await getDatabase();

    const now = new Date().toISOString();

    const result = await db.runAsync(
        `
        INSERT INTO customers (
            name,
            phone,
            customer_number,
            photo_uri,
            address,
            notes,
            created_at,
            updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        input.name.trim(),
        input.phone.trim(),
        input.customerNumber,
        input.photoUri ?? null,
        input.address?.trim() || null,
        input.notes?.trim() || null,
        now,
        now
    );

    return result.lastInsertRowId;
}

export async function getCustomerById(
    id: number
): Promise<Customer | null> {
    const db = await getDatabase();

    const row = await db.getFirstAsync<CustomerRow>(
        `
        SELECT
            id,
            customer_number AS customerNumber,
            name,
            phone,
            photo_uri AS photoUri,
            address,
            notes,
            is_active AS isActive,
            created_at AS createdAt,
            updated_at AS updatedAt
        FROM customers
        WHERE id = ?
        `,
        id
    );

    return row ? mapCustomerRow(row) : null;
}

export async function getAllCustomers(): Promise<Customer[]> {
    const db = await getDatabase();

    const rows = await db.getAllAsync<CustomerRow>(
        `
        SELECT
            id,
            customer_number AS customerNumber,
            name,
            phone,
            photo_uri AS photoUri,
            address,
            notes,
            is_active AS isActive,
            created_at AS createdAt,
            updated_at AS updatedAt
        FROM customers
        ORDER BY name COLLATE NOCASE ASC
        `
    );

    return rows.map(mapCustomerRow);
}

// Whether a customer number is already taken - used to give a friendly
// validation error instead of letting the UNIQUE index throw a raw
// SQLite constraint error. Pass excludeId when checking during an edit
// so a customer doesn't collide with their own current number.
export async function customerNumberExists(
    customerNumber: number,
    excludeId?: number
): Promise<boolean> {
    const db = await getDatabase();

    const match = await db.getFirstAsync<{ id: number }>(
        `
        SELECT id
        FROM customers
        WHERE customer_number = ? AND id != ?
        LIMIT 1
        `,
        customerNumber,
        excludeId ?? -1
    );

    return match !== null;
}

export async function updateCustomer(
    id: number,
    input: UpdateCustomerInput
): Promise<void> {
    const db = await getDatabase();

    const current =
        await getCustomerById(id);

    if (!current) {
        throw new Error(
            "Customer not found."
        );
    }

    await db.runAsync(
        `
        UPDATE customers
        SET
            name = ?,
            phone = ?,
            customer_number = ?,
            photo_uri = ?,
            address = ?,
            notes = ?,
            updated_at = ?
        WHERE id = ?
        `,
        input.name !== undefined
            ? input.name.trim()
            : current.name,

        input.phone !== undefined
            ? input.phone.trim()
            : current.phone,

        input.customerNumber !== undefined
            ? input.customerNumber
            : current.customerNumber,

        input.photoUri !== undefined
            ? input.photoUri
            : current.photoUri,

        input.address !== undefined
            ? input.address?.trim() || null
            : current.address,

        input.notes !== undefined
            ? input.notes?.trim() || null
            : current.notes,

        new Date().toISOString(),
        id
    );
}

// Soft delete / reactivate. The normal "Delete Customer" flow only ever
// deactivates (isActive: false) - a full row DELETE only happens via
// permanentlyDeleteCustomer() in customerService, from Settings.
export async function setCustomerActiveStatus(
    id: number,
    isActive: boolean,
    executor?: SQLiteDatabase
): Promise<void> {
    const db = executor ?? await getDatabase();

    await db.runAsync(
        `
        UPDATE customers
        SET is_active = ?, updated_at = ?
        WHERE id = ?
        `,
        isActive ? 1 : 0,
        new Date().toISOString(),
        id
    );
}

export async function deleteCustomer(
    id: number,
    executor?: SQLiteDatabase
): Promise<void> {
    const db = executor ?? await getDatabase();

    await db.runAsync(
        `
        DELETE FROM customers
        WHERE id = ?
        `,
        id
    );
}
