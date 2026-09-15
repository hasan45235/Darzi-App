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
import AppCard from "@/components/AppCard";
import AppText from "@/components/AppText";
import IconActionButton from "@/components/IconActionButton";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import Screen from "@/components/Screen";

import { useConfirm } from "@/providers/ConfirmDialogProvider";

import { findCustomerById } from "@/services/customerService";

import {
    findOrderById,
    getItemsForOrder,
    removeOrder,
} from "@/services/orderService";

import { colors } from "@/constants/theme";
import { Customer } from "@/types/customer";
import { Order, OrderItem } from "@/types/order";

export default function OrderDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();

    const [order, setOrder] = useState<Order | null>(null);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [items, setItems] = useState<OrderItem[]>([]);

    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const confirm = useConfirm();

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

    async function handleDelete() {
        if (!order) {
            return;
        }

        const confirmed = await confirm({
            title: "Delete Order",
            message: `Are you sure you want to delete Receipt #${order.receiptNumber}?`,
            confirmText: "Delete",
            tone: "danger",
        });

        if (!confirmed) {
            return;
        }

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
                    <View style={styles.headerText}>
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

                    {/* Edit/Delete sit beside the title as small icon
                    buttons - a real detail-page header pattern - instead
                    of full-width text buttons stacked at the bottom
                    below "View Receipt". */}
                    <View style={styles.headerActions}>
                        <IconActionButton
                            icon="pencil"
                            label="Edit order"
                            onPress={() =>
                                router.push({
                                    pathname: "/edit-order",
                                    params: { id: order.id.toString() },
                                })
                            }
                            disabled={deleting}
                        />

                        <IconActionButton
                            icon="trash-outline"
                            label="Delete order"
                            tone="danger"
                            loading={deleting}
                            onPress={handleDelete}
                        />
                    </View>
                </View>

                <AppCard>
                    {/* Read-only here on purpose - this is a detail page,
                    not an edit page. Changing status only from Edit Order
                    avoids the confusing "tapped a chip, order silently
                    changed" bug this used to have. */}
                    <View style={styles.section}>
                        <AppText variant="caption">Status</AppText>

                        <OrderStatusBadge status={order.status} />
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

                <AppButton
                    title="View Receipt"
                    icon={
                        <Ionicons
                            name="receipt-outline"
                            size={18}
                            color={colors.white}
                        />
                    }
                    onPress={() =>
                        router.push({
                            pathname: "/receipt",
                            params: { id: order.id.toString() },
                        })
                    }
                />
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
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 12,
    },

    headerText: {
        flex: 1,
        gap: 4,
    },

    headerActions: {
        flexDirection: "row",
        gap: 8,
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

    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 12,
    },
});
