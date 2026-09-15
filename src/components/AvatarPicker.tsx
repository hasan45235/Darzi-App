import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";

import CustomerAvatar from "@/components/CustomerAvatar";

import { colors, shadows } from "@/constants/theme";

type Props = {
    name: string;
    photoUri: string | null;
    onPress: () => void;
    size?: number;
};

// The tap-to-add-photo pattern almost every app uses on a profile
// screen: a large circular preview (photo, or initials when there's
// none yet) with a small camera badge overlapping its edge - one tap
// target instead of a separate "Add Photo" button taking up its own
// row underneath.
export default function AvatarPicker({
    name,
    photoUri,
    onPress,
    size = 120,
}: Props) {
    const badgeSize = Math.round(size * 0.32);

    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel="Change customer photo"
            style={[styles.wrapper, { width: size, height: size }]}
        >
            <CustomerAvatar
                name={name}
                photoUri={photoUri}
                size={size}
                style={shadows.small}
            />

            <View
                style={[
                    styles.badge,
                    {
                        width: badgeSize,
                        height: badgeSize,
                        borderRadius: badgeSize / 2,
                    },
                ]}
            >
                <Ionicons
                    name="camera"
                    size={badgeSize * 0.55}
                    color={colors.white}
                />
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        alignSelf: "center",
    },

    badge: {
        position: "absolute",
        right: 0,
        bottom: 0,
        backgroundColor: colors.primary,
        borderWidth: 2,
        borderColor: colors.surface,
        alignItems: "center",
        justifyContent: "center",
    },
});
