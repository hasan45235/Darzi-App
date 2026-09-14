import {
    getSetting,
    setSetting,
} from "@/database/repositories/settingsRepository";

import {
    DEFAULT_SETTINGS,
    SETTING_KEYS,
} from "@/constants/settings";

export async function initializeReceiptNumber(): Promise<void> {
    const nextNumber = await getSetting(
        SETTING_KEYS.nextReceiptNumber
    );

    if (nextNumber === null) {
        await setSetting(
            SETTING_KEYS.nextReceiptNumber,
            DEFAULT_SETTINGS[SETTING_KEYS.nextReceiptNumber]
        );
    }
}

export async function getNextReceiptNumber(): Promise<number> {
    await initializeReceiptNumber();

    const value = await getSetting(
        SETTING_KEYS.nextReceiptNumber
    );

    const number = Number(value);

    if (!Number.isInteger(number) || number < 1) {
        throw new Error(
            "Invalid next receipt number."
        );
    }

    return number;
}

export async function advanceReceiptNumber(): Promise<void> {
    const current =
        await getNextReceiptNumber();

    await setSetting(
        SETTING_KEYS.nextReceiptNumber,
        String(current + 1)
    );
}