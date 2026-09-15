import {
    router,
    useFocusEffect,
    useLocalSearchParams,
} from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";

import AppButton from "@/components/AppButton";
import AppText from "@/components/AppText";
import ReceiptRenderer, {
    ReceiptBusinessInfo,
} from "@/components/ReceiptRenderer";
import Screen from "@/components/Screen";

import { findCustomerById } from "@/services/customerService";

import {
    findOrderById,
    getItemsForOrder,
} from "@/services/orderService";

import {
    getBusinessName,
    getBusinessPhone,
    getBusinessSubtitle,
    getCurrency,
    getReceiptWarning,
} from "@/services/settingsService";

import { Customer } from "@/types/customer";
import { Order, OrderItem } from "@/types/order";

type ReceiptData = {
    order: Order;
    items: OrderItem[];
    customer: Customer;
    business: ReceiptBusinessInfo;
};

export default function ReceiptScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();

    const [data, setData] = useState<ReceiptData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

                {/* Sharing/printing this as an actual file (PDF, or an
                image to send over WhatsApp) is the next phase - for now
                this screen is the receipt's in-app preview, and the
                renderer above is already built to be reused unchanged
                once that export step exists. */}
                <AppText variant="caption" style={styles.note}>
                    Sharing and printing are coming in the next update.
                </AppText>
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    content: {
        paddingBottom: 32,
    },

    note: {
        textAlign: "center",
        marginTop: 16,
    },

    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 12,
    },
});
