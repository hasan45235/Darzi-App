import { Ionicons } from "@expo/vector-icons";
import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    ActivityIndicator,
    Alert,
    FlatList,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";

import DateTimePicker from "@react-native-community/datetimepicker";

import {
    router,
    useFocusEffect,
    useLocalSearchParams,
} from "expo-router";

import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";
import AppInput from "@/components/AppInput";
import AppText from "@/components/AppText";
import CustomerAvatar from "@/components/CustomerAvatar";
import ListRow from "@/components/ListRow";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import Screen from "@/components/Screen";

import { getActiveCustomers } from "@/services/customerService";
import { resolveCustomerImageUri } from "@/services/customerImageService";

import {
    createCompleteOrder,
    getNextOrderReceiptNumber,
    NewOrderItem,
} from "@/services/orderService";

import {
    getBasicPantPrice,
    getBasicShirtPrice,
    getBasicSuitPrice,
} from "@/services/settingsService";

import { colors, fontWeight } from "@/constants/theme";
import { DEFAULT_ORDER_STATUS } from "@/constants/orderStatus";
import { Customer } from "@/types/customer";
import { ButtonType, DesignType } from "@/types/order";

type DraftItem = NewOrderItem & {
    id: string;
    // True when this item came from a quick-fill preset (Suit/Pant/
    // Shirt) - its name and price are already known, so those two
    // fields lock instead of staying editable like a manually-typed
    // item's would.
    isPreset: boolean;
};

