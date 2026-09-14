import {
    getSetting,
    setSetting,
} from "@/database/repositories/settingsRepository";

import {
    DEFAULT_SETTINGS,
    SETTING_KEYS,
} from "@/constants/settings";

export async function getNextCustomerNumber(): Promise<number> {
    let value = await getSetting(
        SETTING_KEYS.nextCustomerNumber
    );

    if (value === null) {
        const starting =
            DEFAULT_SETTINGS[
            SETTING_KEYS.customerNumberStarting
            ];

        await setSetting(
            SETTING_KEYS.nextCustomerNumber,
            starting
        );

        value = starting;
    }

    const number = Number(value);

    if (!Number.isInteger(number) || number < 1) {
        throw new Error(
            "Invalid next customer number."
        );
    }

    return number;
}

export async function advanceCustomerNumber(): Promise<void> {
    const current =
        await getNextCustomerNumber();

    await setSetting(
        SETTING_KEYS.nextCustomerNumber,
        String(current + 1)
    );
}