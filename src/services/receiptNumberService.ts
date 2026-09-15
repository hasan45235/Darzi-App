import {
    getSetting,
    setSetting,
} from "@/database/repositories/settingsRepository";

import {
    DEFAULT_SETTINGS,
    SETTING_KEYS,
} from "@/constants/settings";

import { getDatabase } from "@/database/database.native";

export async function initializeReceiptNumber(): Promise<void> {
    const startingValue =
        await getSetting(
            SETTING_KEYS.startingReceiptNumber
        );

    if (startingValue === null) {
        await setSetting(
            SETTING_KEYS.startingReceiptNumber,
            DEFAULT_SETTINGS[
            SETTING_KEYS.startingReceiptNumber
            ]
        );
    }

    const nextValue =
        await getSetting(
            SETTING_KEYS.nextReceiptNumber
        );

    if (nextValue === null) {
        await setSetting(
            SETTING_KEYS.nextReceiptNumber,
            DEFAULT_SETTINGS[
            SETTING_KEYS.nextReceiptNumber
            ]
        );
    }
}

export async function getNextReceiptNumber(): Promise<number> {
    await initializeReceiptNumber();

    const startingValue = Number(
        await getSetting(
            SETTING_KEYS.startingReceiptNumber
        )
    );

    const savedNextValue = Number(
        await getSetting(
            SETTING_KEYS.nextReceiptNumber
        )
    );

    const db = await getDatabase();

    const highestOrder =
        await db.getFirstAsync<{
            highest: number | null;
        }>(
            `
            SELECT MAX(receipt_number) AS highest
            FROM orders
            `
        );

    const highestExisting =
        highestOrder?.highest ?? 0;

    return Math.max(
        startingValue || 1,
        savedNextValue || 1,
        highestExisting + 1
    );
}

export async function advanceReceiptNumber(): Promise<void> {
    const current =
        await getNextReceiptNumber();

    await setSetting(
        SETTING_KEYS.nextReceiptNumber,
        String(current + 1)
    );
}