// A quick-fill preset backed by the "Basic Item Prices" settings, so
// the tailor can add a common item in one tap instead of typing its
// name and price every time.
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
        isPreset: Boolean(preset),
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

    // --- Customer selection ------------------------------------------
    // No more "pick a customer, then navigate here" - the tailor lands
    // on this screen directly and searches/selects a customer inline.
    // An incoming `customerId` (from a customer's own "Create Order"
    // button) still pre-selects that customer, but it's just a
    // starting point - "Change" below lets it be swapped freely.
    const [customers, setCustomers] =
        useState<Customer[]>([]);

    const [loadingCustomers, setLoadingCustomers] =
        useState(true);

    const [customerSearch, setCustomerSearch] =
        useState("");

    const [selectedCustomer, setSelectedCustomer] =
        useState<Customer | null>(null);

    const [appliedInitialCustomer, setAppliedInitialCustomer] =
        useState(false);

    const loadCustomers = useCallback(async () => {
        try {
            setLoadingCustomers(true);
            setCustomers(await getActiveCustomers());
        } catch (error) {
            console.error(
                "Failed to load customers:",
                error
            );
        } finally {
            setLoadingCustomers(false);
        }
    }, []);

    // Refreshes on every focus, so returning from "Add New Customer"
    // (opened from the search step below) shows the new customer
    // immediately without needing a manual pull-to-refresh.
    useFocusEffect(
        useCallback(() => {
            loadCustomers();
        }, [loadCustomers])
    );

    useEffect(() => {
        if (appliedInitialCustomer || customers.length === 0) {
            return;
        }

        const initialId = Number(params.customerId);

        if (Number.isInteger(initialId)) {
            const match = customers.find(
                (customer) => customer.id === initialId
            );

            if (match) {
                setSelectedCustomer(match);
            }
        }

        setAppliedInitialCustomer(true);
    }, [customers, params.customerId, appliedInitialCustomer]);

    const filteredCustomers = useMemo(() => {
        const query = customerSearch.trim().toLowerCase();

        if (!query) {
            return customers;
        }

        return customers.filter((customer) => {
            return (
                customer.name.toLowerCase().includes(query) ||
                customer.phone.toLowerCase().includes(query) ||
                customer.customerNumber.toString().includes(query)
            );
        });
    }, [customers, customerSearch]);

    // --- Order form -----------------------------------------------------
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

    // Starts empty - a blank item block used to be pre-added here, but
    // that meant every new order opened with an empty, half-finished
    // "item" already sitting in the form. Now nothing shows until the
    // tailor actually taps "Add Item" or a quick-fill preset.
    const [items, setItems] =
        useState<DraftItem[]>([]);

    const [paid, setPaid] =
        useState("");

    const [discount, setDiscount] =
        useState("");

    const [addition, setAddition] =
        useState("");

    const [quickFillPresets, setQuickFillPresets] =
        useState<QuickFillPreset[]>([]);

    const [loadingForm, setLoadingForm] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    // Receipt number and quick-fill presets don't depend on which
    // customer ends up selected, so they load once up front instead of
    // waiting on a customer pick - by the time one is chosen, the rest
    // of the form is already ready to show.
    useEffect(() => {
        async function load() {
            try {
                const [
                    nextReceipt,
                    suitPrice,
                    pantPrice,
                    shirtPrice,
                ] = await Promise.all([
                    getNextOrderReceiptNumber(),
                    getBasicSuitPrice(),
                    getBasicPantPrice(),
                    getBasicShirtPrice(),
                ]);

                setReceiptNumber(nextReceipt);

                setQuickFillPresets([
                    { label: "+ Suit", name: "Suit", price: suitPrice },
                    { label: "+ Pant", name: "Pant", price: pantPrice },
                    { label: "+ Shirt", name: "Shirt", price: shirtPrice },
                ]);
            } catch (error) {
                console.error(
                    "Failed to prepare order:",
                    error
                );

                Alert.alert(
                    "Error",
                    "Failed to prepare order."
                );
            } finally {
                setLoadingForm(false);
            }
        }

        load();
    }, []);

    const subtotal = useMemo(() => {
        return items.reduce(
            (sum, item) =>
                sum +
                item.quantity *
                item.unitPrice,
            0
        );
    }, [items]);

    const discountAmount = Number(discount) || 0;
    const additionAmount = Number(addition) || 0;

    const total = Math.max(
        subtotal - discountAmount + additionAmount,
        0
    );

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
        setItems((current) =>
            current.filter(
                (item) => item.id !== id
            )
        );
    }

    async function handleSave() {
        if (!selectedCustomer) {
            Alert.alert(
                "Select a customer",
                "Please select the customer this order is for."
            );
            return;
        }

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

            const orderId =
                await createCompleteOrder({
                    customerId: selectedCustomer.id,
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
                                    id: selectedCustomer.id.toString(),
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

    if (loadingCustomers || loadingForm) {
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

    // --- Step 1: search and select a customer ---------------------------
    if (!selectedCustomer) {
        return (
            <Screen>
                <View style={styles.header}>
                    <AppText variant="title">
                        Create Order
                    </AppText>

                    <AppText variant="caption">
                        Search and select the customer this order is for.
                    </AppText>
                </View>

                <AppInput
                    placeholder="Search by name, phone, or customer #"
                    value={customerSearch}
                    onChangeText={setCustomerSearch}
                    autoFocus
                />

                {customers.length === 0 ? (
                    <View style={styles.center}>
                        <AppText variant="secondary">
                            No customers yet
                        </AppText>

                        <AppText variant="caption">
                            Add a customer first to create an order for them.
                        </AppText>

                        <AppButton
                            title="Add New Customer"
                            variant="outline"
                            onPress={() => router.push("/add-customer")}
                        />
                    </View>
                ) : filteredCustomers.length === 0 ? (
                    <View style={styles.center}>
                        <AppText variant="secondary">
                            No customers found
                        </AppText>

                        <AppText variant="caption">
                            Try a different name, phone, or customer number.
                        </AppText>

                        <AppButton
                            title="Add New Customer"
                            variant="outline"
                            onPress={() => router.push("/add-customer")}
                        />
                    </View>
                ) : (
                    <FlatList
                        data={filteredCustomers}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={styles.customerList}
                        keyboardShouldPersistTaps="handled"
                        ItemSeparatorComponent={() => (
                            <View style={styles.separator} />
                        )}
                        renderItem={({ item }) => (
                            <ListRow
                                onPress={() => setSelectedCustomer(item)}
                                leading={
                                    <CustomerAvatar
                                        name={item.name}
                                        photoUri={resolveCustomerImageUri(
                                            item.photoUri
                                        )}
                                        size={44}
                                    />
                                }
                                title={item.name}
                                subtitle={item.phone}
                                caption={`#${item.customerNumber}`}
                            />
                        )}
                    />
                )}
            </Screen>
        );
    }

    // --- Step 2: the order form itself -----------------------------------
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
                </View>

                <AppCard>
                    <View style={styles.customerRow}>
                        <CustomerAvatar
                            name={selectedCustomer.name}
                            photoUri={resolveCustomerImageUri(
                                selectedCustomer.photoUri
                            )}
                            size={44}
                        />

                        <View style={styles.customerInfo}>
                            <AppText variant="secondary">
                                {selectedCustomer.name}
                            </AppText>

                            <AppText variant="caption">
                                #{selectedCustomer.customerNumber} ·{" "}
                                {selectedCustomer.phone}
                            </AppText>
                        </View>

                        <Pressable
                            onPress={() => setSelectedCustomer(null)}
                            hitSlop={8}
                        >
                            <AppText
                                variant="caption"
                                style={styles.changeLink}
                            >
                                Change
                            </AppText>
                        </Pressable>
                    </View>
                </AppCard>

                <AppCard>
                    <AppText variant="secondary">
                        Order Information
                    </AppText>

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
                            Status
                        </AppText>

                        <OrderStatusBadge
                            status={DEFAULT_ORDER_STATUS}
                        />
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
                                // onValueChange only fires when a date is
                                // actually picked - cancelling the dialog
                                // never called it, so showDatePicker stayed
                                // true forever and the picker kept
                                // reappearing on every unrelated tap
                                // (each re-render passed a fresh `value`,
                                // which re-triggered the native dialog
                                // while it was still "open"). onDismiss is
                                // the library's dedicated cancel callback.
                                onDismiss={() =>
                                    setShowDatePicker(false)
                                }
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

                    {items.length === 0 ? (
                        <AppText
                            variant="caption"
                            style={styles.emptyItemsHint}
                        >
                            No items yet - tap "Add Item" or a quick-fill
                            button above to add one.
                        </AppText>
                    ) : null}

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
                                </View>

                                <AppInput
                                    placeholder="Item name"
                                    value={item.name}
                                    editable={!item.isPreset}
                                    style={
                                        item.isPreset
                                            ? styles.lockedInput
                                            : undefined
                                    }
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
                                        <AppText
                                            variant="caption"
                                            style={styles.stepperLabel}
                                        >
                                            Quantity
                                        </AppText>

                                        {/* Quantity is a stepper, not a
                                        text field - it only ever needs to
                                        go up or down by one, and typing a
                                        number on a numeric keyboard is
                                        slower and more error-prone than
                                        tapping +/- for that. */}
                                        <View style={styles.stepper}>
                                            <Pressable
                                                onPress={() =>
                                                    updateItem(item.id, {
                                                        quantity: Math.max(
                                                            1,
                                                            item.quantity - 1
                                                        ),
                                                    })
                                                }
                                                disabled={
                                                    item.quantity <= 1
                                                }
                                                hitSlop={8}
                                                style={[
                                                    styles.stepperButton,
                                                    item.quantity <= 1 &&
                                                    styles.stepperButtonDisabled,
                                                ]}
                                            >
                                                <Ionicons
                                                    name="remove"
                                                    size={18}
                                                    color={
                                                        item.quantity <= 1
                                                            ? colors.textMuted
                                                            : colors.primary
                                                    }
                                                />
                                            </Pressable>

                                            <AppText
                                                variant="body"
                                                style={styles.stepperValue}
                                            >
                                                {item.quantity}
                                            </AppText>

                                            <Pressable
                                                onPress={() =>
                                                    updateItem(item.id, {
                                                        quantity:
                                                            item.quantity + 1,
                                                    })
                                                }
                                                hitSlop={8}
                                                style={styles.stepperButton}
                                            >
                                                <Ionicons
                                                    name="add"
                                                    size={18}
                                                    color={colors.primary}
                                                />
                                            </Pressable>
                                        </View>
                                    </View>

                                    <View
                                        style={
                                            styles.half
                                        }
                                    >
                                        <AppInput
                                            label="Unit Price"
                                            placeholder="0"
                                            value={
                                                item.unitPrice ===
                                                    0
                                                    ? ""
                                                    : String(
                                                        item.unitPrice
                                                    )
                                            }
                                            editable={!item.isPreset}
                                            style={
                                                item.isPreset
                                                    ? styles.lockedInput
                                                    : undefined
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

                                <AppText variant="caption">
                                    Design
                                </AppText>

                                <View style={styles.designTypeRow}>
                                    {(
                                        [
                                            "simple",
                                            "design",
                                        ] as DesignType[]
                                    ).map((option) => {
                                        const isActive =
                                            (item.designType ??
                                                "simple") ===
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
                                                    updateItem(
                                                        item.id,
                                                        {
                                                            designType:
                                                                option,
                                                        }
                                                    )
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
                                    })}
                                </View>

                                <AppText variant="caption">
                                    Buttons
                                </AppText>

                                <View style={styles.designTypeRow}>
                                    {(
                                        [
                                            "simple",
                                            "fancy",
                                        ] as ButtonType[]
                                    ).map((option) => {
                                        const isActive =
                                            (item.buttonType ??
                                                "simple") ===
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
                                                    updateItem(
                                                        item.id,
                                                        {
                                                            buttonType:
                                                                option,
                                                        }
                                                    )
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
                                    })}
                                </View>

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
                            Subtotal
                        </AppText>

                        <AppText variant="body">
                            {subtotal}
                        </AppText>
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
                        <AppText variant="body">
                            Total
                        </AppText>

                        <AppText variant="secondary">
                            {total}
                        </AppText>
                    </View>

                    <AppInput
                        label="Paid"
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
                    icon={
                        saving ? null : (
                            <Ionicons
                                name="checkmark"
                                size={18}
                                color={colors.white}
                            />
                        )
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
        marginBottom: 16,
    },

    customerList: {
        paddingBottom: 24,
    },

    separator: {
        height: 1,
        backgroundColor: colors.border,
    },

    customerRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },

    customerInfo: {
        flex: 1,
        gap: 2,
    },

    changeLink: {
        color: colors.primary,
        fontWeight: fontWeight.semibold,
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

    emptyItemsHint: {
        paddingVertical: 8,
    },

    lockedInput: {
        backgroundColor: colors.background,
        color: colors.textSecondary,
    },

    stepperLabel: {
        marginBottom: 8,
        fontWeight: fontWeight.medium,
        color: colors.text,
    },

    stepper: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        minHeight: 48,
        borderWidth: 1,
        borderRadius: 10,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        paddingHorizontal: 4,
    },

    stepperButton: {
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
    },

    stepperButtonDisabled: {
        opacity: 0.4,
    },

    stepperValue: {
        flex: 1,
        textAlign: "center",
        fontWeight: fontWeight.semibold,
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
