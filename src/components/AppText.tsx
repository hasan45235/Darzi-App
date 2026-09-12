import { ReactNode } from "react";
import { StyleSheet, Text, TextProps } from "react-native";

import {
    colors,
    fontSize,
    fontWeight,
} from "@/constants/theme";

type AppTextProps = TextProps & {
    children: ReactNode;
    variant?: "body" | "secondary" | "caption" | "title" | "heading";
};

export default function AppText({
    children,
    variant = "body",
    style,
    ...props
}: AppTextProps) {
    return (
        <Text
            {...props}
            style={[
                styles.base,
                styles[variant],
                style,
            ]}
        >
            {children}
        </Text>
    );
}

const styles = StyleSheet.create({
    base: {
        color: colors.text,
    },

    body: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.regular,
    },

    secondary: {
        fontSize: fontSize.md,
        color: colors.textSecondary,
    },

    caption: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
    },

    title: {
        fontSize: fontSize.xxl,
        fontWeight: fontWeight.bold,
        color: colors.secondary,
    },

    heading: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.semibold,
        color: colors.secondary,
    },
});