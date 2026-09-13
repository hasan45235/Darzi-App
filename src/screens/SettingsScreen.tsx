import { useEffect, useState } from "react";
import {
    Alert,
    StyleSheet,
    View,
} from "react-native";

import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";
import AppInput from "@/components/AppInput";
import AppText from "@/components/AppText";
import Screen from "@/components/Screen";

import {
    getBusinessAddress,
    getBusinessName,
    getBusinessPhone,
    getBusinessSubtitle,
    getCurrency,
    getReceiptWarning,
    getStartingReceiptNumber,
    initializeDefaultSettings,
} from "@/services/settingsService";

import {
    setSetting,
} from "@/database/repositories/settingsRepository";

import {
    SETTING_KEYS,
} from "@/constants/settings";

export default function SettingsScreen() {
    const [businessName, setBusinessName] = useState("");
    const [businessSubtitle, setBusinessSubtitle] = useState("");
    const [businessPhone, setBusinessPhone] = useState("");
    const [businessAddress, setBusinessAddress] = useState("");

    const [currency, setCurrency] = useState("");
    const [startingReceiptNumber, setStartingReceiptNumber] =
        useState("");

    const [receiptWarning, setReceiptWarning] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    async function loadSettings() {
        try {
            setLoading(true);

            await initializeDefaultSettings();

            const [
                name,
                subtitle,
                phone,
                address,
                currencyValue,
                startingNumber,
                warning,
            ] = await Promise.all([
                getBusinessName(),
                getBusinessSubtitle(),
                getBusinessPhone(),
                getBusinessAddress(),
                getCurrency(),
                getStartingReceiptNumber(),
                getReceiptWarning(),
            ]);

            setBusinessName(name);
            setBusinessSubtitle(subtitle);
            setBusinessPhone(phone);
            setBusinessAddress(address);
            setCurrency(currencyValue);
            setStartingReceiptNumber(
                String(startingNumber)
            );
            setReceiptWarning(warning);
        } catch (error) {
            console.error("Failed to load settings:", error);

            Alert.alert(
                "Error",
                "Unable to load settings."
            );
        } finally {
            setLoading(false);
        }
    }

    async function saveSettings() {
        const parsedStartingNumber =
            Number(startingReceiptNumber);

        if (!businessName.trim()) {
            Alert.alert(
                "Invalid information",
                "Business name is required."
            );
            return;
        }

        if (
            !Number.isFinite(parsedStartingNumber) ||
            parsedStartingNumber < 1 ||
            !Number.isInteger(parsedStartingNumber)
        ) {
            Alert.alert(
                "Invalid receipt number",
                "Starting receipt number must be a whole number greater than 0."
            );
            return;
        }

        try {
            setSaving(true);

            await Promise.all([
                setSetting(
                    SETTING_KEYS.businessName,
                    businessName.trim()
                ),

                setSetting(
                    SETTING_KEYS.businessSubtitle,
                    businessSubtitle.trim()
                ),

                setSetting(
                    SETTING_KEYS.businessPhone,
                    businessPhone.trim()
                ),

                setSetting(
                    SETTING_KEYS.businessAddress,
                    businessAddress.trim()
                ),

                setSetting(
                    SETTING_KEYS.currency,
                    currency.trim() || "PKR"
                ),

                setSetting(
                    SETTING_KEYS.startingReceiptNumber,
                    String(parsedStartingNumber)
                ),

                setSetting(
                    SETTING_KEYS.receiptWarning,
                    receiptWarning.trim()
                ),
            ]);

            Alert.alert(
                "Saved",
                "Settings have been saved successfully."
            );
        } catch (error) {
            console.error("Failed to save settings:", error);

            Alert.alert(
                "Error",
                "Unable to save settings."
            );
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <Screen>
                <View style={styles.loadingContainer}>
                    <AppText>Loading settings...</AppText>
                </View>
            </Screen>
        );
    }

    return (
        <Screen scroll>
            <AppText variant="title">
                Settings
            </AppText>

            <AppText
                variant="secondary"
                style={styles.description}
            >
                Configure your business information and receipt settings.
            </AppText>

            <AppCard style={styles.card}>
                <AppText variant="heading">
                    Business Information
                </AppText>

                <View style={styles.fields}>
                    <AppInput
                        label="Business Name"
                        value={businessName}
                        onChangeText={setBusinessName}
                        placeholder="Enter business name"
                    />

                    <AppInput
                        label="Business Subtitle"
                        value={businessSubtitle}
                        onChangeText={setBusinessSubtitle}
                        placeholder="e.g. Gents Specialist"
                    />

                    <AppInput
                        label="Phone"
                        value={businessPhone}
                        onChangeText={setBusinessPhone}
                        placeholder="Enter business phone"
                        keyboardType="phone-pad"
                    />

                    <AppInput
                        label="Address"
                        value={businessAddress}
                        onChangeText={setBusinessAddress}
                        placeholder="Enter business address"
                        multiline
                    />
                </View>
            </AppCard>

            <AppCard style={styles.card}>
                <AppText variant="heading">
                    Receipt Settings
                </AppText>

                <View style={styles.fields}>
                    <AppInput
                        label="Currency"
                        value={currency}
                        onChangeText={setCurrency}
                        placeholder="e.g. PKR"
                        autoCapitalize="characters"
                    />

                    <AppInput
                        label="Starting Receipt Number"
                        value={startingReceiptNumber}
                        onChangeText={setStartingReceiptNumber}
                        placeholder="e.g. 200"
                        keyboardType="number-pad"
                    />

                    <AppInput
                        label="Receipt Warning"
                        value={receiptWarning}
                        onChangeText={setReceiptWarning}
                        placeholder="Enter receipt warning"
                        multiline
                        textAlignVertical="top"
                        style={styles.warningInput}
                    />
                </View>
            </AppCard>

            <AppButton
                title="Save Settings"
                onPress={saveSettings}
                loading={saving}
                style={styles.saveButton}
            />
        </Screen>
    );
}

const styles = StyleSheet.create({
    description: {
        marginTop: 4,
        marginBottom: 20,
    },

    card: {
        marginBottom: 16,
    },

    fields: {
        marginTop: 20,
        gap: 16,
    },

    warningInput: {
        minHeight: 100,
    },

    saveButton: {
        marginTop: 4,
        marginBottom: 24,
    },

    loadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
});