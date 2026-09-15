import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import HomeHeaderButton from "@/components/HomeHeaderButton";
import { ConfirmDialogProvider } from "@/providers/ConfirmDialogProvider";

import { colors, fontSize, fontWeight } from "@/constants/theme";

// The four tab roots draw their own big in-content title (see each
// screen's `styles.header`) and are reached via BottomNav's
// router.replace(), never a pushed "back" navigation - so their native
// header is hidden entirely. Everything else is a screen you drill into
// from a tab (add/edit forms, detail views) and has no in-content way
// back, so it keeps a visible, themed native header with a proper
// Title Case title instead of the lowercase route filename Expo Router
// would otherwise show.
const TAB_ROOTS = ["index", "customers", "orders", "settings"] as const;

// Every pushed (non-tab-root, non-modal) screen gets the same "jump to
// Home" shortcut on the right of its header, next to the native back
// arrow on the left - lets a tailor several screens deep (Customer
// Details -> Customer Orders -> Order Details) return to Home in one
// tap instead of backing out step by step.
const NESTED_HEADER_OPTIONS = {
    headerRight: () => <HomeHeaderButton />,
};

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <StatusBar style="dark" />

            <ConfirmDialogProvider>
                <Stack
                    screenOptions={{
                        headerStyle: { backgroundColor: colors.surface },
                        headerShadowVisible: false,
                        headerTintColor: colors.primary,
                        headerTitleStyle: {
                            color: colors.secondary,
                            fontSize: fontSize.md,
                            fontWeight: fontWeight.semibold,
                        },
                    }}
                >
                    {TAB_ROOTS.map((name) => (
                        <Stack.Screen
                            key={name}
                            name={name}
                            options={{ headerShown: false }}
                        />
                    ))}

                    <Stack.Screen
                        name="add-customer"
                        options={{
                            title: "Add Customer",
                            ...NESTED_HEADER_OPTIONS,
                        }}
                    />
                    <Stack.Screen
                        name="edit-customer"
                        options={{
                            title: "Edit Customer",
                            ...NESTED_HEADER_OPTIONS,
                        }}
                    />
                    <Stack.Screen
                        name="customer-details"
                        options={{
                            title: "Customer Details",
                            ...NESTED_HEADER_OPTIONS,
                        }}
                    />
                    <Stack.Screen
                        name="customer-orders"
                        options={{
                            title: "Customer Orders",
                            ...NESTED_HEADER_OPTIONS,
                        }}
                    />
                    <Stack.Screen
                        name="create-order"
                        options={{
                            title: "New Order",
                            ...NESTED_HEADER_OPTIONS,
                        }}
                    />
                    <Stack.Screen
                        name="edit-order"
                        options={{
                            title: "Edit Order",
                            ...NESTED_HEADER_OPTIONS,
                        }}
                    />
                    <Stack.Screen
                        name="order-details"
                        options={{
                            title: "Order Details",
                            ...NESTED_HEADER_OPTIONS,
                        }}
                    />
                    <Stack.Screen
                        name="receipt"
                        options={{
                            title: "Receipt",
                            ...NESTED_HEADER_OPTIONS,
                        }}
                    />

                    {/* Its own full-screen close button replaces the
                    native header entirely, so it's excluded from
                    NESTED_HEADER_OPTIONS. */}
                    <Stack.Screen
                        name="image-viewer"
                        options={{
                            headerShown: false,
                            presentation: "transparentModal",
                            animation: "fade",
                        }}
                    />
                </Stack>
            </ConfirmDialogProvider>
        </SafeAreaProvider>
    );
}
