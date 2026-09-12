import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";

import {
    colors,
    fontSize,
    fontWeight,
    radius,
    spacing,
} from "@/constants/theme";

type AppInputProps = TextInputProps & {
    label?: string;
    error?: string;
};

export default function AppInput({
    label,
    error,
    style,
    ...props
}: AppInputProps) {
    return (
        <View style={styles.wrapper}>
            {label ? <Text style={styles.label}>{label}</Text> : null}

            <TextInput
                {...props}
                style={[
                    styles.input,
                    error ? styles.inputError : null,
                    style,
                ]}
                placeholderTextColor={colors.textMuted}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        gap: spacing.sm,
    },

    label: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.medium,
        color: colors.text,
    },

    input: {
        minHeight: 48,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        backgroundColor: colors.surface,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        fontSize: fontSize.md,
        color: colors.text,
    },

    inputError: {
        borderColor: colors.danger,
    },

    error: {
        fontSize: fontSize.sm,
        color: colors.danger,
    },
});