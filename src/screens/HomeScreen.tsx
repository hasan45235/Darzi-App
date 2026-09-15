import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";
import AppInput from "@/components/AppInput";
import AppText from "@/components/AppText";
import BottomNav from "@/components/BottomNav";
import FloatingActionButton from "@/components/FloatingActionButton";
import ListRow from "@/components/ListRow";
import Screen from "@/components/Screen";
import ViewableCustomerAvatar from "@/components/ViewableCustomerAvatar";

import { getCustomers } from "@/services/customerService";
import { resolveCustomerImageUri } from "@/services/customerImageService";
import { getOrders } from "@/services/orderService";
import { getBusinessName } from "@/services/settingsService";

import { colors, spacing } from "@/constants/theme";
import { Customer } from "@/types/customer";
import { Order } from "@/types/order";

const UPCOMING_ORDERS_LIMIT = 5;
const RECENT_CUSTOMERS_LIMIT = 8;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// Local "YYYY-MM-DD" (matches how deliveryDate is stored) - built from
// the date's own fields rather than toISOString(), which is UTC and
// can land on the wrong day near a local midnight boundary.
function toDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

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

    // What actually needs attention soon: not-yet-finished orders due
    // within the next 7 days, soonest delivery first - a plain "most
    // recently created" list didn't tell the tailor anything about what
    // was actually coming due.
    const upcomingOrders = useMemo(() => {
        const now = new Date();
        const todayStr = toDateString(now);

        const weekFromNow = new Date(now);
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        const weekFromNowStr = toDateString(weekFromNow);

        return orders
            .filter(
                (order) =>
                    order.status !== "completed" &&
                    order.status !== "cancelled" &&
                    order.deliveryDate >= todayStr &&
                    order.deliveryDate <= weekFromNowStr
            )
            .sort((a, b) =>
                a.deliveryDate.localeCompare(b.deliveryDate)
            )
            .slice(0, UPCOMING_ORDERS_LIMIT);
    }, [orders]);

    // Customers added in the last 7 days, newest first.
    const recentCustomers = useMemo(() => {
        const cutoff = Date.now() - WEEK_MS;

        return [...customers]
            .filter(
                (customer) =>
                    new Date(customer.createdAt).getTime() >= cutoff
            )
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

    // Customer selection now happens inline on the Create Order screen
    // itself (search-and-select), so "new order" just goes straight there
    // instead of routing through the Customers tab first.
    function handleNewOrder() {
        router.push("/create-order");
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
            {/* Screen scrolls its own content, so the FAB lives in this
            in-between wrapper instead of inside it - a floating button
            has to stay pinned to the viewport, not drift away with
            whatever the tailor scrolls past. */}
            <View style={styles.scrollArea}>
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
                        // Detailed rows (avatar, name, phone, customer #)
                        // instead of two bare lines of text - a search
                        // result should carry enough to tell customers
                        // apart at a glance, not just a name.
                        <View style={styles.searchResults}>
                            {searchResults.map((result, index) => (
                                <View
                                    key={
                                        result.type === "customer"
                                            ? `customer-${result.customer.id}`
                                            : `order-${result.order.id}`
                                    }
                                >
                                    {result.type === "customer" ? (
                                        <ListRow
                                            onPress={() =>
                                                router.push({
                                                    pathname:
                                                        "/customer-details",
                                                    params: {
                                                        id: result.customer.id.toString(),
                                                    },
                                                })
                                            }
                                            leading={
                                                <ViewableCustomerAvatar
                                                    name={
                                                        result.customer.name
                                                    }
                                                    photoUri={resolveCustomerImageUri(
                                                        result.customer
                                                            .photoUri
                                                    )}
                                                    size={48}
                                                />
                                            }
                                            title={result.customer.name}
                                            subtitle={result.customer.phone}
                                            caption={`#${result.customer.customerNumber}`}
                                        />
                                    ) : (
                                        <ListRow
                                            onPress={() =>
                                                router.push({
                                                    pathname:
                                                        "/order-details",
                                                    params: {
                                                        id: result.order.id.toString(),
                                                    },
                                                })
                                            }
                                            leading={
                                                <View
                                                    style={
                                                        styles.orderResultIcon
                                                    }
                                                >
                                                    <Ionicons
                                                        name="receipt"
                                                        size={22}
                                                        color={
                                                            colors.primary
                                                        }
                                                    />
                                                </View>
                                            }
                                            title={`Receipt #${result.order.receiptNumber}`}
                                            subtitle={result.customerName}
                                        />
                                    )}

                                    {index < searchResults.length - 1 ? (
                                        <View style={styles.separator} />
                                    ) : null}
                                </View>
                            ))}
                        </View>
                    )
                ) : (
                    <>
                        {/* "New Order" moved to the floating action
                        button below, matching Orders/Customers - with
                        only two buttons left, this row finally has room
                        for its icon and label to breathe. */}
                        <View style={styles.quickActions}>
                            <AppButton
                                title="Customers"
                                variant="secondary"
                                onPress={() => router.push("/customers")}
                                icon={
                                    <Ionicons
                                        name="people"
                                        size={18}
                                        color={colors.white}
                                    />
                                }
                                style={styles.quickActionButton}
                            />

                            <AppButton
                                title="Orders"
                                variant="outline"
                                onPress={() => router.push("/orders")}
                                icon={
                                    <Ionicons
                                        name="receipt"
                                        size={18}
                                        color={colors.primary}
                                    />
                                }
                                style={styles.quickActionButton}
                            />
                        </View>

                        <View style={styles.section}>
                            <AppText variant="heading">
                                Upcoming Orders
                            </AppText>

                            <AppText variant="caption">
                                Deliveries due in the next 7 days.
                            </AppText>

                            {upcomingOrders.length === 0 ? (
                                <AppText variant="caption">
                                    Nothing due this week.
                                </AppText>
                            ) : (
                                <View style={styles.list}>
                                    {upcomingOrders.map((order) => (
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

                            <AppText variant="caption">
                                Added in the last 7 days.
                            </AppText>

                            {recentCustomers.length === 0 ? (
                                <AppText variant="caption">
                                    No new customers this week.
                                </AppText>
                            ) : (
                                // A horizontal row of avatar-and-name
                                // chips - the same "recent contacts"
                                // pattern most phone/messaging apps use -
                                // instead of stacked cards that just
                                // repeated the same two lines of text.
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={
                                        styles.customerChipRow
                                    }
                                >
                                    {recentCustomers.map((customer) => (
                                        <Pressable
                                            key={customer.id}
                                            style={({ pressed }) => [
                                                styles.customerChip,
                                                pressed &&
                                                styles.customerChipPressed,
                                            ]}
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
                                            <ViewableCustomerAvatar
                                                name={customer.name}
                                                photoUri={resolveCustomerImageUri(
                                                    customer.photoUri
                                                )}
                                                size={56}
                                            />

                                            <AppText
                                                variant="caption"
                                                numberOfLines={1}
                                                style={
                                                    styles.customerChipName
                                                }
                                            >
                                                {customer.name.split(" ")[0]}
                                            </AppText>
                                        </Pressable>
                                    ))}
                                </ScrollView>
                            )}
                        </View>
                    </>
                )}
            </Screen>

            <FloatingActionButton
                label="New order"
                onPress={handleNewOrder}
            />
            </View>

            <BottomNav />
        </View>
    );
}

const styles = StyleSheet.create({
    screenWrapper: {
        flex: 1,
        backgroundColor: colors.background,
    },

    // Fills the space above BottomNav so the FAB (absolutely positioned
    // within this box) stays pinned to the bottom-right of the visible
    // screen instead of scrolling away with Screen's own content.
    scrollArea: {
        flex: 1,
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
    },

    section: {
        marginBottom: spacing.xxl,
        gap: spacing.md,
    },

    list: {
        gap: spacing.md,
    },

    searchResults: {
        marginTop: spacing.sm,
    },

    separator: {
        height: 1,
        backgroundColor: colors.border,
    },

    orderResultIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.secondaryLight,
    },

    customerChipRow: {
        gap: spacing.lg,
        paddingRight: spacing.lg,
    },

    customerChip: {
        alignItems: "center",
        width: 72,
        gap: spacing.xs,
    },

    customerChipPressed: {
        opacity: 0.7,
    },

    customerChipName: {
        textAlign: "center",
    },

    center: {
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.sm,
        marginTop: spacing.huge,
    },
});
