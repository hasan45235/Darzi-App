import { ReactNode } from "react";
import {
    ScrollView,
    ScrollViewProps,
    StyleSheet,
    View,
    ViewStyle,
} from "react-native";

import { colors, spacing } from "@/constants/theme";

type ScreenProps = {
    children: ReactNode;
    scroll?: boolean;
    style?: ViewStyle;
    contentContainerStyle?: ScrollViewProps["contentContainerStyle"];
};

export default function Screen({
    children,
    scroll = false,
    style,
    contentContainerStyle,
}: ScreenProps) {
    if (scroll) {
        return (
            <ScrollView
                style={styles.container}
                contentContainerStyle={[
                    styles.content,
                    contentContainerStyle,
                ]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {children}
            </ScrollView>
        );
    }

    return <View style={[styles.container, styles.content, style]}>{children}</View>;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },

    content: {
        padding: spacing.lg,
    },
});