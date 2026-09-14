import {
    useCallback,
    useState,
} from "react";

import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    View,
} from "react-native";

import {
    router,
    useFocusEffect,
} from "expo-router";

import AppCard from "@/components/AppCard";
import AppText from "@/components/AppText";
import Screen from "@/components/Screen";

import {
    getOrders,
} from "@/services/orderService";

import { Order } from "@/types/order";

export default function OrdersScreen() {
    const [orders, setOrders] =
        useState<Order[]>([]);

    const [loading, setLoading] =
        useState(true);

    const loadOrders = useCallback(async () => {
        try {
            setLoading(true);

            const result = await getOrders();

            setOrders(result);
        } catch (error) {
            console.error(
                "Failed to load orders:",
                error
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadOrders();
        }, [loadOrders])
    );

    return (
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

            {loading ? (
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
                        >
                            <AppText variant="secondary">
                                Receipt #{item.receiptNumber}
                            </AppText>

                            <AppText variant="body">
                                Order date: {item.orderDate}
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
        </Screen>
    );
}

const styles = StyleSheet.create({
    header: {
        marginBottom: 20,
    },

    list: {
        gap: 12,
        paddingBottom: 24,
    },

    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
    },
});