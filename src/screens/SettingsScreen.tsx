import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    StyleSheet,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";
import AppInput from "@/components/AppInput";
import AppText from "@/components/AppText";
import BottomNav from "@/components/BottomNav";
import Screen from "@/components/Screen";

import { useConfirm } from "@/providers/ConfirmDialogProvider";

import { colors, spacing } from "@/constants/theme";

import {
    getBasicPantPrice,
    getBasicShirtPrice,
    getBasicSuitPrice,
    getStartingCustomerNumber,
} from "@/services/settingsService";

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
    getInactiveCustomers,
    permanentlyDeleteCustomer,
} from "@/services/customerService";

import {
    SETTING_KEYS,
} from "@/constants/settings";

import { Customer } from "@/types/customer";

export default function SettingsScreen() {
    const [inactiveCustomers, setInactiveCustomers] =
        useState<Customer[]>([]);

    const [loadingInactive, setLoadingInactive] =
        useState(true);

    const [deletingCustomerId, setDeletingCustomerId] =
        useState<number | null>(null);

    const [businessName, setBusinessName] = useState("");
    const [businessSubtitle, setBusinessSubtitle] = useState("");
    const [businessPhone, setBusinessPhone] = useState("");
    const [businessAddress, setBusinessAddress] = useState("");
    const [customerNumberStarting, setCustomerNumberStarting] =
        useState("");

    const [basicSuitPrice, setBasicSuitPrice] =
        useState("");

    const [basicPantPrice, setBasicPantPrice] =
        useState("");

    const [basicShirtPrice, setBasicShirtPrice] =
        useState("");

    const [currency, setCurrency] = useState("");
    const [startingReceiptNumber, setStartingReceiptNumber] =
        useState("");

    const [receiptWarning, setReceiptWarning] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const insets = useSafeAreaInsets();
    const confirm = useConfirm();

    useEffect(() => {
        loadSettings();
        loadInactiveCustomers();
    }, []);

    async function loadInactiveCustomers() {
        try {
            setLoadingInactive(true);

            setInactiveCustomers(
                await getInactiveCustomers()
            );
        } catch (error) {
            console.error(
                "Failed to load deactivated customers:",
                error
            );
        } finally {
            setLoadingInactive(false);
        }
    }

    async function handlePermanentDelete(customer: Customer) {
        const confirmed = await confirm({
            title: "Permanently Delete Customer",
            message:
                `This will permanently delete ${customer.name} and all of ` +
                "their orders. This cannot be undone.",
            confirmText: "Delete Forever",
            tone: "danger",
        });

        if (!confirmed) {
            return;
        }

        try {
            setDeletingCustomerId(customer.id);

            await permanentlyDeleteCustomer(customer.id);

            setInactiveCustomers((current) =>
                current.filter((item) => item.id !== customer.id)
            );
        } catch (error) {
            Alert.alert(
                "Failed to delete",
                error instanceof Error
                    ? error.message
                    : "Something went wrong."
            );
        } finally {
            setDeletingCustomerId(null);
        }
    }

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
                customerStartingNumber,
                suitPrice,
                pantPrice,
                shirtPrice,
            ] = await Promise.all([
                getBusinessName(),
                getBusinessSubtitle(),
                getBusinessPhone(),
                getBusinessAddress(),
                getCurrency(),
                getStartingReceiptNumber(),
                getReceiptWarning(),
                getStartingCustomerNumber(),
                getBasicSuitPrice(),
                getBasicPantPrice(),
                getBasicShirtPrice(),
            ]);

            setCustomerNumberStarting(
                String(customerStartingNumber)
            );

            setBasicSuitPrice(String(suitPrice));
            setBasicPantPrice(String(pantPrice));
            setBasicShirtPrice(String(shirtPrice));

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

        const parsedCustomerNumber =
            Number(customerNumberStarting);

        const parsedSuitPrice =
            Number(basicSuitPrice);

        const parsedPantPrice =
            Number(basicPantPrice);

        const parsedShirtPrice =
            Number(basicShirtPrice);
        const parsedStartingNumber =
            Number(startingReceiptNumber);

        if (
            !Number.isInteger(parsedCustomerNumber) ||
            parsedCustomerNumber < 1
        ) {
            Alert.alert(
                "Invalid customer number",
                "Starting customer number must be a whole number greater than 0."
            );
            return;
        }

        if (
            !Number.isFinite(parsedSuitPrice) ||
            parsedSuitPrice < 0 ||
            !Number.isFinite(parsedPantPrice) ||
            parsedPantPrice < 0 ||
            !Number.isFinite(parsedShirtPrice) ||
            parsedShirtPrice < 0
        ) {
            Alert.alert(
                "Invalid item price",
                "Basic item prices cannot be negative."
            );
            return;
        }
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
                    SETTING_KEYS.customerNumberStarting,
                    String(parsedCustomerNumber)
                ),

                setSetting(
                    SETTING_KEYS.basicSuitPrice,
                    String(parsedSuitPrice)
                ),

                setSetting(
                    SETTING_KEYS.basicPantPrice,
                    String(parsedPantPrice)
                ),

                setSetting(
                    SETTING_KEYS.basicShirtPrice,
                    String(parsedShirtPrice)
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
            <View
                style={[
                    styles.screenWrapper,
                    { paddingTop: insets.top },
                ]}
            >
                <Screen>
                    <View style={styles.loadingContainer}>
                        <AppText>Loading settings...</AppText>
                    </View>
                </Screen>

                <BottomNav />
            </View>
        );
    }

    return (
        <View style={[styles.screenWrapper, { paddingTop: insets.top }]}>
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
                    Customer Settings
                </AppText>

                <View style={styles.fields}>
                    <AppInput
                        label="Starting Customer Number"
                        value={customerNumberStarting}
                        onChangeText={setCustomerNumberStarting}
                        placeholder="e.g. 2000"
                        keyboardType="number-pad"
                    />
                </View>
            </AppCard>

            <AppCard style={styles.card}>
                <AppText variant="heading">
                    Basic Item Prices
                </AppText>

                <View style={styles.fields}>
                    <AppInput
                        label="Suit Price"
                        value={basicSuitPrice}
                        onChangeText={setBasicSuitPrice}
                        placeholder="e.g. 1800"
                        keyboardType="decimal-pad"
                    />

                    <AppInput
                        label="Pant Price"
                        value={basicPantPrice}
                        onChangeText={setBasicPantPrice}
                        placeholder="e.g. 800"
                        keyboardType="decimal-pad"
                    />

                    <AppInput
                        label="Shirt Price"
                        value={basicShirtPrice}
                        onChangeText={setBasicShirtPrice}
                        placeholder="e.g. 700"
                        keyboardType="decimal-pad"
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

            <AppCard style={styles.card}>
                <AppText variant="heading">
                    Deactivated Customers
                </AppText>

                <AppText
                    variant="caption"
                    style={styles.description}
                >
                    Customers deleted from the Customers tab land here.
                    Permanently deleting one also removes all of their
                    orders - this cannot be undone.
                </AppText>

                <View style={styles.fields}>
                    {loadingInactive ? (
                        <AppText variant="caption">
                            Loading...
                        </AppText>
                    ) : inactiveCustomers.length === 0 ? (
                        <AppText variant="caption">
                            No deactivated customers.
                        </AppText>
                    ) : (
                        inactiveCustomers.map((customer) => (
                            <View
                                key={customer.id}
                                style={styles.inactiveRow}
                            >
                                <View style={styles.inactiveRowText}>
                                    <AppText variant="body">
                                        #{customer.customerNumber} · {customer.name}
                                    </AppText>

                                    <AppText variant="caption">
                                        {customer.phone}
                                    </AppText>
                                </View>

                                {/* A dense list of customers doesn't need a
                                full-size danger button per row - a small
                                icon-only affordance (the same pattern real
                                contact/settings lists use for a destructive
                                row action) keeps the row visually calm while
                                still being unmistakably "delete". */}
                                <Pressable
                                    onPress={() =>
                                        handlePermanentDelete(customer)
                                    }
                                    disabled={
                                        deletingCustomerId !== null
                                    }
                                    hitSlop={8}
                                    style={styles.deleteIconButton}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Permanently delete ${customer.name}`}
                                >
                                    {deletingCustomerId === customer.id ? (
                                        <ActivityIndicator
                                            size="small"
                                            color={colors.danger}
                                        />
                                    ) : (
                                        <Ionicons
                                            name="trash-outline"
                                            size={20}
                                            color={colors.danger}
                                        />
                                    )}
                                </Pressable>
                            </View>
                        ))
                    )}
                </View>
            </AppCard>
        </Screen>

        <BottomNav />
        </View>
    );
}

const styles = StyleSheet.create({
    screenWrapper: {
        flex: 1,
        backgroundColor: colors.background,
    },

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

    inactiveRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
    },

    inactiveRowText: {
        flex: 1,
        gap: 2,
    },

    deleteIconButton: {
        padding: spacing.sm,
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