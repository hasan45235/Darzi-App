import {
    Alert,
} from "react-native";

import * as ImagePicker from "expo-image-picker";

export async function pickCustomerPhoto(): Promise<
    string | null
> {
    const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
        Alert.alert(
            "Permission required",
            "Please allow photo library access to select a customer photo."
        );

        return null;
    }

    const result =
        await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

    if (result.canceled || !result.assets?.length) {
        return null;
    }

    return result.assets[0].uri;
}

export async function takeCustomerPhoto(): Promise<
    string | null
> {
    const permission =
        await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
        Alert.alert(
            "Permission required",
            "Please allow camera access to take a customer photo."
        );

        return null;
    }

    const result =
        await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

    if (result.canceled || !result.assets?.length) {
        return null;
    }

    return result.assets[0].uri;
}