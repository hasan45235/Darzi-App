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
    variant?: "primary" | "secondary" | "danger" | "outline";
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
        paddingHorizontal: spacing.xl,
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