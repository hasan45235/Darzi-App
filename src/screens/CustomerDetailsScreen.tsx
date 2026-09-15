import {
    router,
    useFocusEffect,
    useLocalSearchParams,
} from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";

import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";
import AppText from "@/components/AppText";
import FloatingActionButton from "@/components/FloatingActionButton";
import IconActionButton from "@/components/IconActionButton";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import Screen from "@/components/Screen";
import ViewableCustomerAvatar from "@/components/ViewableCustomerAvatar";

import { useConfirm } from "@/providers/ConfirmDialogProvider";

import {
    findCustomerById,
    removeCustomer,
} from "@/services/customerService";

import { resolveCustomerImageUri } from "@/services/customerImageService";
import { getCustomerOrders } from "@/services/orderService";

import { colors, shadows } from "@/constants/theme";
import { ORDER_STATUS_COLORS } from "@/constants/orderStatus";
import { Customer } from "@/types/customer";
import { Order } from "@/types/order";

const RECENT_ORDERS_LIMIT = 5;
const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

export default function CustomerDetailsScreen() {
    const { id } =
        useLocalSearchParams<{ id: string }>();

    const [customer, setCustomer] =
        useState<Customer | null>(null);

    const [orders, setOrders] =
        useState<Order[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [deleting, setDeleting] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    const confirm = useConfirm();

    const loadCustomer = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const customerId = Number(id);

            if (!Number.isInteger(customerId)) {
                throw new Error("Invalid customer ID.");
            }

            const [result, customerOrders] = await Promise.all([
                findCustomerById(customerId),
                getCustomerOrders(customerId),
            ]);

            if (!result) {
                throw new Error("Customer not found.");
            }

            setCustomer(result);
            setOrders(customerOrders);
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to load customer."
            );
        } finally {
            setLoading(false);
        }
    }, [id]);

    useFocusEffect(
        useCallback(() => {
            loadCustomer();
        }, [loadCustomer])
    );

    // Orders created in the last 30 days, newest first - a quick "what's
    // been happening lately" preview. Customer Orders (the FAB below)
    // still shows every order this customer has ever had, unfiltered.
    const recentOrders = useMemo(() => {
        const cutoff = Date.now() - MONTH_MS;

        return [...orders]
            .filter(
                (order) => new Date(order.createdAt).getTime() >= cutoff
            )
            .sort(
                (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
            )
            .slice(0, RECENT_ORDERS_LIMIT);
    }, [orders]);

    async function handleDelete() {
        if (!customer) {
            return;
        }

        const confirmed = await confirm({
            title: "Delete Customer",
            message:
                `This will deactivate ${customer.name}. They'll be hidden ` +
                "from your customer list, but their orders stay on record. " +
                "You can permanently delete them later from Settings.",
            confirmText: "Deactivate",
            tone: "danger",
        });

        if (!confirmed) {
            return;
        }

        try {
            setDeleting(true);
            setError(null);

            await removeCustomer(customer.id);

            router.back();
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Failed to delete customer.";

            setError(message);

            Alert.alert("Cannot Delete Customer", message);
        } finally {
            setDeleting(false);
        }
    }

    if (loading) {
        return (
            <Screen>
                <View style={styles.center}>
                    <ActivityIndicator size="large" />

                    <AppText variant="caption">
                        Loading customer...
                    </AppText>
                </View>
            </Screen>
        );
    }

    if (!customer) {
        return (
            <Screen>
                <View style={styles.center}>
                    <AppText variant="secondary">
                        Customer not found
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
            >
                <View style={styles.profile}>
                    <ViewableCustomerAvatar
                        name={customer.name}
                        photoUri={resolveCustomerImageUri(customer.photoUri)}
                        size={140}
                        style={styles.avatar}
                    />

                    <AppText variant="title">
                        {customer.name}
                    </AppText>

                    <AppText variant="caption">
                        Customer #{customer.customerNumber}
                    </AppText>

                    {!customer.isActive ? (
                        <View style={styles.inactiveBadge}>
                            <AppText
                                variant="caption"
                                style={{ color: colors.danger }}
                            >
                                Deactivated
                            </AppText>
                        </View>
                    ) : null}

                    {/* Edit/Delete live right under the identity they act
                    on - the same "contact card" placement real people/
                    profile screens use - as small icon buttons instead
                    of full-width text buttons competing with "View
                    Orders" for attention lower down. */}
                    <View style={styles.profileActions}>
                        <IconActionButton
                            icon="pencil"
                            label="Edit customer"
                            onPress={() =>
                                router.push({
                                    pathname: "/edit-customer",
                                    params: {
                                        id: customer.id.toString(),
                                    },
                                })
                            }
                        />

                        <IconActionButton
                            icon="trash-outline"
                            label="Delete customer"
                            tone="danger"
                            loading={deleting}
                            onPress={handleDelete}
                        />
                    </View>
                </View>

                <AppCard>
                    <View style={styles.section}>
                        <AppText variant="caption">
                            Phone
                        </AppText>

                        <AppText variant="body">
                            {customer.phone}
                        </AppText>
                    </View>

                    {customer.address ? (
                        <View style={styles.section}>
                            <AppText variant="caption">
                                Address
                            </AppText>

                            <AppText variant="body">
                                {customer.address}
                            </AppText>
                        </View>
                    ) : null}

                    {customer.notes ? (
                        <View style={styles.section}>
                            <AppText variant="caption">
                                Notes
                            </AppText>

                            <AppText variant="body">
                                {customer.notes}
                            </AppText>
                        </View>
                    ) : null}
                </AppCard>

                {recentOrders.length > 0 ? (
                    <View style={styles.section}>
                        <AppText variant="heading">
                            Recent Orders
                        </AppText>

                        <AppText variant="caption">
                            Created in the last 30 days.
                        </AppText>

                        <View style={styles.recentOrdersList}>
                            {recentOrders.map((order) => (
                                <AppCard
                                    key={order.id}
                                    onPress={() =>
                                        router.push({
                                            pathname: "/order-details",
                                            params: {
                                                id: order.id.toString(),
                                            },
                                        })
                                    }
                                    style={{
                                        borderLeftWidth: 3,
                                        borderLeftColor:
                                            ORDER_STATUS_COLORS[order.status]
                                                .text,
                                    }}
                                >
                                    <View style={styles.recentOrderHeader}>
                                        <AppText variant="secondary">
                                            Receipt #{order.receiptNumber}
                                        </AppText>

                                        <AppText variant="caption">
                                            {order.orderDate}
                                        </AppText>
                                    </View>

                                    <OrderStatusBadge
                                        status={order.status}
                                        style={styles.recentOrderBadge}
                                    />

                                    <AppText variant="body">
                                        Total: {order.total}
                                    </AppText>
                                </AppCard>
                            ))}
                        </View>
                    </View>
                ) : null}

                {error ? (
                    <AppText variant="caption">
                        {error}
                    </AppText>
                ) : null}
            </ScrollView>

            {/* "View Orders" is this screen's one primary action, so it
            gets the floating button treatment (same as Orders/Customers'
            "add new") instead of a long full-width button competing with
            everything above it for space. */}
            <FloatingActionButton
                icon="receipt-outline"
                label="View orders"
                onPress={() =>
                    router.push({
                        pathname: "/customer-orders",
                        params: {
                            id: customer.id.toString(),
                        },
                    })
                }
            />
        </Screen>
    );
}

const styles = StyleSheet.create({
    content: {
        // Extra room so the last card can scroll clear of the FAB
        // instead of sitting underneath it.
        paddingBottom: 96,
        gap: 16,
    },

    profile: {
        alignItems: "center",
        gap: 6,
    },

    inactiveBadge: {
        marginTop: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: colors.dangerLight,
    },

    avatar: {
        marginBottom: 8,
        ...shadows.medium,
    },

    profileActions: {
        flexDirection: "row",
        gap: 16,
        marginTop: 8,
    },

    section: {
        gap: 4,
        marginBottom: 16,
    },

    recentOrdersList: {
        gap: 12,
        marginTop: 8,
    },

    recentOrderHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },

    recentOrderBadge: {
        marginBottom: 8,
    },

    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 12,
    },
});