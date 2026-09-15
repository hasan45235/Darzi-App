import { getDatabase } from "@/database/database.native";

import {
    createCustomer,
    customerNumberExists,
    deleteCustomer,
    getAllCustomers,
    getCustomerById,
    setCustomerActiveStatus,
    updateCustomer,
} from "@/database/repositories/customerRepository";

import {
    deleteCustomerImage,
    saveCustomerImage,
} from "@/services/customerImageService";

import {
    deleteAllOrdersForCustomer,
    getCustomerOrders,
} from "@/services/orderService";

import { BLOCKING_ORDER_STATUSES } from "@/constants/orderStatus";

import {
    CreateCustomerInput,
    Customer,
    UpdateCustomerInput,
} from "@/types/customer";

import {
    CustomerFormInput,
    validateCustomer,
} from "@/utils/validation/customerValidationTemp";

export async function addCustomer(
    input: CustomerFormInput,
    photoUri?: string | null
): Promise<number> {
    const validation = validateCustomer(input);

    if (!validation.valid) {
        throw new Error(
            Object.values(validation.errors)[0] ??
            "Invalid customer information."
        );
    }

    if (await customerNumberExists(input.customerNumber)) {
        throw new Error(
            `Customer number ${input.customerNumber} is already in use.`
        );
    }

    const customer: CreateCustomerInput = {
        customerNumber: input.customerNumber,
        name: input.name.trim(),
        phone: input.phone.trim(),
        address: input.address?.trim() || null,
        notes: input.notes?.trim() || null,
        photoUri: null,
    };

    const customerId = await createCustomer(customer);

    // Only the photo-attach step can leave something behind (a file on
    // disk, or a customer row with no photo) if it fails partway - so
    // only it gets a rollback. Track what was actually written so the
    // rollback cleans up exactly that, no more.
    let savedPhotoUri: string | null = null;

    try {
        if (photoUri) {
            savedPhotoUri = await saveCustomerImage(
                photoUri,
                customerId
            );

            await updateCustomer(customerId, {
                photoUri: savedPhotoUri,
            });
        }
    } catch (error) {
        if (savedPhotoUri) {
            deleteCustomerImage(savedPhotoUri);
        }

        await deleteCustomer(customerId);

        throw error;
    }

    return customerId;
}

export async function findCustomerById(
    id: number
): Promise<Customer | null> {
    return getCustomerById(id);
}

// Every customer regardless of active status - used where a customer
// still needs to be resolvable even after being deactivated, e.g.
// showing the right name on a historical order (Home/Orders lists).
export async function getCustomers(): Promise<Customer[]> {
    return getAllCustomers();
}

// The main customer directory - what the Customers tab and the
// "pick a customer" flow for New Order show. Deactivated customers are
// hidden here but still resolve fine via findCustomerById/getCustomers.
export async function getActiveCustomers(): Promise<Customer[]> {
    const customers = await getAllCustomers();

    return customers.filter((customer) => customer.isActive);
}

// Deactivated customers, for the permanent-delete picker in Settings.
export async function getInactiveCustomers(): Promise<Customer[]> {
    const customers = await getAllCustomers();

    return customers.filter((customer) => !customer.isActive);
}

export async function editCustomer(
    id: number,
    input: UpdateCustomerInput
): Promise<void> {
    const current = await getCustomerById(id);

    if (!current) {
        throw new Error("Customer not found.");
    }

    const mergedInput: CustomerFormInput = {
        customerNumber:
            input.customerNumber ?? current.customerNumber,
        name: input.name ?? current.name,
        phone: input.phone ?? current.phone,
        address:
            input.address ?? current.address ?? undefined,
        notes:
            input.notes ?? current.notes ?? undefined,
    };

    const validation = validateCustomer(mergedInput);

    if (!validation.valid) {
        throw new Error(
            Object.values(validation.errors)[0] ??
            "Invalid customer information."
        );
    }

    if (
        mergedInput.customerNumber !== current.customerNumber &&
        (await customerNumberExists(
            mergedInput.customerNumber,
            id
        ))
    ) {
        throw new Error(
            `Customer number ${mergedInput.customerNumber} is already in use.`
        );
    }

    const oldPhotoUri = current.photoUri;
    let photoUri = input.photoUri;
    let newPhotoSaved = false;

    if (
        photoUri !== undefined &&
        photoUri !== current.photoUri &&
        photoUri
    ) {
        photoUri = await saveCustomerImage(
            photoUri,
            id
        );
        newPhotoSaved = true;
    }

    try {
        await updateCustomer(id, {
            ...input,
            customerNumber: mergedInput.customerNumber,
            name: input.name?.trim(),
            phone: input.phone?.trim(),
            address:
                input.address !== undefined
                    ? input?.address?.trim() || null
                    : undefined,
            notes:
                input.notes !== undefined
                    ? input?.notes?.trim() || null
                    : undefined,
            photoUri:
                photoUri !== undefined
                    ? photoUri
                    : undefined,
        });
    } catch (error) {
        // The database still points at the old photo, so only clean up
        // the new file we just wrote to disk - not the one still in use.
        if (newPhotoSaved && photoUri) {
            deleteCustomerImage(photoUri);
        }

        throw error;
    }

    // Update committed - whether the photo was replaced or cleared, the
    // previous file on disk is no longer referenced by anything.
    if (
        photoUri !== undefined &&
        photoUri !== oldPhotoUri
    ) {
        deleteCustomerImage(oldPhotoUri);
    }
}

// The normal "Delete Customer" action. A customer with an order still
// Waiting or In Progress can't be removed at all - that work is still
// owed. Otherwise they're deactivated (soft-deleted): hidden from the
// main list, but their record and order history stay intact. Permanent
// removal only happens via permanentlyDeleteCustomer(), from Settings.
export async function removeCustomer(
    id: number
): Promise<void> {
    const current = await getCustomerById(id);

    if (!current) {
        throw new Error("Customer not found.");
    }

    const orders = await getCustomerOrders(id);

    const blockingOrders = orders.filter((order) =>
        BLOCKING_ORDER_STATUSES.includes(order.status)
    );

    if (blockingOrders.length > 0) {
        throw new Error(
            `${current.name} has ${blockingOrders.length} order` +
            `${blockingOrders.length === 1 ? "" : "s"} still Waiting or In Progress. ` +
            "Complete, cancel, or delete those orders first."
        );
    }

    await setCustomerActiveStatus(id, false);
}

// The Settings-only "permanent delete" step: actually erases the
// customer row and every one of their orders (and, via cascade, every
// item on those orders). Restricted to customers already deactivated
// through the normal delete flow, so this is always a deliberate second
// step rather than a way to skip the soft-delete safety net.
export async function permanentlyDeleteCustomer(
    id: number
): Promise<void> {
    const current = await getCustomerById(id);

    if (!current) {
        throw new Error("Customer not found.");
    }

    if (current.isActive) {
        throw new Error(
            "Only deactivated customers can be permanently deleted. " +
            "Delete this customer from the Customers tab first."
        );
    }

    const db = await getDatabase();

    // Orders have ON DELETE RESTRICT on customer_id, so they have to go
    // first - both deletions happen as one atomic unit so a failure
    // partway through can't leave orders gone but the customer still
    // there, or vice versa.
    await db.withExclusiveTransactionAsync(async (txn) => {
        await deleteAllOrdersForCustomer(id, txn);
        await deleteCustomer(id, txn);
    });

    deleteCustomerImage(current.photoUri);
}
