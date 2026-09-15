import { getDatabase } from "@/database/database.native";
import { getStartingCustomerNumber } from "@/services/settingsService";

// Customer numbers are entered manually (not auto-assigned) - this is
// only used to prefill the Add Customer form with a sensible next
// value, floored against both the configured starting number and
// whatever's already in the table. The tailor can freely type over it
// before saving.
export async function suggestNextCustomerNumber(): Promise<number> {
    const startingValue = await getStartingCustomerNumber();

    const db = await getDatabase();

    const highestCustomer =
        await db.getFirstAsync<{
            highest: number | null;
        }>(
            `
            SELECT MAX(customer_number) AS highest
            FROM customers
            `
        );

    const highestExisting =
        highestCustomer?.highest ?? 0;

    return Math.max(
        startingValue || 1,
        highestExisting + 1
    );
}
