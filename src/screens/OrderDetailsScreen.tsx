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
import AppCard from "@/components/AppCard";
import AppText from "@/components/AppText";
import OrderStatusPicker from "@/components/OrderStatusPicker";
import Screen from "@/components/Screen";

import { findCustomerById } from "@/services/customerService";

import {
    changeOrderStatus,
    findOrderById,
    getItemsForOrder,
    removeOrder,
} from "@/services/orderService";

import { colors } from "@/constants/theme";
import { Customer } from "@/types/customer";
import { Order, OrderItem, OrderStatus } from "@/types/order";

export default function OrderDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();

    const [order, setOrder] = useState<Order | null>(null);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [items, setItems] = useState<OrderItem[]>([]);

    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadOrder = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const orderId = Number(id);

            if (!Number.isInteger(orderId)) {
                throw new Error("Invalid order ID.");
            }

            const orderResult = await findOrderById(orderId);

            if (!orderResult) {
                throw new Error("Order not found.");
            }

            const [customerResult, itemsResult] = await Promise.all([
                findCustomerById(orderResult.customerId),
                getItemsForOrder(orderId),
            ]);

            setOrder(orderResult);
            setCustomer(customerResult);
            setItems(itemsResult);
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to load order."
            );
        } finally {
            setLoading(false);
        }
    }, [id]);

    useFocusEffect(
        useCallback(() => {
            loadOrder();
        }, [loadOrder])
    );

    async function handleStatusChange(status: OrderStatus) {
        if (!order || status === order.status) {
            return;
        }

        try {
            setUpdatingStatus(true);

            await changeOrderStatus(order.id, status);

            // Reflect the change locally instead of a full reload - the
            // rest of the screen's data (items, customer) hasn't changed.
            setOrder({ ...order, status });
        } catch (error) {
            Alert.alert(
                "Failed to update status",
                error instanceof Error
                    ? error.message
                    : "Something went wrong."
            );
        } finally {
            setUpdatingStatus(false);
        }
    }

    async function handleDelete() {
        if (!order) {
            return;
        }

        Alert.alert(
            "Delete Order",
            `Are you sure you want to delete Receipt #${order.receiptNumber}?`,
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setDeleting(true);
                            setError(null);

                            await removeOrder(order.id);

                            router.back();
                        } catch (error) {
                            const message =
                                error instanceof Error
                                    ? error.message
                                    : "Failed to delete order.";

                            setError(message);

                            Alert.alert("Cannot Delete Order", message);
                        } finally {
                            setDeleting(false);
                        }
                    },
                },
            ]
        );
    }

    if (loading) {
        return (
            <Screen>
                <View style={styles.center}>
                    <ActivityIndicator size="large" />

                    <AppText variant="caption">
                        Loading order...
                    </AppText>
                </View>
            </Screen>
        );
    }

    if (!order) {
        return (
            <Screen>
                <View style={styles.center}>
                    <AppText variant="secondary">
                        {error ?? "Order not found"}
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
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <AppText variant="title">
                        Receipt #{order.receiptNumber}
                    </AppText>

                    <AppText
                        variant="secondary"
                        onPress={() =>
                            customer &&
                            router.push({
                                pathname: "/customer-details",
                                params: { id: customer.id.toString() },
                            })
                        }
                    >
                        {customer?.name ?? "Unknown customer"}
                        {customer?.phone ? ` · ${customer.phone}` : ""}
                    </AppText>
                </View>

                <AppCard>
                    <View style={styles.section}>
                        <AppText variant="caption">Status</AppText>

                        <OrderStatusPicker
                            value={order.status}
                            onChange={handleStatusChange}
                            disabled={updatingStatus}
                        />
                    </View>

                    <View style={styles.row}>
                        <AppText variant="caption">Order Date</AppText>
                        <AppText variant="body">{order.orderDate}</AppText>
                    </View>

                    <View style={styles.row}>
                        <AppText variant="caption">Delivery Date</AppText>
                        <AppText variant="body">
                            {order.deliveryDate}
                        </AppText>
                    </View>

                    {order.tailoringDetails ? (
                        <View style={styles.section}>
                            <AppText variant="caption">
                                Tailoring Details
                            </AppText>

                            <AppText variant="body">
                                {order.tailoringDetails}
                            </AppText>
                        </View>
                    ) : null}
                </AppCard>

                <AppCard>
                    <AppText variant="secondary">Items</AppText>

                    {items.map((item, index) => (
                        <View key={item.id} style={styles.item}>
                            <View style={styles.itemHeader}>
                                <AppText variant="body">
                                    {index + 1}) {item.name}
                                </AppText>

                                <AppText variant="body">
                                    Qty. {item.quantity}
                                </AppText>
                            </View>

                            <View style={styles.itemHeader}>
                                <AppText variant="caption">
                                    {item.unitPrice} each
                                </AppText>

                                <AppText variant="caption">
                                    Total: {item.quantity * item.unitPrice}
                                </AppText>
                            </View>

                            {item.designType === "design" ||
                                item.buttonType === "fancy" ? (
                                <AppText variant="caption">
                                    {item.designType === "design"
                                        ? "Custom design"
                                        : null}
                                    {item.designType === "design" &&
                                        item.buttonType === "fancy"
                                        ? " · "
                                        : null}
                                    {item.buttonType === "fancy"
                                        ? "Fancy buttons"
                                        : null}
                                </AppText>
                            ) : null}

                            {item.notes ? (
                                <AppText variant="caption">
                                    {item.notes}
                                </AppText>
                            ) : null}
                        </View>
                    ))}
                </AppCard>

                <AppCard>
                    <AppText variant="secondary">Payment</AppText>

                    {order.discount > 0 || order.addition > 0 ? (
                        <View style={styles.row}>
                            <AppText variant="body">Subtotal</AppText>
                            <AppText variant="body">
                                {items.reduce(
                                    (sum, item) =>
                                        sum +
                                        item.quantity * item.unitPrice,
                                    0
                                )}
                            </AppText>
                        </View>
                    ) : null}

                    {order.discount > 0 ? (
                        <View style={styles.row}>
                            <AppText variant="body">Discount</AppText>
                            <AppText variant="body">
                                -{order.discount}
                            </AppText>
                        </View>
                    ) : null}

                    {order.addition > 0 ? (
                        <View style={styles.row}>
                            <AppText variant="body">Addition</AppText>
                            <AppText variant="body">
                                +{order.addition}
                            </AppText>
                        </View>
                    ) : null}

                    <View style={styles.row}>
                        <AppText variant="body">Total</AppText>
                        <AppText variant="body">{order.total}</AppText>
                    </View>

                    <View style={styles.row}>
                        <AppText variant="body">Paid</AppText>
                        <AppText variant="body">{order.paid}</AppText>
                    </View>

                    <View style={styles.row}>
                        <AppText variant="secondary">Remaining</AppText>
                        <AppText variant="secondary">
                            {order.remaining}
                        </AppText>
                    </View>
                </AppCard>

                {order.notes ? (
                    <AppCard>
                        <AppText variant="caption">Notes</AppText>
                        <AppText variant="body">{order.notes}</AppText>
                    </AppCard>
                ) : null}

                {error ? (
                    <AppText variant="caption">{error}</AppText>
                ) : null}

                <View style={styles.actionsGroup}>
                    <AppButton
                        title="View Receipt"
                        onPress={() =>
                            router.push({
                                pathname: "/receipt",
                                params: { id: order.id.toString() },
                            })
                        }
                    />

                    <View style={styles.actions}>
                        <AppButton
                            title="Edit Order"
                            variant="outline"
                            style={styles.secondaryButton}
                            onPress={() =>
                                router.push({
                                    pathname: "/edit-order",
                                    params: { id: order.id.toString() },
                                })
                            }
                            disabled={deleting}
                        />

                        <AppButton
                            title={deleting ? "Deleting..." : "Delete Order"}
                            onPress={handleDelete}
                            disabled={deleting}
                            variant="danger"
                            style={styles.secondaryButton}
                        />
                    </View>
                </View>
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    content: {
        paddingBottom: 32,
        gap: 16,
    },

    header: {
        gap: 4,
    },

    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },

    section: {
        gap: 4,
        marginTop: 12,
    },

    item: {
        gap: 4,
        paddingTop: 12,
        marginTop: 12,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },

    itemHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    actionsGroup: {
        gap: 12,
    },

    actions: {
        flexDirection: "row",
        gap: 12,
    },

    secondaryButton: {
        flex: 1,
    },

    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 12,
    },
});
