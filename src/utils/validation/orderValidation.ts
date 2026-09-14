export type OrderFormInput = {
    customerId: number | null;
    deliveryDate: string;
};

export type OrderValidationResult = {
    valid: boolean;
    errors: {
        customerId?: string;
        deliveryDate?: string;
    };
};

export function validateOrder(
    input: OrderFormInput
): OrderValidationResult {
    const errors: OrderValidationResult["errors"] = {};

    if (!input.customerId) {
        errors.customerId = "Customer is required.";
    }

    if (!input.deliveryDate.trim()) {
        errors.deliveryDate = "Delivery date is required.";
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors,
    };
}