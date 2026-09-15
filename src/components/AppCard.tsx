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

    // Flat by design: a hairline border on a white surface reads as a
    // distinct, tappable block against the ivory screen background
    // without needing a drop shadow - current mobile UI convention
    // favors this over "floating box" shadows, which read as dated and
    // visually heavy when repeated down a whole screen.
    card: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.lg,
    },
});