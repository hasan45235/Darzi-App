import {
    DEFAULT_SETTINGS,
    SETTING_KEYS,
} from "@/constants/settings";

import {
    getSetting,
    setSetting,
} from "@/database/repositories/settingsRepository";

export async function initializeDefaultSettings(): Promise<void> {
    for (const [key, defaultValue] of Object.entries(DEFAULT_SETTINGS)) {
        const existingValue = await getSetting(key);

        if (existingValue === null) {
            await setSetting(key, defaultValue);
        }
    }
}

export async function getBusinessName(): Promise<string> {
    return (
        (await getSetting(SETTING_KEYS.businessName)) ??
        DEFAULT_SETTINGS[SETTING_KEYS.businessName]
    );
}

export async function getBusinessSubtitle(): Promise<string> {
    return (
        (await getSetting(SETTING_KEYS.businessSubtitle)) ??
        DEFAULT_SETTINGS[SETTING_KEYS.businessSubtitle]
    );
}

export async function getBusinessPhone(): Promise<string> {
    return (
        (await getSetting(SETTING_KEYS.businessPhone)) ??
        DEFAULT_SETTINGS[SETTING_KEYS.businessPhone]
    );
}

export async function getBusinessAddress(): Promise<string> {
    return (
        (await getSetting(SETTING_KEYS.businessAddress)) ??
        DEFAULT_SETTINGS[SETTING_KEYS.businessAddress]
    );
}

export async function getCurrency(): Promise<string> {
    return (
        (await getSetting(SETTING_KEYS.currency)) ??
        DEFAULT_SETTINGS[SETTING_KEYS.currency]
    );
}

export async function getStartingReceiptNumber(): Promise<number> {
    const value = await getSetting(
        SETTING_KEYS.startingReceiptNumber
    );

    const parsed = Number(value);

    if (!Number.isFinite(parsed) || parsed < 1) {
        return Number(
            DEFAULT_SETTINGS[SETTING_KEYS.startingReceiptNumber]
        );
    }

    return Math.floor(parsed);
}

export async function getNextReceiptNumber(): Promise<number> {
    const value = await getSetting(
        SETTING_KEYS.nextReceiptNumber
    );

    const parsed = Number(value);

    if (!Number.isFinite(parsed) || parsed < 1) {
        return Number(
            DEFAULT_SETTINGS[SETTING_KEYS.nextReceiptNumber]
        );
    }

    return Math.floor(parsed);
}

export async function getReceiptWarning(): Promise<string> {
    return (
        (await getSetting(SETTING_KEYS.receiptWarning)) ??
        DEFAULT_SETTINGS[SETTING_KEYS.receiptWarning]
    );
}