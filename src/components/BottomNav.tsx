import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppText from "@/components/AppText";
import {
    colors,
    fontSize,
    fontWeight,
    spacing,
} from "@/constants/theme";

// Expo Router's file-based routes don't have a native tab group here yet
// (that would mean physically moving index/orders/settings into a
// `(tabs)/` folder, which risks leaving orphaned duplicate route files
// behind). This plain component gives the same "always visible, tap to
// switch" behavior by sitting at the bottom of each of the four main
// screens and calling router.replace() directly.
//
// Icon names follow the standard iOS-style outline/filled pairing
// (outline when inactive, filled when active) - the same affordance
// every major app's tab bar uses so the current tab needs no other
// decoration to read as "selected".
const TABS = [
    {
        label: "Home",
        path: "/",
        icon: "home-outline",
        activeIcon: "home",
    },
    {
        label: "Customers",
        path: "/customers",
        icon: "people-outline",
        activeIcon: "people",
    },
    {
        label: "Orders",
        path: "/orders",
        icon: "receipt-outline",
        activeIcon: "receipt",
    },
    {
        label: "Settings",
        path: "/settings",
        icon: "settings-outline",
        activeIcon: "settings",
    },
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
                const color = isActive
                    ? colors.primary
                    : colors.textMuted;

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
                        <Ionicons
                            name={isActive ? tab.activeIcon : tab.icon}
                            size={24}
                            color={color}
                        />

                        <AppText
                            variant="caption"
                            numberOfLines={1}
                            style={[
                                styles.label,
                                { color },
                                isActive && styles.activeLabel,
                            ]}
                        >
                            {tab.label}
                        </AppText>
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    // Flat by design - a hairline top border is enough to separate the
    // bar from page content; the active tab's own icon/label color does
    // the job a shadow or pill background used to.
    container: {
        flexDirection: "row",
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.surface,
        paddingTop: spacing.sm,
    },

    tab: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
    },

    label: {
        fontSize: fontSize.xs,
        fontWeight: fontWeight.medium,
    },

    activeLabel: {
        fontWeight: fontWeight.semibold,
    },
});
