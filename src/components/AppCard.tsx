import { ReactNode } from "react";
import {
    StyleSheet,
    View,
    ViewStyle,
} from "react-native";

import {
    colors,
    radius,
    shadows,
    spacing,
} from "@/constants/theme";

type AppCardProps = {
    children: ReactNode;
    style?: ViewStyle;
};

export default function AppCard({
    children,
    style,
}: AppCardProps) {
    return (
        <View style={[styles.card, style]}>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.small,
    },
});