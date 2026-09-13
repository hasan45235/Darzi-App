import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    View,
} from "react-native";

import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";
import AppInput from "@/components/AppInput";
import AppText from "@/components/AppText";
import Screen from "@/components/Screen";

import { getCustomers } from "@/services/customerService";
import { Customer } from "@/types/customer";

export default function CustomersScreen() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    const loadCustomers = useCallback(async () => {
        try {
            setLoading(true);

            const result = await getCustomers();

            setCustomers(result);
        } catch (error) {
            console.error("Failed to load customers:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadCustomers();
        }, [loadCustomers])
    );

    const filteredCustomers = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) {
            return customers;
        }

        return customers.filter((customer) => {
            return (
                customer.name.toLowerCase().includes(query) ||
                customer.phone.toLowerCase().includes(query)
            );
        });
    }, [customers, search]);

    return (
        <Screen>
            <View style={styles.header}>
                <View>
                    <AppText variant="title">Customers</AppText>

                    <AppText variant="caption">
                        {customers.length} customer
                        {customers.length === 1 ? "" : "s"}
                    </AppText>
                </View>

                <AppButton
                    title="Add Customer"
                    onPress={() => router.push("/add-customer")}
                />
            </View>

            <AppInput
                placeholder="Search customers..."
                value={search}
                onChangeText={setSearch}
            />

            {loading ? (
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
                    renderItem={({ item }) => (
                        <AppCard
                            onPress={() =>
                                router.push({
                                    pathname: "/customer-details",
                                    params: {
                                        id: item.id.toString(),
                                    },
                                })
                            }
                        >
                            <AppText variant="secondary">
                                {item.name}
                            </AppText>

                            <AppText variant="body">
                                {item.phone}
                            </AppText>

                            {item.address ? (
                                <AppText variant="caption">
                                    {item.address}
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
        marginBottom: 20,
        gap: 12,
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