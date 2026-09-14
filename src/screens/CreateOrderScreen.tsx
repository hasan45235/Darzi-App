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
import Screen from "@/components/Screen";

import {
    findCustomerById,
} from "@/services/customerService";

import {
    createCompleteOrder,
    getNextOrderReceiptNumber,
    NewOrderItem,
} from "@/services/orderService";

import { Customer } from "@/types/customer";

type DraftItem = NewOrderItem & {
    id: string;
};

function createEmptyItem(): DraftItem {
    return {
        id: `${Date.now()}-${Math.random()}`,
        name: "",
        quantity: 1,
        unitPrice: 0,
        notes: "",
    };
}

function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function displayDate(dateString: string): string {
    if (!dateString) {
        return "";
    }

    const [year, month, day] =
        dateString.split("-");

    return `${day}/${month}/${year}`;
}

export default function CreateOrderScreen() {
    const params =
        useLocalSearchParams<{
            customerId?: string;
        }>();

    const customerId = Number(
        params.customerId
    );

    const [customer, setCustomer] =
        useState<Customer | null>(null);

    const [receiptNumber, setReceiptNumber] =
        useState<number | null>(null);

    const [orderDate] = useState(
        formatDate(new Date())
    );

    const [deliveryDate, setDeliveryDate] =
        useState("");

    const [showDatePicker, setShowDatePicker] =
        useState(false);

    const [tailoringDetails, setTailoringDetails] =
        useState("");

    const [notes, setNotes] =
        useState("");

    const [items, setItems] =
        useState<DraftItem[]>([
            createEmptyItem(),
        ]);

    const [paid, setPaid] =
        useState("");

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    useEffect(() => {
        async function load() {
            try {
                if (!Number.isInteger(customerId)) {
                    throw new Error(
                        "Invalid customer."
                    );
                }

                const [
                    customerResult,
                    nextReceipt,
                ] = await Promise.all([
                    findCustomerById(customerId),
                    getNextOrderReceiptNumber(),
                ]);

                if (!customerResult) {
                    throw new Error(
                        "Customer not found."
                    );
                }

                setCustomer(customerResult);
                setReceiptNumber(nextReceipt);
            } catch (error) {
                console.error(
                    "Failed to prepare order:",
                    error
                );

                Alert.alert(
                    "Error",
                    error instanceof Error
                        ? error.message
                        : "Failed to prepare order."
                );

                router.back();
            } finally {
                setLoading(false);
            }
        }

        load();
    }, [customerId]);

    const total = useMemo(() => {
        return items.reduce(
            (sum, item) =>
                sum +
                item.quantity *
                item.unitPrice,
            0
        );
    }, [items]);

    const paidAmount = Number(paid) || 0;

    const remaining = Math.max(
        total - paidAmount,
        0
    );

    function updateItem(
        id: string,
        changes: Partial<DraftItem>
    ) {
        setItems((current) =>
            current.map((item) =>
                item.id === id
                    ? { ...item, ...changes }
                    : item
            )
        );
    }

    function removeItem(id: string) {
        if (items.length === 1) {
            return;
        }

        setItems((current) =>
            current.filter(
                (item) => item.id !== id
            )
        );
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
            Alert.alert(
                "Items required",
                "Add at least one item."
            );
            return;
        }

        const invalidItem =
            items.find(
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

        if (paidAmount > total) {
            Alert.alert(
                "Invalid payment",
                "Paid amount cannot be greater than the total."
            );
            return;
        }

        try {
            setSaving(true);

            const orderId =
                await createCompleteOrder({
                    customerId,
                    orderDate,
                    deliveryDate,
                    tailoringDetails,
                    notes,
                    items: items.map(
                        ({
                            name,
                            quantity,
                            unitPrice,
                            notes: itemNotes,
                        }) => ({
                            name,
                            quantity,
                            unitPrice,
                            notes: itemNotes,
                        })
                    ),
                    paid: paidAmount,
                });

            Alert.alert(
                "Order created",
                `Receipt #${receiptNumber} has been created successfully.`,
                [
                    {
                        text: "OK",
                        onPress: () => {
                            router.replace({
                                pathname:
                                    "/customer-orders",
                                params: {
                                    id: customerId.toString(),
                                },
                            });
                        },
                    },
                ]
            );

            console.log(
                "Created order:",
                orderId
            );
        } catch (error) {
            console.error(
                "Failed to create order:",
                error
            );

            Alert.alert(
                "Failed to save order",
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

                    <AppText variant="caption">
                        Preparing order...
                    </AppText>
                </View>
            </Screen>
        );
    }

    return (
        <Screen>
            <ScrollView
                contentContainerStyle={
                    styles.content
                }
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.header}>
                    <AppText variant="title">
                        Create Order
                    </AppText>

                    <AppText variant="caption">
                        {customer?.name}
                    </AppText>
                </View>

                <AppCard>
                    <AppText variant="secondary">
                        Order Information
                    </AppText>

                    <View style={styles.field}>
                        <AppText variant="caption">
                            Customer
                        </AppText>

                        <AppText variant="body">
                            {customer?.name}
                        </AppText>
                    </View>

                    <View style={styles.field}>
                        <AppText variant="caption">
                            Receipt Number
                        </AppText>

                        <AppText variant="secondary">
                            #{receiptNumber}
                        </AppText>
                    </View>

                    <View style={styles.field}>
                        <AppText variant="caption">
                            Order Date
                        </AppText>

                        <AppText variant="body">
                            {displayDate(orderDate)}
                        </AppText>
                    </View>

                    <View style={styles.field}>
                        <AppText variant="caption">
                            Delivery Date *
                        </AppText>

                        <Pressable
                            style={styles.dateButton}
                            onPress={() =>
                                setShowDatePicker(true)
                            }
                        >
                            <AppText variant="body">
                                {deliveryDate
                                    ? displayDate(
                                        deliveryDate
                                    )
                                    : "Select delivery date"}
                            </AppText>
                        </Pressable>

                        {showDatePicker ? (
                            <DateTimePicker
                                value={
                                    deliveryDate
                                        ? new Date(
                                            `${deliveryDate}T12:00:00`
                                        )
                                        : new Date()
                                }
                                mode="date"
                                minimumDate={new Date()}
                                onValueChange={(
                                    _event,
                                    selectedDate
                                ) => {
                                    setShowDatePicker(
                                        false
                                    );

                                    if (selectedDate) {
                                        setDeliveryDate(
                                            formatDate(
                                                selectedDate
                                            )
                                        );
                                    }
                                }}
                            />
                        ) : null}
                    </View>
                </AppCard>

                <AppCard>
                    <AppText variant="secondary">
                        Tailoring Details
                    </AppText>

                    <AppInput
                        placeholder="e.g. Vol18, Vol21 ka 16"
                        value={tailoringDetails}
                        onChangeText={
                            setTailoringDetails
                        }
                        multiline
                    />

                    <AppText variant="caption">
                        Enter any free-form tailoring instructions.
                    </AppText>
                </AppCard>

                <AppCard>
                    <View style={styles.sectionHeader}>
                        <AppText variant="secondary">
                            Items
                        </AppText>

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

                    {items.map(
                        (item, index) => (
                            <View
                                key={item.id}
                                style={styles.item}
                            >
                                <View
                                    style={styles.itemHeader}
                                >
                                    <AppText variant="body">
                                        Item {index + 1}
                                    </AppText>

                                    {items.length > 1 ? (
                                        <Pressable
                                            onPress={() =>
                                                removeItem(
                                                    item.id
                                                )
                                            }
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
                                        updateItem(
                                            item.id,
                                            {
                                                name: value,
                                            }
                                        )
                                    }
                                />

                                <View
                                    style={
                                        styles.row
                                    }
                                >
                                    <View
                                        style={
                                            styles.half
                                        }
                                    >
                                        <AppInput
                                            placeholder="Quantity"
                                            value={String(
                                                item.quantity
                                            )}
                                            keyboardType="decimal-pad"
                                            onChangeText={(
                                                value
                                            ) => {
                                                const number =
                                                    Number(
                                                        value
                                                    );

                                                updateItem(
                                                    item.id,
                                                    {
                                                        quantity:
                                                            Number.isFinite(
                                                                number
                                                            )
                                                                ? number
                                                                : 0,
                                                    }
                                                );
                                            }}
                                        />
                                    </View>

                                    <View
                                        style={
                                            styles.half
                                        }
                                    >
                                        <AppInput
                                            placeholder="Unit price"
                                            value={
                                                item.unitPrice ===
                                                    0
                                                    ? ""
                                                    : String(
                                                        item.unitPrice
                                                    )
                                            }
                                            keyboardType="decimal-pad"
                                            onChangeText={(
                                                value
                                            ) => {
                                                const number =
                                                    Number(
                                                        value
                                                    );

                                                updateItem(
                                                    item.id,
                                                    {
                                                        unitPrice:
                                                            Number.isFinite(
                                                                number
                                                            )
                                                                ? number
                                                                : 0,
                                                    }
                                                );
                                            }}
                                        />
                                    </View>
                                </View>

                                <AppText variant="caption">
                                    Item total:{" "}
                                    {item.quantity *
                                        item.unitPrice}
                                </AppText>

                                <AppInput
                                    placeholder="Item notes (optional)"
                                    value={
                                        item.notes ?? ""
                                    }
                                    onChangeText={(
                                        value
                                    ) =>
                                        updateItem(
                                            item.id,
                                            {
                                                notes: value,
                                            }
                                        )
                                    }
                                    multiline
                                />
                            </View>
                        )
                    )}
                </AppCard>

                <AppCard>
                    <AppText variant="secondary">
                        Payment
                    </AppText>

                    <View style={styles.totalRow}>
                        <AppText variant="body">
                            Total
                        </AppText>

                        <AppText variant="secondary">
                            {total}
                        </AppText>
                    </View>

                    <AppInput
                        placeholder="Paid amount"
                        value={paid}
                        onChangeText={setPaid}
                        keyboardType="decimal-pad"
                    />

                    <View style={styles.totalRow}>
                        <AppText variant="body">
                            Remaining
                        </AppText>

                        <AppText variant="secondary">
                            {remaining}
                        </AppText>
                    </View>
                </AppCard>

                <AppCard>
                    <AppText variant="secondary">
                        Order Notes
                    </AppText>

                    <AppInput
                        placeholder="Optional order notes"
                        value={notes}
                        onChangeText={setNotes}
                        multiline
                    />
                </AppCard>

                <AppButton
                    title={
                        saving
                            ? "Saving..."
                            : "Save Order"
                    }
                    onPress={handleSave}
                    disabled={saving}
                />
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
        borderColor: "#E4E7EC",
        backgroundColor: "#FFFFFF",
    },

    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        marginBottom: 16,
    },

    item: {
        gap: 10,
        paddingTop: 16,
        marginTop: 16,
        borderTopWidth: 1,
        borderTopColor: "#E4E7EC",
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

    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 12,
    },

    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
    },
});