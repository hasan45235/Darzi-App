import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";

import DateTimePicker from "@react-native-community/datetimepicker";

import {
    router,
    useLocalSearchParams,
} from "expo-router";

import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";
import AppInput from "@/components/AppInput";
import AppText from "@/components/AppText";
import OrderStatusPicker from "@/components/OrderStatusPicker";
import Screen from "@/components/Screen";

import { findCustomerById } from "@/services/customerService";

import {
    findOrderById,
    getItemsForOrder,
    NewOrderItem,
    updateCompleteOrder,
} from "@/services/orderService";

import {
    getBasicPantPrice,
    getBasicShirtPrice,
    getBasicSuitPrice,
} from "@/services/settingsService";

import { colors } from "@/constants/theme";
import { Customer } from "@/types/customer";
import { ButtonType, DesignType, Order, OrderStatus } from "@/types/order";

type DraftItem = NewOrderItem & {
    id: string;
};

type QuickFillPreset = {
    label: string;
    name: string;
    price: number;
};

function createEmptyItem(preset?: {
    name: string;
    unitPrice: number;
}): DraftItem {
    return {
        id: `${Date.now()}-${Math.random()}`,
        name: preset?.name ?? "",
        quantity: 1,
        unitPrice: preset?.unitPrice ?? 0,
        notes: "",
        designType: "simple",
        buttonType: "simple",
    };
}

function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function displayDate(dateString: string): string {
    if (!dateString) {
        return "";
    }

    const [year, month, day] = dateString.split("-");

    return `${day}/${month}/${year}`;
}

