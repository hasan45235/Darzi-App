import {
    createCustomer,
    deleteCustomer,
    getAllCustomers,
    getCustomerById,
    updateCustomer,
} from "@/database/repositories/customerRepository";

import {
    deleteCustomerImage,
    saveCustomerImage,
} from "@/services/customerImageService";

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

    const customer: CreateCustomerInput = {
        name: input.name.trim(),
        phone: input.phone.trim(),
        address: input.address?.trim() || null,
        notes: input.notes?.trim() || null,
        photoUri: null,
    };

    const customerId = await createCustomer(customer);

    if (photoUri) {
        const savedPhotoUri = await saveCustomerImage(
            photoUri,
            customerId
        );

        await updateCustomer(customerId, {
            photoUri: savedPhotoUri,
        });
    }

    return customerId;
}


export async function findCustomerById(
    id: number
): Promise<Customer | null> {
    return getCustomerById(id);
}

export async function getCustomers(): Promise<Customer[]> {
    return getAllCustomers();
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

    let photoUri = input.photoUri;

    if (
        photoUri &&
        photoUri !== current.photoUri
    ) {
        photoUri = await saveCustomerImage(
            photoUri,
            id
        );

        await deleteCustomerImage(
            current.photoUri
        );
    }

    await updateCustomer(id, {
        ...input,
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
}


export async function removeCustomer(
    id: number
): Promise<void> {
    const current = await getCustomerById(id);

    if (!current) {
        throw new Error("Customer not found.");
    }

    await deleteCustomer(id);

    await deleteCustomerImage(
        current.photoUri
    );
}