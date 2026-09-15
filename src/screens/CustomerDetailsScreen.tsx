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
import CustomerAvatar from "@/components/CustomerAvatar";
import Screen from "@/components/Screen";

import {
    findCustomerById,
    removeCustomer,
} from "@/services/customerService";

import { resolveCustomerImageUri } from "@/services/customerImageService";

import { colors, shadows } from "@/constants/theme";
import { Customer } from "@/types/customer";

export default function CustomerDetailsScreen() {
    const { id } =
        useLocalSearchParams<{ id: string }>();

    const [customer, setCustomer] =
        useState<Customer | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [deleting, setDeleting] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    const loadCustomer = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const customerId = Number(id);

            if (!Number.isInteger(customerId)) {
                throw new Error("Invalid customer ID.");
            }

            const result =
                await findCustomerById(customerId);

            if (!result) {
                throw new Error("Customer not found.");
            }

            setCustomer(result);
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to load customer."
            );
        } finally {
            setLoading(false);
        }
    }, [id]);

    useFocusEffect(
        useCallback(() => {
            loadCustomer();
        }, [loadCustomer])
    );

    async function handleDelete() {
        if (!customer) {
            return;
        }

        Alert.alert(
            "Delete Customer",
            `This will deactivate ${customer.name}. They'll be hidden ` +
            "from your customer list, but their orders stay on record. " +
            "You can permanently delete them later from Settings.",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Deactivate",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setDeleting(true);
                            setError(null);

                            await removeCustomer(customer.id);

                            router.back();
                        } catch (error) {
                            const message =
                                error instanceof Error
                                    ? error.message
                                    : "Failed to delete customer.";

                            setError(message);

                            Alert.alert(
                                "Cannot Delete Customer",
                                message
                            );
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
                        Loading customer...
                    </AppText>
                </View>
            </Screen>
        );
    }

    if (!customer) {
        return (
            <Screen>
                <View style={styles.center}>
                    <AppText variant="secondary">
                        Customer not found
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
            <ScrollView
                contentContainerStyle={styles.content}
            >
                <View style={styles.profile}>
                    <CustomerAvatar
                        name={customer.name}
                        photoUri={resolveCustomerImageUri(customer.photoUri)}
                        size={140}
                        style={styles.avatar}
                    />

                    <AppText variant="title">
                        {customer.name}
                    </AppText>

                    <AppText variant="caption">
                        Customer #{customer.customerNumber}
                    </AppText>

                    {!customer.isActive ? (
                        <View style={styles.inactiveBadge}>
                            <AppText
                                variant="caption"
                                style={{ color: colors.danger }}
                            >
                                Deactivated
                            </AppText>
                        </View>
                    ) : null}
                </View>

                <AppCard>
                    <View style={styles.section}>
                        <AppText variant="caption">
                            Phone
                        </AppText>

                        <AppText variant="body">
                            {customer.phone}
                        </AppText>
                    </View>

                    {customer.address ? (
                        <View style={styles.section}>
                            <AppText variant="caption">
                                Address
                            </AppText>

                            <AppText variant="body">
                                {customer.address}
                            </AppText>
                        </View>
                    ) : null}

                    {customer.notes ? (
                        <View style={styles.section}>
                            <AppText variant="caption">
                                Notes
                            </AppText>

                            <AppText variant="body">
                                {customer.notes}
                            </AppText>
                        </View>
                    ) : null}
                </AppCard>



                {error ? (
                    <AppText variant="caption">
                        {error}
                    </AppText>
                ) : null}


                <View style={styles.actions}>
                    <AppButton
                        title="View Orders"
                        onPress={() =>
                            router.push({
                                pathname: "/customer-orders",
                                params: {
                                    id: customer.id.toString(),
                                },
                            })
                        }
                    />

                    {/* Edit/Delete are secondary to "View Orders" and used
                    far less often, so they're a compact side-by-side row
                    instead of two more full-size stacked buttons - and
                    Delete is properly styled as a destructive action
                    rather than the same gold as everything else. */}
                    <View style={styles.secondaryActions}>
                        <AppButton
                            title="Edit"
                            variant="outline"
                            style={styles.secondaryButton}
                            onPress={() =>
                                router.push({
                                    pathname: "/edit-customer",
                                    params: {
                                        id: customer.id.toString(),
                                    },
                                })
                            }
                        />

                        <AppButton
                            title={
                                deleting ? "Deactivating..." : "Delete"
                            }
                            variant="danger"
                            style={styles.secondaryButton}
                            onPress={handleDelete}
                            disabled={deleting}
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

    profile: {
        alignItems: "center",
        gap: 6,
    },

    inactiveBadge: {
        marginTop: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: colors.dangerLight,
    },

    avatar: {
        marginBottom: 8,
        ...shadows.medium,
    },

    section: {
        gap: 4,
        marginBottom: 16,
    },

    actions: {
        gap: 12,
    },

    secondaryActions: {
        flexDirection: "row",
        gap: 12,
    },

    secondaryButton: {
        flex: 1,
        minHeight: 44,
    },

    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 12,
    },
});