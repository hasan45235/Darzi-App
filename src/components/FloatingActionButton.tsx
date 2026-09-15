import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, ViewStyle } from "react-native";

import { colors, shadows, spacing } from "@/constants/theme";

type Props = {
    onPress: () => void;
    // Screen-reader label - the button only shows an icon, so this is
    // what accessibility tools actually announce.
    label: string;
    // Defaults to "+" (the "add new" action Customers/Orders use this
    // for) - other screens can pass their own primary action's icon
    // instead (e.g. "receipt-outline" for "view orders").
    icon?: keyof typeof Ionicons.glyphMap;
    style?: ViewStyle;
};

const SIZE = 56;

// A circular button that floats above a screen's content, anchored
// bottom-right, for that screen's single most important action - "add
// new" on Customers/Orders, but reusable for any one primary action.
// This is the one element in the app that's meant to look elevated -
// a FAB floating above the page is a real, deliberate affordance
// (Material Design's own spec), unlike the flat cards and list rows
// everywhere else.
export default function FloatingActionButton({
    onPress,
    label,
    icon = "add",
    style,
}: Props) {
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={label}
            hitSlop={8}
            style={({ pressed }) => [
                styles.fab,
                pressed && styles.pressed,
                style,
            ]}
        >
            <Ionicons name={icon} size={26} color={colors.white} />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    fab: {
        position: "absolute",
        right: spacing.xl,
        bottom: spacing.xl,
        width: SIZE,
        height: SIZE,
        borderRadius: SIZE / 2,
        backgroundColor: colors.primary,
        alignItems: "center",
        justifyContent: "center",
        ...shadows.floating,
    },

    pressed: {
        opacity: 0.85,
        transform: [{ scale: 0.96 }],
    },
});
