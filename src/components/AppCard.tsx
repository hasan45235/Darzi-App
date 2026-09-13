import {
    Pressable,
    StyleSheet,
    View,
    ViewStyle,
} from "react-native";

import { ReactNode } from "react";

import {
    colors,
    radius,
    shadows,
    spacing,
} from "@/constants/theme";

type AppCardProps = {
    children: ReactNode;
    onPress?: () => void;
    style?: ViewStyle;
};

export default function AppCard({
    children,
    onPress,
    style,
}: AppCardProps) {
    const content = (
        <View style={[styles.card, style]}>
            {children}
        </View>
    );

    if (onPress) {
        return (
            <Pressable
                onPress={onPress}
                style={({ pressed }) => [
                    styles.pressable,
                    pressed && styles.pressed,
                ]}
            >
                {content}
            </Pressable>
        );
    }

    return content;
}

const styles = StyleSheet.create({
    pressable: {
        borderRadius: radius.lg,
    },

    pressed: {
        opacity: 0.75,
    },

    card: {
        backgroundColor: colors.background,
        borderRadius: radius.lg,
        padding: spacing.lg,

        ...shadows.medium,
    },
});