import { ReactNode } from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    ViewStyle,
} from "react-native";

import {
    colors,
    fontSize,
    fontWeight,
    radius,
    spacing,
} from "@/constants/theme";

type AppButtonProps = {
    title: string;
    onPress: () => void;
    // "ghost" is for a screen's lowest-emphasis action (e.g. "Cancel"
    // next to a primary "Save") - text only, no fill or border, so it
    // doesn't visually compete with the action that actually matters.
    variant?: "primary" | "secondary" | "danger" | "outline" | "ghost";
    loading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
    icon?: ReactNode;
};

export default function AppButton({
    title,
    onPress,
    variant = "primary",
    loading = false,
    disabled = false,
    style,
    icon,
}: AppButtonProps) {
    const isDisabled = disabled || loading;

    return (
        <Pressable
            onPress={onPress}
            disabled={isDisabled}
            style={({ pressed }) => [
                styles.base,
                styles[variant],
                pressed && !isDisabled && styles.pressed,
                isDisabled && styles.disabled,
                style,
            ]}
        >
            {loading ? (
                <ActivityIndicator color={getTextColor(variant)} />
            ) : (
                <>
                    {icon}
                    <Text
                        style={[
                            styles.text,
                            {
                                color: getTextColor(variant),
                            },
                        ]}
                    >
                        {title}
                    </Text>
                </>
            )}
        </Pressable>
    );
}

function getTextColor(
    variant: AppButtonProps["variant"]
) {
    switch (variant) {
        case "outline":
            return colors.primary;

        case "ghost":
            return colors.textSecondary;

        case "secondary":
            return colors.white;

        case "danger":
            return colors.white;

        case "primary":
        default:
            return colors.white;
    }
}

const styles = StyleSheet.create({
    base: {
        minHeight: 48,
        // Tighter than before (was spacing.xl) - a full-width filled
        // button doesn't need extra horizontal breathing room the way a
        // pill-shaped chip does, and the old value made every button
        // read as a heavier block than it needed to.
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: radius.md,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: spacing.sm,
    },

    primary: {
        backgroundColor: colors.primary,
    },

    secondary: {
        backgroundColor: colors.secondary,
    },

    danger: {
        backgroundColor: colors.danger,
    },

    outline: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.primary,
    },

    ghost: {
        backgroundColor: "transparent",
        minHeight: 40,
    },

    text: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
    },

    pressed: {
        opacity: 0.8,
    },

    disabled: {
        opacity: 0.5,
    },
});