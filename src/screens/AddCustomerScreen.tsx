import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
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
    pickCustomerPhoto,
    takeCustomerPhoto,
} from "@/services/customerPhotoPicker";
import { addCustomer } from "@/services/customerService";
import { suggestNextCustomerNumber } from "@/services/customerNumberService";

export default function AddCustomerScreen() {
    const [customerNumber, setCustomerNumber] = useState("");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [notes, setNotes] = useState("");

    const [photoUri, setPhotoUri] = useState<string | null>(null);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Prefill with a sensible next number - the tailor can freely type
    // over it, since it's just a starting suggestion, not an assignment.
    useEffect(() => {
        suggestNextCustomerNumber()
            .then((suggested) =>
                setCustomerNumber(String(suggested))
            )
            .catch((error) =>
                console.error(
                    "Failed to suggest next customer number:",
                    error
                )
            );
    }, []);

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

            await addCustomer(
                {
                    customerNumber: Number(customerNumber),
                    name,
                    phone,
                    address,
                    notes,
                },
                photoUri
            );

            router.back();
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Failed to save customer.";

            setError(message);
        } finally {
            setSaving(false);
        }
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
                            Add Customer
                        </AppText>

                        <AppText variant="caption">
                            Enter the customer's information below.
                        </AppText>
                    </View>

                    <AppCard>
                        <View style={styles.photoSection}>
                            <AvatarPicker
                                name={name}
                                photoUri={photoUri}
                                onPress={handlePhotoOptions}
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
                                    : "Save Customer"
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
});