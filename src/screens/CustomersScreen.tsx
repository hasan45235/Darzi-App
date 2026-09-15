import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
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
import CustomerAvatar from "@/components/CustomerAvatar";
import FloatingActionButton from "@/components/FloatingActionButton";
import Screen from "@/components/Screen";

import { getActiveCustomers } from "@/services/customerService";
import { resolveCustomerImageUri } from "@/services/customerImageService";
import { getCustomerOrderStats } from "@/services/orderService";

import { colors } from "@/constants/theme";
import { Customer } from "@/types/customer";
import { CustomerOrderStats } from "@/types/order";

export default function CustomersScreen() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [orderStats, setOrderStats] = useState<CustomerOrderStats[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const insets = useSafeAreaInsets();

    // `silent` powers pull-to-refresh: same fetch, but it drives the
    // small RefreshControl spinner instead of replacing the whole
    // screen with the full-page loading state.
    const loadCustomers = useCallback(async (opts?: { silent?: boolean }) => {
        try {
            if (opts?.silent) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError(null);

            // Settled (not all-or-nothing): the order-count/last-order
            // enrichment is a nice-to-have, so a failure there should
            // never blank out the actual customer list.
            const [customersResult, statsResult] =
                await Promise.allSettled([
                    getActiveCustomers(),
                    getCustomerOrderStats(),
                ]);

            if (customersResult.status === "fulfilled") {
                setCustomers(customersResult.value);
            } else {
                throw customersResult.reason;
            }

            if (statsResult.status === "fulfilled") {
                setOrderStats(statsResult.value);
            } else {
                console.error(
                    "Failed to load customer order stats:",
                    statsResult.reason
                );
                setOrderStats([]);
            }
        } catch (error) {
            console.error("Failed to load customers:", error);

            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to load customers."
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
            loadCustomers();
        }, [loadCustomers])
    );

    function handleRefresh() {
        loadCustomers({ silent: true });
    }

    const statsByCustomerId = useMemo(() => {
        const map = new Map<number, CustomerOrderStats>();

        for (const stats of orderStats) {
            map.set(stats.customerId, stats);
        }

        return map;
    }, [orderStats]);

    const filteredCustomers = useMemo(() => {
        const query = search.trim().toLowerCase();

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
    }, [customers, search]);

    return (
        <View style={[styles.screenWrapper, { paddingTop: insets.top }]}>
        <Screen>
            <View style={styles.header}>
                <AppText variant="title">Customers</AppText>

                <AppText variant="caption">
                    {customers.length} customer
                    {customers.length === 1 ? "" : "s"}
                </AppText>
            </View>

            <AppInput
                placeholder="Search customers..."
                value={search}
                onChangeText={setSearch}
            />

            {error ? (
                <View style={styles.center}>
                    <AppText variant="secondary">
                        Couldn't load customers
                    </AppText>

                    <AppText variant="caption">{error}</AppText>

                    <AppButton
                        title="Retry"
                        onPress={loadCustomers}
                    />
                </View>
            ) : loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" />

                    <AppText variant="caption">
                        Loading customers...
                    </AppText>
                </View>
            ) : customers.length === 0 ? (
                <View style={styles.center}>
                    <AppText variant="secondary">
                        No customers yet
                    </AppText>

                    <AppText variant="caption">
                        Add your first customer to get started.
                    </AppText>
                </View>
            ) : filteredCustomers.length === 0 ? (
                <View style={styles.center}>
                    <AppText variant="secondary">
                        No customers found
                    </AppText>

                    <AppText variant="caption">
                        Try searching with a different name or phone number.
                    </AppText>
                </View>
            ) : (
                <FlatList
                    data={filteredCustomers}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor={colors.primary}
                            colors={[colors.primary]}
                        />
                    }
                    renderItem={({ item }) => {
                        const photoUri = resolveCustomerImageUri(
                            item.photoUri
                        );

                        const stats = statsByCustomerId.get(item.id);

                        return (
                            <AppCard
                                onPress={() =>
                                    router.push({
                                        pathname: "/customer-details",
                                        params: {
                                            id: item.id.toString(),
                                        },
                                    })
                                }
                                style={styles.row}
                            >
                                <CustomerAvatar
                                    name={item.name}
                                    photoUri={photoUri}
                                    size={48}
                                />

                                <View style={styles.rowText}>
                                    <AppText variant="secondary">
                                        #{item.customerNumber} · {item.name}
                                    </AppText>

                                    <AppText variant="body">
                                        {item.phone}
                                    </AppText>

                                    <AppText variant="caption">
                                        {stats
                                            ? `${stats.orderCount} order${stats.orderCount === 1 ? "" : "s"} · Last: ${stats.lastOrderDate}`
                                            : "No orders yet"}
                                    </AppText>
                                </View>
                            </AppCard>
                        );
                    }}
                />
            )}

            <FloatingActionButton
                label="Add customer"
                onPress={() => router.push("/add-customer")}
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
        gap: 2,
    },

    list: {
        gap: 12,
        // Extra room so the last card can scroll clear of the FAB
        // instead of sitting underneath it.
        paddingBottom: 96,
    },

    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },

    rowText: {
        flex: 1,
        gap: 2,
    },

    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
    },
});