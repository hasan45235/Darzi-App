import { Ionicons } from "@expo/vector-icons";
import {
    router,
    useFocusEffect,
    useLocalSearchParams,
} from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";

import AppButton from "@/components/AppButton";
import AppText from "@/components/AppText";
import ReceiptRenderer, {
    ReceiptData,
} from "@/components/ReceiptRenderer";
import Screen from "@/components/Screen";

import { findCustomerById } from "@/services/customerService";

import {
    findOrderById,
    getItemsForOrder,
} from "@/services/orderService";

import {
    printReceipt,
    shareReceipt,
} from "@/services/receiptExportService";

import {
    getBusinessName,
    getBusinessPhone,
    getBusinessSubtitle,
    getCurrency,
    getReceiptWarning,
} from "@/services/settingsService";

import { colors } from "@/constants/theme";

export default function ReceiptScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();

    const [data, setData] = useState<ReceiptData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sharing, setSharing] = useState(false);
    const [printing, setPrinting] = useState(false);

    const loadReceipt = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const orderId = Number(id);

            if (!Number.isInteger(orderId)) {
                throw new Error("Invalid order ID.");
            }

            const order = await findOrderById(orderId);

            if (!order) {
                throw new Error("Order not found.");
            }

            const [
                items,
                customer,
                businessName,
                businessSubtitle,
                businessPhone,
                currency,
                warning,
            ] = await Promise.all([
                getItemsForOrder(orderId),
                findCustomerById(order.customerId),
                getBusinessName(),
                getBusinessSubtitle(),
                getBusinessPhone(),
                getCurrency(),
                getReceiptWarning(),
            ]);

            if (!customer) {
                throw new Error("Customer not found.");
            }

            setData({
                order,
                items,
                customer,
                business: {
                    name: businessName,
                    subtitle: businessSubtitle,
                    phone: businessPhone,
                    currency,
                    warning,
                },
            });
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to load receipt."
            );
        } finally {
            setLoading(false);
        }
    }, [id]);

    useFocusEffect(
        useCallback(() => {
            loadReceipt();
        }, [loadReceipt])
    );

    async function handleShare() {
        if (!data) {
            return;
        }

        try {
            setSharing(true);

            await shareReceipt(data);
        } catch (error) {
            Alert.alert(
                "Couldn't share receipt",
                error instanceof Error
                    ? error.message
                    : "Something went wrong."
            );
        } finally {
            setSharing(false);
        }
    }

    async function handlePrint() {
        if (!data) {
            return;
        }

        try {
            setPrinting(true);

            await printReceipt(data);
        } catch (error) {
            // iOS rejects printAsync's promise when the user just closes
            // the print sheet without printing (Android instead resolves
            // normally in that case) - that's a cancel, not a failure, so
            // it shouldn't surface as an error.
            const message =
                error instanceof Error ? error.message : "";

            if (message.toLowerCase().includes("cancel")) {
                return;
            }

            Alert.alert(
                "Couldn't print receipt",
                message || "Something went wrong."
            );
        } finally {
            setPrinting(false);
        }
    }

    if (loading) {
        return (
            <Screen>
                <View style={styles.center}>
                    <ActivityIndicator size="large" />

                    <AppText variant="caption">
                        Preparing receipt...
                    </AppText>
                </View>
            </Screen>
        );
    }

    if (!data) {
        return (
            <Screen>
                <View style={styles.center}>
                    <AppText variant="secondary">
                        {error ?? "Receipt not found"}
                    </AppText>

                    <AppButton
                        title="Go Back"
                        onPress={() => router.back()}
                    />
                </View>
            </Screen>
        );
    }

    return (
        <Screen>
            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <ReceiptRenderer
                    order={data.order}
                    items={data.items}
                    customer={data.customer}
                    business={data.business}
                />

                {/* Share (send the PDF to WhatsApp, Drive, Files, etc.
                via the OS share sheet) is the action a tailor reaches for
                most, so it gets the primary/filled button; Print (a
                physical printer, or "Save as PDF" through the system
                print dialog) is the secondary, outline one. */}
                <View style={styles.actions}>
                    <AppButton
                        title="Share"
                        onPress={handleShare}
                        loading={sharing}
                        disabled={printing}
                        icon={
                            <Ionicons
                                name="share-social-outline"
                                size={18}
                                color={colors.white}
                            />
                        }
                        style={styles.actionButton}
                    />

                    <AppButton
                        title="Print"
                        variant="outline"
                        onPress={handlePrint}
                        loading={printing}
                        disabled={sharing}
                        icon={
                            <Ionicons
                                name="print-outline"
                                size={18}
                                color={colors.primary}
                            />
                        }
                        style={styles.actionButton}
                    />
                </View>
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    content: {
        paddingBottom: 32,
    },

    actions: {
        flexDirection: "row",
        gap: 12,
        marginTop: 16,
    },

    actionButton: {
        flex: 1,
    },

    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 12,
    },
});
