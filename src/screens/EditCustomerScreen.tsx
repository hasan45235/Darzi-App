import {
    router,
    useFocusEffect,
    useLocalSearchParams,
} from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";

import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";
import AppInput from "@/components/AppInput";
import AppText from "@/components/AppText";
import Screen from "@/components/Screen";

import {
    Alert
} from "react-native";

import {
    pickCustomerPhoto,
    takeCustomerPhoto,
} from "@/services/customerPhotoPicker";

import {
    editCustomer,
    findCustomerById,
} from "@/services/customerService";

export default function EditCustomerScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [photoUri, setPhotoUri] =
        useState<string | null>(null);

    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [notes, setNotes] = useState("");

    const [error, setError] = useState<string | null>(null);

    const loadCustomer = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const customerId = Number(id);

            if (!Number.isInteger(customerId)) {
                throw new Error("Invalid customer ID.");
            }

            const customer = await findCustomerById(customerId);

            if (!customer) {
                throw new Error("Customer not found.");
            }

            setName(customer.name);
            setPhone(customer.phone);
            setAddress(customer.address ?? "");
            setNotes(customer.notes ?? "");
            setPhotoUri(customer.photoUri);
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

    async function handleSave() {
        try {
            setError(null);
            setSaving(true);

            const customerId = Number(id);

            await editCustomer(customerId, {
                name,
                phone,
                address,
                notes,
                photoUri,
            });

            router.back();
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to update customer."
            );
        } finally {
            setSaving(false);
        }
    }
    async function handlePickPhoto() {
        const uri = await pickCustomerPhoto();

        if (uri) {
            setPhotoUri(uri);
        }
    }

    async function handleTakePhoto() {
        const uri = await takeCustomerPhoto();

        if (uri) {
            setPhotoUri(uri);
        }
    }

    function handlePhotoOptions() {
        Alert.alert(
            "Customer Photo",
            "Choose an option.",
            [
                {
                    text: "Camera",
                    onPress: handleTakePhoto,
                },
                {
                    text: "Gallery",
                    onPress: handlePickPhoto,
                },
                {
                    text: "Cancel",
                    style: "cancel",
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

    return (
        <Screen>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.header}>
                        <AppText variant="title">
                            Edit Customer
                        </AppText>

                        <AppText variant="caption">
                            Update the customer's information.
                        </AppText>
                    </View>

                    <AppCard>
                        <AppInput
                            label="Name"
                            placeholder="Customer name"
                            value={name}
                            onChangeText={setName}
                            autoCapitalize="words"
                        />

                        <AppInput
                            label="Phone"
                            placeholder="Phone number"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                        />

                        <AppInput
                            label="Address"
                            placeholder="Optional address"
                            value={address}
                            onChangeText={setAddress}
                            multiline
                        />

                        <AppInput
                            label="Notes"
                            placeholder="Optional notes"
                            value={notes}
                            onChangeText={setNotes}
                            multiline
                        />
                    </AppCard>

                    {error ? (
                        <AppText variant="caption">
                            {error}
                        </AppText>
                    ) : null}

                    <View style={styles.actions}>
                        <AppButton
                            title="Cancel"
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
            </KeyboardAvoidingView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    content: {
        paddingBottom: 32,
        gap: 16,
    },

    header: {
        gap: 4,
    },

    actions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 12,
    },

    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 12,
    },
});