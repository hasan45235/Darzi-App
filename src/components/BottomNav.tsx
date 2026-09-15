import { router, usePathname } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppText from "@/components/AppText";
import {
    colors,
    fontSize,
    fontWeight,
    radius,
    shadows,
    spacing,
} from "@/constants/theme";

// Expo Router's file-based routes don't have a native tab group here yet
// (that would mean physically moving index/orders/settings into a
// `(tabs)/` folder, which risks leaving orphaned duplicate route files
// behind). This plain component gives the same "always visible, tap to
// switch" behavior by sitting at the bottom of each of the four main
// screens and calling router.replace() directly.
const TABS = [
    { label: "Home", path: "/" },
    { label: "Customers", path: "/customers" },
    { label: "Orders", path: "/orders" },
    { label: "Settings", path: "/settings" },
] as const;

export default function BottomNav() {
    const pathname = usePathname();
    const insets = useSafeAreaInsets();

    return (
        <View
            style={[
                styles.container,
                { paddingBottom: insets.bottom || spacing.sm },
            ]}
        >
            {TABS.map((tab) => {
                const isActive = pathname === tab.path;

                return (
                    <Pressable
                        key={tab.path}
                        onPress={() => {
                            if (!isActive) {
                                router.replace(tab.path);
                            }
                        }}
                        style={styles.tab}
                        hitSlop={4}
                    >
                        <View
                            style={
                                isActive
                                    ? [styles.pill, styles.activePill]
                                    : styles.pill
                            }
                        >
                            <AppText
                                variant="caption"
                                style={
                                    isActive
                                        ? [styles.label, styles.activeLabel]
                                        : styles.label
                                }
                            >
                                {tab.label}
                            </AppText>
                        </View>
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.surface,
        paddingTop: spacing.sm,
        ...shadows.small,
    },

    tab: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },

    pill: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.xs,
        borderRadius: radius.round,
    },

    activePill: {
        backgroundColor: colors.primaryLight,
    },

    label: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.medium,
        color: colors.textSecondary,
    },

    activeLabel: {
        color: colors.primaryDark,
        fontWeight: fontWeight.bold,
    },
});