export default function EditOrderScreen() {
    const params = useLocalSearchParams<{ id: string }>();
    const orderId = Number(params.id);

    const [order, setOrder] = useState<Order | null>(null);
    const [customer, setCustomer] = useState<Customer | null>(null);

    const [deliveryDate, setDeliveryDate] = useState("");
    const [status, setStatus] = useState<OrderStatus>("waiting");
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [tailoringDetails, setTailoringDetails] = useState("");
    const [notes, setNotes] = useState("");
    const [items, setItems] = useState<DraftItem[]>([]);
    const [paid, setPaid] = useState("");
    const [discount, setDiscount] = useState("");
    const [addition, setAddition] = useState("");

    const [quickFillPresets, setQuickFillPresets] =
        useState<QuickFillPreset[]>([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function load() {
            try {
                if (!Number.isInteger(orderId)) {
                    throw new Error("Invalid order.");
                }

                const [
                    orderResult,
                    itemsResult,
                    suitPrice,
                    pantPrice,
                    shirtPrice,
                ] = await Promise.all([
                    findOrderById(orderId),
                    getItemsForOrder(orderId),
                    getBasicSuitPrice(),
                    getBasicPantPrice(),
                    getBasicShirtPrice(),
                ]);

                if (!orderResult) {
                    throw new Error("Order not found.");
                }

                const customerResult = await findCustomerById(
                    orderResult.customerId
                );

                setOrder(orderResult);
                setCustomer(customerResult);
                setDeliveryDate(orderResult.deliveryDate);
                setStatus(orderResult.status);
                setTailoringDetails(orderResult.tailoringDetails ?? "");
                setNotes(orderResult.notes ?? "");
                setPaid(String(orderResult.paid));
                setDiscount(
                    orderResult.discount ? String(orderResult.discount) : ""
                );
                setAddition(
                    orderResult.addition ? String(orderResult.addition) : ""
                );

                setItems(
                    itemsResult.map((item) => ({
                        id: item.id.toString(),
                        name: item.name,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        notes: item.notes ?? "",
                        designType: item.designType,
                        buttonType: item.buttonType,
                    }))
                );

                setQuickFillPresets([
                    { label: "+ Suit", name: "Suit", price: suitPrice },
                    { label: "+ Pant", name: "Pant", price: pantPrice },
                    { label: "+ Shirt", name: "Shirt", price: shirtPrice },
                ]);
            } catch (error) {
                console.error("Failed to load order for editing:", error);

                Alert.alert(
                    "Error",
                    error instanceof Error
                        ? error.message
                        : "Failed to load order."
                );

                router.back();
            } finally {
                setLoading(false);
            }
        }

        load();
    }, [orderId]);

    const subtotal = useMemo(() => {
        return items.reduce(
            (sum, item) => sum + item.quantity * item.unitPrice,
            0
        );
    }, [items]);

    const discountAmount = Number(discount) || 0;
    const additionAmount = Number(addition) || 0;

    const total = Math.max(subtotal - discountAmount + additionAmount, 0);

    const paidAmount = Number(paid) || 0;
    const remaining = Math.max(total - paidAmount, 0);

    function updateItem(id: string, changes: Partial<DraftItem>) {
        setItems((current) =>
            current.map((item) =>
                item.id === id ? { ...item, ...changes } : item
            )
        );
    }

    function removeItem(id: string) {
        if (items.length === 1) {
            return;
        }

        setItems((current) => current.filter((item) => item.id !== id));
    }

    async function handleSave() {
        if (!deliveryDate) {
            Alert.alert(
                "Delivery date required",
                "Please select a delivery date."
            );
            return;
        }

        if (items.length === 0) {
            Alert.alert("Items required", "Add at least one item.");
            return;
        }

        const invalidItem = items.find(
            (item) =>
                !item.name.trim() ||
                item.quantity <= 0 ||
                item.unitPrice < 0
        );

        if (invalidItem) {
            Alert.alert(
                "Invalid item",
                "Please check every item's name, quantity, and price."
            );
            return;
        }

        if (discountAmount < 0 || additionAmount < 0) {
            Alert.alert(
                "Invalid amount",
                "Discount and addition cannot be negative."
            );
            return;
        }

        if (paidAmount > total) {
            Alert.alert(
                "Invalid payment",
                "Paid amount cannot be greater than the total."
            );
            return;
        }

        try {
            setSaving(true);

            await updateCompleteOrder(orderId, {
                deliveryDate,
                status,
                tailoringDetails,
                notes,
                items: items.map(
                    ({
                        name,
                        quantity,
                        unitPrice,
                        notes: itemNotes,
                        designType,
                        buttonType,
                    }) => ({
                        name,
                        quantity,
                        unitPrice,
                        notes: itemNotes,
                        designType,
                        buttonType,
                    })
                ),
                paid: paidAmount,
                discount: discountAmount,
                addition: additionAmount,
            });

            router.replace({
                pathname: "/order-details",
                params: { id: orderId.toString() },
            });
        } catch (error) {
            console.error("Failed to update order:", error);

            Alert.alert(
                "Failed to save changes",
                error instanceof Error
                    ? error.message
                    : "Something went wrong while saving the order."
            );
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <Screen>
                <View style={styles.center}>
                    <ActivityIndicator size="large" />

                    <AppText variant="caption">Loading order...</AppText>
                </View>
            </Screen>
        );
    }

    if (!order) {
        return null;
    }

    return (
        <Screen>
            <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.header}>
                    <AppText variant="title">Edit Order</AppText>

                    <AppText variant="caption">
                        Receipt #{order.receiptNumber} ·{" "}
                        {customer?.name ?? "Unknown customer"}
                    </AppText>
                </View>

                <AppCard>
                    <AppText variant="secondary">Order Information</AppText>

                    <View style={styles.field}>
                        <AppText variant="caption">Status</AppText>

                        <OrderStatusPicker
                            value={status}
                            onChange={setStatus}
                            disabled={saving}
                        />
                    </View>

                    <View style={styles.field}>
                        <AppText variant="caption">Delivery Date *</AppText>

                        <Pressable
                            style={styles.dateButton}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <AppText variant="body">
                                {deliveryDate
                                    ? displayDate(deliveryDate)
                                    : "Select delivery date"}
                            </AppText>
                        </Pressable>

                        {showDatePicker ? (
                            <DateTimePicker
                                value={
                                    deliveryDate
                                        ? new Date(`${deliveryDate}T12:00:00`)
                                        : new Date()
                                }
                                mode="date"
                                onValueChange={(_event, selectedDate) => {
                                    setShowDatePicker(false);

                                    if (selectedDate) {
                                        setDeliveryDate(
                                            formatDate(selectedDate)
                                        );
                                    }
                                }}
                            />
                        ) : null}
                    </View>
                </AppCard>

                <AppCard>
                    <AppText variant="secondary">Tailoring Details</AppText>

                    <AppInput
                        placeholder="e.g. Vol18, Vol21 ka 16"
                        value={tailoringDetails}
                        onChangeText={setTailoringDetails}
                        multiline
                    />
                </AppCard>

                <AppCard>
                    <View style={styles.sectionHeader}>
                        <AppText variant="secondary">Items</AppText>

                        <AppButton
                            title="Add Item"
                            onPress={() =>
                                setItems((current) => [
                                    ...current,
                                    createEmptyItem(),
                                ])
                            }
                        />
                    </View>

                    <View style={styles.quickFillRow}>
                        {quickFillPresets.map((preset) => (
                            <Pressable
                                key={preset.label}
                                style={styles.quickFillChip}
                                onPress={() =>
                                    setItems((current) => [
                                        ...current,
                                        createEmptyItem({
                                            name: preset.name,
                                            unitPrice: preset.price,
                                        }),
                                    ])
                                }
                            >
                                <AppText variant="caption">
                                    {preset.label}
                                </AppText>
                            </Pressable>
                        ))}
                    </View>

                    {items.map((item, index) => (
                        <View key={item.id} style={styles.item}>
                            <View style={styles.itemHeader}>
                                <AppText variant="body">
                                    Item {index + 1}
                                </AppText>

                                {items.length > 1 ? (
                                    <Pressable
                                        onPress={() => removeItem(item.id)}
                                    >
                                        <AppText variant="caption">
                                            Remove
                                        </AppText>
                                    </Pressable>
                                ) : null}
                            </View>

                            <AppInput
                                placeholder="Item name"
                                value={item.name}
                                onChangeText={(value) =>
                                    updateItem(item.id, { name: value })
                                }
                            />

                            <View style={styles.row}>
                                <View style={styles.half}>
                                    <AppInput
                                        placeholder="Quantity"
                                        value={String(item.quantity)}
                                        keyboardType="decimal-pad"
                                        onChangeText={(value) => {
                                            const number = Number(value);

                                            updateItem(item.id, {
                                                quantity: Number.isFinite(
                                                    number
                                                )
                                                    ? number
                                                    : 0,
                                            });
                                        }}
                                    />
                                </View>

                                <View style={styles.half}>
                                    <AppInput
                                        placeholder="Unit price"
                                        value={
                                            item.unitPrice === 0
                                                ? ""
                                                : String(item.unitPrice)
                                        }
                                        keyboardType="decimal-pad"
                                        onChangeText={(value) => {
                                            const number = Number(value);

                                            updateItem(item.id, {
                                                unitPrice: Number.isFinite(
                                                    number
                                                )
                                                    ? number
                                                    : 0,
                                            });
                                        }}
                                    />
                                </View>
                            </View>

                            <AppText variant="caption">
                                Item total: {item.quantity * item.unitPrice}
                            </AppText>

                            <AppText variant="caption">Design</AppText>

                            <View style={styles.designTypeRow}>
                                {(["simple", "design"] as DesignType[]).map(
                                    (option) => {
                                        const isActive =
                                            (item.designType ?? "simple") ===
                                            option;

                                        return (
                                            <Pressable
                                                key={option}
                                                style={[
                                                    styles.designTypeChip,
                                                    isActive &&
                                                    styles.designTypeChipActive,
                                                ]}
                                                onPress={() =>
                                                    updateItem(item.id, {
                                                        designType: option,
                                                    })
                                                }
                                            >
                                                <AppText
                                                    variant="caption"
                                                    style={
                                                        isActive
                                                            ? styles.designTypeTextActive
                                                            : undefined
                                                    }
                                                >
                                                    {option === "simple"
                                                        ? "Simple"
                                                        : "Design"}
                                                </AppText>
                                            </Pressable>
                                        );
                                    }
                                )}
                            </View>

                            <AppText variant="caption">Buttons</AppText>

                            <View style={styles.designTypeRow}>
                                {(["simple", "fancy"] as ButtonType[]).map(
                                    (option) => {
                                        const isActive =
                                            (item.buttonType ?? "simple") ===
                                            option;

                                        return (
                                            <Pressable
                                                key={option}
                                                style={[
                                                    styles.designTypeChip,
                                                    isActive &&
                                                    styles.designTypeChipActive,
                                                ]}
                                                onPress={() =>
                                                    updateItem(item.id, {
                                                        buttonType: option,
                                                    })
                                                }
                                            >
                                                <AppText
                                                    variant="caption"
                                                    style={
                                                        isActive
                                                            ? styles.designTypeTextActive
                                                            : undefined
                                                    }
                                                >
                                                    {option === "simple"
                                                        ? "Simple"
                                                        : "Fancy"}
                                                </AppText>
                                            </Pressable>
                                        );
                                    }
                                )}
                            </View>

                            <AppInput
                                placeholder="Item notes (optional)"
                                value={item.notes ?? ""}
                                onChangeText={(value) =>
                                    updateItem(item.id, { notes: value })
                                }
                                multiline
                            />
                        </View>
                    ))}
                </AppCard>

                <AppCard>
                    <AppText variant="secondary">Payment</AppText>

                    <View style={styles.totalRow}>
                        <AppText variant="body">Subtotal</AppText>
                        <AppText variant="body">{subtotal}</AppText>
                    </View>

                    <View style={styles.row}>
                        <View style={styles.half}>
                            <AppInput
                                label="Discount"
                                placeholder="0"
                                value={discount}
                                onChangeText={setDiscount}
                                keyboardType="decimal-pad"
                            />
                        </View>

                        <View style={styles.half}>
                            <AppInput
                                label="Addition"
                                placeholder="0"
                                value={addition}
                                onChangeText={setAddition}
                                keyboardType="decimal-pad"
                            />
                        </View>
                    </View>

                    <View style={styles.totalRow}>
                        <AppText variant="body">Total</AppText>
                        <AppText variant="secondary">{total}</AppText>
                    </View>

                    <AppInput
                        label="Paid"
                        placeholder="Paid amount"
                        value={paid}
                        onChangeText={setPaid}
                        keyboardType="decimal-pad"
                    />

                    <View style={styles.totalRow}>
                        <AppText variant="body">Remaining</AppText>
                        <AppText variant="secondary">{remaining}</AppText>
                    </View>
                </AppCard>

                <AppCard>
                    <AppText variant="secondary">Order Notes</AppText>

                    <AppInput
                        placeholder="Optional order notes"
                        value={notes}
                        onChangeText={setNotes}
                        multiline
                    />
                </AppCard>

                <View style={styles.actions}>
                    <AppButton
                        title="Cancel"
                        variant="outline"
                        onPress={() => router.back()}
                        disabled={saving}
                    />

                    <AppButton
                        title={saving ? "Saving..." : "Save Changes"}
                        onPress={handleSave}
                        disabled={saving}
                    />
                </View>
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    content: {
        gap: 16,
        paddingBottom: 32,
    },

    header: {
        gap: 4,
    },

    field: {
        gap: 6,
        marginTop: 16,
    },

    dateButton: {
        minHeight: 48,
        justifyContent: "center",
        paddingHorizontal: 16,
        borderWidth: 1,
        borderRadius: 10,
        borderColor: colors.border,
        backgroundColor: colors.surface,
    },

    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        marginBottom: 16,
    },

    quickFillRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 8,
    },

    quickFillChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: colors.primary,
        backgroundColor: colors.primaryLight,
    },

    item: {
        gap: 10,
        paddingTop: 16,
        marginTop: 16,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },

    itemHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    row: {
        flexDirection: "row",
        gap: 12,
    },

    half: {
        flex: 1,
    },

    designTypeRow: {
        flexDirection: "row",
        gap: 8,
    },

    designTypeChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
    },

    designTypeChipActive: {
        borderColor: colors.primary,
        backgroundColor: colors.primary,
    },

    designTypeTextActive: {
        color: colors.white,
    },

    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 12,
    },

    actions: {
        flexDirection: "row",
        gap: 12,
    },

    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
    },
});
