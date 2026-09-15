import { router } from "expo-router";
import { Pressable, ViewStyle } from "react-native";

import CustomerAvatar from "@/components/CustomerAvatar";

type Props = {
    name: string;
    photoUri: string | null;
    size?: number;
    style?: ViewStyle;
};

// Wraps CustomerAvatar with a tap-to-preview action, opening the global
// image viewer (image-viewer.tsx) full-screen. This is the one place
// that decides "tapping a customer photo shows it big" - every screen
// that lists customers (Customers, Home search/recents, Customer
// Details, the receipt header) swaps in this component instead of the
// bare CustomerAvatar so the behavior stays identical everywhere.
//
// Not used on Add/Edit Customer's AvatarPicker - there, tapping the
// photo already opens the camera/gallery picker, and stacking a second
// competing tap-action on the same circle would just be confusing.
export default function ViewableCustomerAvatar({
    name,
    photoUri,
    size,
    style,
}: Props) {
    return (
        <Pressable
            onPress={() =>
                router.push({
                    pathname: "/image-viewer",
                    params: { uri: photoUri ?? "", name },
                })
            }
            accessibilityRole="button"
            accessibilityLabel={`View ${name}'s photo`}
            hitSlop={4}
        >
            <CustomerAvatar
                name={name}
                photoUri={photoUri}
                size={size}
                style={style}
            />
        </Pressable>
    );
}
