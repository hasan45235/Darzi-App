import { Pressable, StyleSheet, ViewStyle } from "react-native";

import AppText from "@/components/AppText";

import { colors, shadows, spacing } from "@/constants/theme";

type Props = {
    onPress: () => void;
    // Screen-reader label - the button itself only shows a "+" glyph, so
    // this is what accessibility tools actually announce.
    label: string;
    style?: ViewStyle;
};

const SIZE = 58;

// A circular "add new" button that floats above a screen's content,
// anchored bottom-right. Used on Customers and Orders as the primary
// way to start creating one, instead of a button competing for space
// in the header.
export default function FloatingActionButton({
    onPress,
    label,
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
            <AppText style={styles.icon}>+</AppText>
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

    icon: {
        color: colors.white,
        fontSize: 30,
        fontWeight: "600",
        lineHeight: 34,
        marginTop: -2,
    },
});
