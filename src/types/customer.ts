export type Customer = {
    id: number;
    customerNumber: number;
    name: string;
    phone: string;
    photoUri: string | null;
    address: string | null;
    notes: string | null;
    // Soft-delete flag. false means the customer was "deleted" from the
    // main Customers list but their record and order history are kept
    // until someone permanently deletes them from Settings.
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
};

export type CreateCustomerInput = {
    customerNumber: number;
    name: string;
    phone: string;
    photoUri?: string | null;
    address?: string | null;
    notes?: string | null;
};

export type UpdateCustomerInput = {
    customerNumber?: number;
    name?: string;
    phone?: string;
    photoUri?: string | null;
    address?: string | null;
    notes?: string | null;
};