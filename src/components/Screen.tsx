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
    // Only meaningful when `scroll` is true - lets scrollable screens
    // (Home, Customers, Orders) opt into pull-to-refresh without each
    // one reaching into ScrollView directly.
    refreshControl?: ScrollViewProps["refreshControl"];
};

export default function Screen({
    children,
    scroll = false,
    style,
    contentContainerStyle,
    refreshControl,
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
                refreshControl={refreshControl}
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
