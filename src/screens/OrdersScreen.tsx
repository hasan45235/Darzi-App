import {
    useCallback,
    useMemo,
    useState,
} from "react";

import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
    router,
    useFocusEffect,
} from "expo-router";

import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";
import AppInput from "@/components/AppInput";
import AppText from "@/components/AppText";
import BottomNav from "@/components/BottomNav";
import FloatingActionButton from "@/components/FloatingActionButton";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import Screen from "@/components/Screen";

import { getCustomers } from "@/services/customerService";
import { getOrders } from "@/services/orderService";

import { colors } from "@/constants/theme";
import { Customer } from "@/types/customer";
import { Order } from "@/types/order";

export default function OrdersScreen() {
    const [orders, setOrders] =
        useState<Order[]>([]);

    const [customers, setCustomers] =
        useState<Customer[]>([]);

    const [search, setSearch] = useState("");

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    const insets = useSafeAreaInsets();

    // `silent` powers pull-to-refresh: same fetch, but it drives the
    // small RefreshControl spinner instead of replacing the whole
    // screen with the full-page loading state.
    const loadOrders = useCallback(async (opts?: { silent?: boolean }) => {
        try {
            if (opts?.silent) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError(null);

            // Settled (not all-or-nothing): the customer list here is
            // only used for search/display, so a failure there should
            // never blank out the actual orders list.
            const [ordersResult, customersResult] =
                await Promise.allSettled([
                    getOrders(),
                    getCustomers(),
                ]);

            if (ordersResult.status === "fulfilled") {
                setOrders(ordersResult.value);
            } else {
                throw ordersResult.reason;
            }

            if (customersResult.status === "fulfilled") {
                setCustomers(customersResult.value);
            } else {
                console.error(
                    "Failed to load customers for order search:",
                    customersResult.reason
                );
                setCustomers([]);
            }
        } catch (error) {
            console.error(
                "Failed to load orders:",
                error
            );

            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to load orders."
            );
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
            loadOrders();
        }, [loadOrders])
    );

    function handleRefresh() {
        loadOrders({ silent: true });
    }

    const customerById = useMemo(() => {
        const map = new Map<number, Customer>();

        for (const customer of customers) {
            map.set(customer.id, customer);
        }

        return map;
    }, [customers]);

    const filteredOrders = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) {
            return orders;
        }

        return orders.filter((order) => {
            const orderCustomer = customerById.get(order.customerId);

            return (
                order.receiptNumber.toString().includes(query) ||
                orderCustomer?.name.toLowerCase().includes(query) ||
                orderCustomer?.phone.toLowerCase().includes(query) ||
                orderCustomer?.customerNumber
                    .toString()
                    .includes(query)
            );
        });
    }, [orders, search, customerById]);

    // Orders always belong to a customer, so "new order" starts by
    // picking one - same flow as the "New Order" quick action on Home.
    function handleNewOrder() {
        Alert.alert(
            "Select a Customer",
            "Choose the customer this order is for, then tap " +
            "\"Create Order\" from their orders.",
            [
                {
                    text: "OK",
                    onPress: () => router.push("/customers"),
                },
            ]
        );
    }

    return (
        <View style={[styles.screenWrapper, { paddingTop: insets.top }]}>
        <Screen>
            <View style={styles.header}>
                <AppText variant="title">
                    Orders
                </AppText>

                <AppText variant="caption">
                    {orders.length} order
                    {orders.length === 1 ? "" : "s"}
                </AppText>
            </View>

            {orders.length > 0 ? (
                <AppInput
                    placeholder="Search by receipt #, name, or phone..."
                    value={search}
                    onChangeText={setSearch}
                />
            ) : null}

            {error ? (
                <View style={styles.center}>
                    <AppText variant="secondary">
                        Couldn't load orders
                    </AppText>

                    <AppText variant="caption">{error}</AppText>

                    <AppButton
                        title="Retry"
                        onPress={loadOrders}
                    />
                </View>
            ) : loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" />

                    <AppText variant="caption">
                        Loading orders...
                    </AppText>
                </View>
            ) : orders.length === 0 ? (
                <View style={styles.center}>
                    <AppText variant="secondary">
                        No orders yet
                    </AppText>

                    <AppText variant="caption">
                        Orders will appear here after they are created.
                    </AppText>
                </View>
            ) : filteredOrders.length === 0 ? (
                <View style={styles.center}>
                    <AppText variant="secondary">
                        No orders found
                    </AppText>

                    <AppText variant="caption">
                        Try a different receipt number, name, or phone.
                    </AppText>
                </View>
            ) : (
                <FlatList
                    data={filteredOrders}
                    keyExtractor={(item) =>
                        item.id.toString()
                    }
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor={colors.primary}
                            colors={[colors.primary]}
                        />
                    }
                    renderItem={({ item }) => (
                        <AppCard
                            onPress={() =>
                                router.push({
                                    pathname: "/order-details",
                                    params: {
                                        id: item.id.toString(),
                                    },
                                })
                            }
                        >
                            <View style={styles.orderHeader}>
                                <AppText variant="secondary">
                                    Receipt #{item.receiptNumber}
                                </AppText>

                                <OrderStatusBadge status={item.status} />
                            </View>

                            <AppText variant="body">
                                {customerById.get(item.customerId)?.name ??
                                    "Unknown customer"}
                            </AppText>

                            <AppText variant="body">
                                Delivery date: {item.deliveryDate}
                            </AppText>

                            <AppText variant="body">
                                Total: {item.total}
                            </AppText>
                        </AppCard>
                    )}
                />
            )}

            <FloatingActionButton
                label="New order"
                onPress={handleNewOrder}
            />
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
        marginBottom: 20,
    },

    list: {
        gap: 12,
        // Extra room so the last card can scroll clear of the FAB
        // instead of sitting underneath it.
        paddingBottom: 96,
    },

    orderHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        marginBottom: 8,
    },

    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
    },
});