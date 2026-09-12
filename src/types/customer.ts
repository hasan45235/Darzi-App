export type Customer = {
    id: number;
    name: string;
    phone: string;
    photoUri: string | null;
    address: string | null;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
};

export type CreateCustomerInput = {
    name: string;
    phone: string;
    photoUri?: string | null;
    address?: string | null;
    notes?: string | null;
};

export type UpdateCustomerInput = {
    name?: string;
    phone?: string;
    photoUri?: string | null;
    address?: string | null;
    notes?: string | null;
};