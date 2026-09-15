import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

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

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <StatusBar style="dark" />

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
                    options={{ title: "Add Customer" }}
                />
                <Stack.Screen
                    name="edit-customer"
                    options={{ title: "Edit Customer" }}
                />
                <Stack.Screen
                    name="customer-details"
                    options={{ title: "Customer Details" }}
                />
                <Stack.Screen
                    name="customer-orders"
                    options={{ title: "Customer Orders" }}
                />
                <Stack.Screen
                    name="create-order"
                    options={{ title: "New Order" }}
                />
                <Stack.Screen
                    name="edit-order"
                    options={{ title: "Edit Order" }}
                />
                <Stack.Screen
                    name="order-details"
                    options={{ title: "Order Details" }}
                />
                <Stack.Screen
                    name="receipt"
                    options={{ title: "Receipt" }}
                />
            </Stack>
        </SafeAreaProvider>
    );
}
