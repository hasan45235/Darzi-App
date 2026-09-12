import { getDatabase } from "@/database/database.native";
import {
    CreateCustomerInput,
    Customer,
    UpdateCustomerInput,
} from "@/types/customer";

export async function createCustomer(
    input: CreateCustomerInput
): Promise<number> {
    const db = await getDatabase();

    const result = await db.runAsync(
        `
    INSERT INTO customers (
      name,
      phone,
      photo_uri,
      address,
      notes,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
        input.name.trim(),
        input.phone.trim(),
        input.photoUri ?? null,
        input.address?.trim() || null,
        input.notes?.trim() || null,
        new Date().toISOString(),
        new Date().toISOString()
    );

    return result.lastInsertRowId;
}

export async function getCustomerById(
    id: number
): Promise<Customer | null> {
    const db = await getDatabase();

    return db.getFirstAsync<Customer>(
        `
    SELECT
      id,
      name,
      phone,
      photo_uri AS photoUri,
      address,
      notes,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM customers
    WHERE id = ?
    `,
        id
    );
}

export async function getAllCustomers(): Promise<Customer[]> {
    const db = await getDatabase();

    return db.getAllAsync<Customer>(
        `
    SELECT
      id,
      name,
      phone,
      photo_uri AS photoUri,
      address,
      notes,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM customers
    ORDER BY name COLLATE NOCASE ASC
    `
    );
}

export async function updateCustomer(
    id: number,
    input: UpdateCustomerInput
): Promise<void> {
    const db = await getDatabase();

    const current = await getCustomerById(id);

    if (!current) {
        throw new Error("Customer not found.");
    }

    await db.runAsync(
        `
    UPDATE customers
    SET
      name = ?,
      phone = ?,
      photo_uri = ?,
      address = ?,
      notes = ?,
      updated_at = ?
    WHERE id = ?
    `,
        input.name !== undefined ? input.name.trim() : current.name,
        input.phone !== undefined ? input.phone.trim() : current.phone,
        input.photoUri !== undefined ? input.photoUri : current.photoUri,
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

export async function deleteCustomer(id: number): Promise<void> {
    const db = await getDatabase();

    await db.runAsync(
        `
    DELETE FROM customers
    WHERE id = ?
    `,
        id
    );
}