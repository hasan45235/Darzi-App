import {
    useCallback,
    useState,
} from "react";

import { Ionicons } from "@expo/vector-icons";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    View,
} from "react-native";

import {
    router,
    useFocusEffect,
    useLocalSearchParams,
} from "expo-router";

import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";
import AppText from "@/components/AppText";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import Screen from "@/components/Screen";

import {
    findCustomerById,
} from "@/services/customerService";

import {
    getCustomerOrders,
} from "@/services/orderService";

import { colors } from "@/constants/theme";
import { ORDER_STATUS_COLORS } from "@/constants/orderStatus";
import { Customer } from "@/types/customer";
import { Order } from "@/types/order";

export default function CustomerOrdersScreen() {
    const params =
        useLocalSearchParams<{ id: string }>();

    const customerId = Number(params.id);

    const [customer, setCustomer] =
        useState<Customer | null>(null);

    const [orders, setOrders] =
        useState<Order[]>([]);

    const [loading, setLoading] =
        useState(true);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);

            if (!Number.isInteger(customerId)) {
                throw new Error("Invalid customer ID.");
            }

            const [
                customerResult,
                ordersResult,
            ] = await Promise.all([
                findCustomerById(customerId),
                getCustomerOrders(customerId),
            ]);

            setCustomer(customerResult);
            setOrders(ordersResult);
        } catch (error) {
            console.error(
                "Failed to load customer orders:",
                error
            );
        } finally {
            setLoading(false);
        }
    }, [customerId]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    if (loading) {
        return (
            <Screen>
                <View style={styles.center}>
                    <ActivityIndicator size="large" />

                    <AppText variant="caption">
                        Loading orders...
                    </AppText>
                </View>
            </Screen>
        );
    }

    return (
        <Screen>
            <View style={styles.header}>
                <View style={styles.headerText}>
                    <AppText variant="title">
                        Orders
                    </AppText>

                    <AppText variant="caption">
                        {customer?.name ?? "Customer"}
                    </AppText>
                </View>

                <AppButton
                    title="Create Order"
                    variant="outline"
                    icon={
                        <Ionicons
                            name="add"
                            size={18}
                            color={colors.primary}
                        />
                    }
                    onPress={() =>
                        router.push({
                            pathname: "/create-order",
                            params: {
                                customerId:
                                    customerId.toString(),
                            },
                        })
                    }
                />
            </View>

            {orders.length === 0 ? (
                <View style={styles.center}>
                    <AppText variant="secondary">
                        No orders yet
                    </AppText>

                    <AppText variant="caption">
                        Create the first order for this customer.
                    </AppText>
                </View>
            ) : (
                <FlatList
                    data={orders}
                    keyExtractor={(item) =>
                        item.id.toString()
                    }
                    contentContainerStyle={styles.list}
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
                            style={{
                                borderLeftWidth: 3,
                                borderLeftColor:
                                    ORDER_STATUS_COLORS[item.status].text,
                            }}
                        >
                            <View style={styles.orderHeader}>
                                <AppText variant="secondary">
                                    Receipt #{item.receiptNumber}
                                </AppText>

                                <AppText variant="caption">
                                    {item.orderDate}
                                </AppText>
                            </View>

                            <OrderStatusBadge
                                status={item.status}
                                style={styles.statusBadge}
                            />

                            <AppText variant="body">
                                Delivery: {item.deliveryDate}
                            </AppText>

                            <AppText variant="body">
                                Total: {item.total}
                            </AppText>

                            {item.remaining > 0 ? (
                                <AppText variant="caption">
                                    Remaining: {item.remaining}
                                </AppText>
                            ) : null}
                        </AppCard>
                    )}
                />
            )}
        </Screen>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        marginBottom: 20,
    },

    headerText: {
        flex: 1,
    },

    list: {
        gap: 12,
        paddingBottom: 24,
    },

    orderHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        marginBottom: 8,
    },

    statusBadge: {
        marginBottom: 8,
    },

    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
    },
});