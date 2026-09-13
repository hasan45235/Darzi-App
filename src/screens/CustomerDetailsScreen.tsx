import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
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
import Screen from "@/components/Screen";
import { colors } from "@/constants/theme";
import { Image } from "react-native";

import {
    findCustomerById,
    removeCustomer,
} from "@/services/customerService";

import { Customer } from "@/types/customer";

export default function CustomerDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();

    const [customer, setCustomer] = useState<Customer | null>(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadCustomer = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const customerId = Number(id);

            if (!Number.isInteger(customerId)) {
                throw new Error("Invalid customer ID.");
            }

            const result = await findCustomerById(customerId);

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
            `Are you sure you want to delete ${customer.name}?`,
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

                            await removeCustomer(customer.id);

                            router.back();
                        } catch (error) {
                            setError(
                                error instanceof Error
                                    ? error.message
                                    : "Failed to delete customer."
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
                <View style={styles.header}>
                    {customer.photoUri ? (
                        <Image
                            source={{ uri: customer.photoUri }}
                            style={styles.photo}
                        />
                    ) : (
                        <View style={styles.placeholder}>
                            <AppText variant="secondary">
                                No Photo
                            </AppText>
                        </View>
                    )}
                    <AppText variant="title">
                        {customer.name}
                    </AppText>

                    <AppText variant="caption">
                        Customer #{customer.id}
                    </AppText>
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
                        title="Edit Customer"
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
                        title={deleting ? "Deleting..." : "Delete Customer"}
                        onPress={handleDelete}
                        disabled={deleting}
                    />
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

    section: {
        gap: 4,
        marginBottom: 16,
    },

    actions: {
        gap: 12,
    },

    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 12,
    },
    photo: {
        width: 140,
        height: 140,
        borderRadius: 70,
        alignSelf: "center",
    },

    placeholder: {
        width: 140,
        height: 140,
        borderRadius: 70,
        alignSelf: "center",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.secondaryLight,
    },
});