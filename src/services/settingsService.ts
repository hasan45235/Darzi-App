import {
    DEFAULT_SETTINGS,
    SETTING_KEYS,
} from "@/constants/settings";

import {
    getSetting,
    setSetting,
} from "@/database/repositories/settingsRepository";

export async function initializeDefaultSettings(): Promise<void> {
    for (const [key, defaultValue] of Object.entries(
        DEFAULT_SETTINGS
    )) {
        const existingValue = await getSetting(key);

        if (existingValue === null) {
            await setSetting(key, defaultValue);
        }
    }
}

async function getNumberSetting(
    key: string,
    fallback: string
): Promise<number> {
    const value = await getSetting(key);
    const parsed = Number(value);

    if (!Number.isFinite(parsed) || parsed < 0) {
        return Number(fallback);
    }

    return Math.floor(parsed);
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
    return getNumberSetting(
        SETTING_KEYS.startingReceiptNumber,
        DEFAULT_SETTINGS[
        SETTING_KEYS.startingReceiptNumber
        ]
    );
}

export async function getNextReceiptNumber(): Promise<number> {
    return getNumberSetting(
        SETTING_KEYS.nextReceiptNumber,
        DEFAULT_SETTINGS[
        SETTING_KEYS.nextReceiptNumber
        ]
    );
}

export async function getStartingCustomerNumber(): Promise<number> {
    return getNumberSetting(
        SETTING_KEYS.customerNumberStarting,
        DEFAULT_SETTINGS[
        SETTING_KEYS.customerNumberStarting
        ]
    );
}

export async function getBasicSuitPrice(): Promise<number> {
    return getNumberSetting(
        SETTING_KEYS.basicSuitPrice,
        DEFAULT_SETTINGS[
        SETTING_KEYS.basicSuitPrice
        ]
    );
}

export async function getBasicPantPrice(): Promise<number> {
    return getNumberSetting(
        SETTING_KEYS.basicPantPrice,
        DEFAULT_SETTINGS[
        SETTING_KEYS.basicPantPrice
        ]
    );
}

export async function getBasicShirtPrice(): Promise<number> {
    return getNumberSetting(
        SETTING_KEYS.basicShirtPrice,
        DEFAULT_SETTINGS[
        SETTING_KEYS.basicShirtPrice
        ]
    );
}

export async function getReceiptWarning(): Promise<string> {
    return (
        (await getSetting(SETTING_KEYS.receiptWarning)) ??
        DEFAULT_SETTINGS[SETTING_KEYS.receiptWarning]
    );
}