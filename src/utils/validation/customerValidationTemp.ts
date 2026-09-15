export type CustomerFormInput = {
    customerNumber: number;
    name: string;
    phone: string;
    address?: string;
    notes?: string;
};

export type CustomerValidationResult = {
    valid: boolean;
    errors: {
        customerNumber?: string;
        name?: string;
        phone?: string;
    };
};

export function validateCustomer(
    input: CustomerFormInput
): CustomerValidationResult {
    const errors: CustomerValidationResult["errors"] = {};

    const name = input.name.trim();
    const phone = input.phone.trim();

    if (
        !Number.isInteger(input.customerNumber) ||
        input.customerNumber <= 0
    ) {
        errors.customerNumber =
            "Customer number must be a whole number greater than 0.";
    }

    if (!name) {
        errors.name = "Customer name is required.";
    }

    if (!phone) {
        errors.phone = "Phone number is required.";
    } else if (phone.length < 7) {
        errors.phone = "Please enter a valid phone number.";
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors,
    };
}