import {
    router,
    useFocusEffect,
    useLocalSearchParams,
} from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
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
import AvatarPicker from "@/components/AvatarPicker";
import Screen from "@/components/Screen";

import {
    editCustomer,
    findCustomerById,
} from "@/services/customerService";

import {
    pickCustomerPhoto,
    takeCustomerPhoto,
} from "@/services/customerPhotoPicker";

import { resolveCustomerImageUri } from "@/services/customerImageService";

export default function EditCustomerScreen() {
    const { id } =
        useLocalSearchParams<{ id: string }>();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [customerNumber, setCustomerNumber] = useState("");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [notes, setNotes] = useState("");

    const [photoUri, setPhotoUri] =
        useState<string | null>(null);

    const [error, setError] =
        useState<string | null>(null);

    // photoUri stays as the raw value (a saved filename, a legacy
    // absolute path, or a freshly picked cache URI) so it round-trips
    // correctly through editCustomer(). This is only for <Image>.
    const displayPhotoUri = resolveCustomerImageUri(photoUri);

    const loadCustomer = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const customerId = Number(id);

            if (!Number.isInteger(customerId)) {
                throw new Error("Invalid customer ID.");
            }

            const customer =
                await findCustomerById(customerId);

            if (!customer) {
                throw new Error("Customer not found.");
            }

            setCustomerNumber(String(customer.customerNumber));
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
            "Choose how you want to add the photo.",
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

    async function handleSave() {
        try {
            setError(null);
            setSaving(true);

            const customerId = Number(id);

            await editCustomer(customerId, {
                customerNumber: Number(customerNumber),
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
                behavior={
                    Platform.OS === "ios"
                        ? "padding"
                        : undefined
                }
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
                        <View style={styles.photoSection}>
                            <AvatarPicker
                                name={name}
                                photoUri={displayPhotoUri}
                                onPress={handlePhotoOptions}
                                size={140}
                            />
                        </View>

                        <AppInput
                            label="Customer Number"
                            placeholder="e.g. 2000"
                            value={customerNumber}
                            onChangeText={setCustomerNumber}
                            keyboardType="number-pad"
                        />

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
                            variant="ghost"
                            onPress={() => router.back()}
                            disabled={saving}
                        />

                        <AppButton
                            title={
                                saving
                                    ? "Saving..."
                                    : "Save Changes"
                            }
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

    photoSection: {
        alignItems: "center",
        marginBottom: 20,
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