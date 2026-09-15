import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
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

import { getCustomers } from "@/services/customerService";
import { getOrders } from "@/services/orderService";
import { getBusinessName } from "@/services/settingsService";

import { colors, spacing } from "@/constants/theme";
import { Customer } from "@/types/customer";
import { Order } from "@/types/order";

const RECENT_ORDERS_LIMIT = 5;
const RECENT_CUSTOMERS_LIMIT = 5;

type SearchResult =
    | { type: "customer"; customer: Customer }
    | { type: "order"; order: Order; customerName: string };

export default function HomeScreen() {
    const [businessName, setBusinessName] = useState("");
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState("");
    const [error, setError] = useState<string | null>(null);
    const insets = useSafeAreaInsets();

    // `silent` powers pull-to-refresh: same fetch, but it drives the
    // small RefreshControl spinner instead of replacing the whole
    // screen with the full-page loading state.
    const loadHomeData = useCallback(async (opts?: { silent?: boolean }) => {
        try {
            if (opts?.silent) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError(null);

            // Settled, not all-or-nothing: the business name, customer
            // list, and order list are independent - one failing
            // shouldn't blank out the other two.
            const [nameResult, customersResult, ordersResult] =
                await Promise.allSettled([
                    getBusinessName(),
                    getCustomers(),
                    getOrders(),
                ]);

            if (nameResult.status === "fulfilled") {
                setBusinessName(nameResult.value);
            } else {
                console.error(
                    "Failed to load business name:",
                    nameResult.reason
                );
            }

            if (customersResult.status === "fulfilled") {
                setCustomers(customersResult.value);
            } else {
                console.error(
                    "Failed to load customers:",
                    customersResult.reason
                );
                setError(
                    customersResult.reason instanceof Error
                        ? customersResult.reason.message
                        : "Failed to load customers."
                );
            }

            if (ordersResult.status === "fulfilled") {
                setOrders(ordersResult.value);
            } else {
                console.error(
                    "Failed to load orders:",
                    ordersResult.reason
                );
                setError(
                    ordersResult.reason instanceof Error
                        ? ordersResult.reason.message
                        : "Failed to load orders."
                );
            }
        } finally {
            if (opts?.silent) {
                setRefreshing(false);
            } else {
                setLoading(false);
            }
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadHomeData();
        }, [loadHomeData])
    );

    function handleRefresh() {
        loadHomeData({ silent: true });
    }

    const customerNameById = useMemo(() => {
        const map = new Map<number, string>();

        for (const customer of customers) {
            map.set(customer.id, customer.name);
        }

        return map;
    }, [customers]);

    // Newest first. `id` auto-increments with creation order, which is a
    // safer "recency" signal here than trusting query order.
    const recentOrders = useMemo(() => {
        return [...orders]
            .sort((a, b) => b.id - a.id)
            .slice(0, RECENT_ORDERS_LIMIT);
    }, [orders]);

    const recentCustomers = useMemo(() => {
        return [...customers]
            .sort((a, b) => b.id - a.id)
            .slice(0, RECENT_CUSTOMERS_LIMIT);
    }, [customers]);

    const searchResults = useMemo<SearchResult[]>(() => {
        const query = search.trim().toLowerCase();

        if (!query) {
            return [];
        }

        const customerMatches: SearchResult[] = customers
            .filter(
                (customer) =>
                    customer.name.toLowerCase().includes(query) ||
                    customer.phone.toLowerCase().includes(query)
            )
            .map((customer) => ({
                type: "customer" as const,
                customer,
            }));

        const orderMatches: SearchResult[] = orders
            .filter((order) =>
                order.receiptNumber.toString().includes(query)
            )
            .map((order) => ({
                type: "order" as const,
                order,
                customerName:
                    customerNameById.get(order.customerId) ??
                    "Unknown customer",
            }));

        return [...customerMatches, ...orderMatches];
    }, [search, customers, orders, customerNameById]);

    function handleNewOrder() {
        Alert.alert(
            "Select a Customer",
            "Choose the customer this order is for, then tap \"Create Order\" from their orders.",
            [
                {
                    text: "OK",
                    onPress: () => router.push("/customers"),
                },
            ]
        );
    }

    const isSearching = search.trim().length > 0;

    if (loading) {
        return (
            <View
                style={[
                    styles.screenWrapper,
                    { paddingTop: insets.top },
                ]}
            >
                <Screen>
                    <View style={styles.center}>
                        <ActivityIndicator size="large" />

                        <AppText variant="caption">
                            Loading...
                        </AppText>
                    </View>
                </Screen>

                <BottomNav />
            </View>
        );
    }

    return (
        <View style={[styles.screenWrapper, { paddingTop: insets.top }]}>
            <Screen
                scroll
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                    />
                }
            >
                <View style={styles.header}>
                    <AppText variant="title">
                        {businessName}
                    </AppText>

                    <AppText variant="caption">
                        {orders.length} order
                        {orders.length === 1 ? "" : "s"} ·{" "}
                        {customers.length} customer
                        {customers.length === 1 ? "" : "s"}
                    </AppText>
                </View>

                {error ? (
                    <View style={styles.errorBanner}>
                        <AppText variant="caption">
                            Couldn't load everything: {error}
                        </AppText>
                    </View>
                ) : null}

                <AppInput
                    placeholder="Search by name, phone, or receipt #"
                    value={search}
                    onChangeText={setSearch}
                />

                {isSearching ? (
                    searchResults.length === 0 ? (
                        <View style={styles.center}>
                            <AppText variant="secondary">
                                No matches found
                            </AppText>
                        </View>
                    ) : (
                        <View style={styles.list}>
                            {searchResults.map((result) =>
                                result.type === "customer" ? (
                                    <AppCard
                                        key={`customer-${result.customer.id}`}
                                        onPress={() =>
                                            router.push({
                                                pathname:
                                                    "/customer-details",
                                                params: {
                                                    id: result.customer.id.toString(),
                                                },
                                            })
                                        }
                                    >
                                        <AppText variant="secondary">
                                            {result.customer.name}
                                        </AppText>

                                        <AppText variant="body">
                                            {result.customer.phone}
                                        </AppText>
                                    </AppCard>
                                ) : (
                                    <AppCard
                                        key={`order-${result.order.id}`}
                                        onPress={() =>
                                            router.push({
                                                pathname: "/order-details",
                                                params: {
                                                    id: result.order.id.toString(),
                                                },
                                            })
                                        }
                                    >
                                        <AppText variant="secondary">
                                            Receipt #{result.order.receiptNumber}
                                        </AppText>

                                        <AppText variant="body">
                                            {result.customerName}
                                        </AppText>
                                    </AppCard>
                                )
                            )}
                        </View>
                    )
                ) : (
                    <>
                        <View style={styles.quickActions}>
                            <AppButton
                                title="New Order"
                                onPress={handleNewOrder}
                                style={styles.quickActionButton}
                            />

                            <AppButton
                                title="Customers"
                                variant="secondary"
                                onPress={() => router.push("/customers")}
                                style={styles.quickActionButton}
                            />

                            <AppButton
                                title="Orders"
                                variant="outline"
                                onPress={() => router.push("/orders")}
                                style={styles.quickActionButton}
                            />
                        </View>

                        <View style={styles.section}>
                            <AppText variant="heading">
                                Recent Orders
                            </AppText>

                            {recentOrders.length === 0 ? (
                                <AppText variant="caption">
                                    No orders yet.
                                </AppText>
                            ) : (
                                <View style={styles.list}>
                                    {recentOrders.map((order) => (
                                        <AppCard
                                            key={order.id}
                                            onPress={() =>
                                                router.push({
                                                    pathname:
                                                        "/order-details",
                                                    params: {
                                                        id: order.id.toString(),
                                                    },
                                                })
                                            }
                                        >
                                            <AppText variant="secondary">
                                                Receipt #{order.receiptNumber}
                                            </AppText>

                                            <AppText variant="body">
                                                {customerNameById.get(
                                                    order.customerId
                                                ) ?? "Unknown customer"}
                                            </AppText>

                                            <AppText variant="body">
                                                Total: {order.total}
                                            </AppText>

                                            <AppText variant="caption">
                                                Delivery: {order.deliveryDate}
                                            </AppText>
                                        </AppCard>
                                    ))}
                                </View>
                            )}
                        </View>

                        <View style={styles.section}>
                            <AppText variant="heading">
                                Recently Added Customers
                            </AppText>

                            {recentCustomers.length === 0 ? (
                                <AppText variant="caption">
                                    No customers yet.
                                </AppText>
                            ) : (
                                <View style={styles.list}>
                                    {recentCustomers.map((customer) => (
                                        <AppCard
                                            key={customer.id}
                                            onPress={() =>
                                                router.push({
                                                    pathname:
                                                        "/customer-details",
                                                    params: {
                                                        id: customer.id.toString(),
                                                    },
                                                })
                                            }
                                        >
                                            <AppText variant="secondary">
                                                {customer.name}
                                            </AppText>

                                            <AppText variant="body">
                                                {customer.phone}
                                            </AppText>
                                        </AppCard>
                                    ))}
                                </View>
                            )}
                        </View>
                    </>
                )}
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

    header: {
        marginBottom: spacing.lg,
    },

    errorBanner: {
        backgroundColor: colors.dangerLight,
        borderRadius: 8,
        padding: spacing.md,
        marginBottom: spacing.md,
    },

    quickActions: {
        flexDirection: "row",
        gap: spacing.md,
        marginTop: spacing.lg,
        marginBottom: spacing.xxl,
    },

    quickActionButton: {
        flex: 1,
        paddingHorizontal: spacing.sm,
    },

    section: {
        marginBottom: spacing.xxl,
        gap: spacing.md,
    },

    list: {
        gap: spacing.md,
    },

    center: {
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.sm,
        marginTop: spacing.huge,
    },
});
