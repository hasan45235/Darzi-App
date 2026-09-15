import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet } from "react-native";

import { colors } from "@/constants/theme";

// A small "jump to Home" shortcut for the header of every pushed
// (non-tab-root) screen - add/edit forms, detail views, the receipt.
// Those screens already get a native back arrow on the left for free;
// this sits on the right so a tailor three levels deep (e.g. Customer
// Details -> Customer Orders -> Order Details) can get back to Home in
// one tap instead of backing out through every screen in between.
// router.replace (not push) so it doesn't just grow the stack further.
export default function HomeHeaderButton() {
    return (
        <Pressable
            onPress={() => router.replace("/")}
            accessibilityRole="button"
            accessibilityLabel="Go to Home"
            hitSlop={10}
            style={({ pressed }) => [
                styles.button,
                pressed && styles.pressed,
            ]}
        >
            <Ionicons name="home-outline" size={22} color={colors.primary} />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        paddingHorizontal: 8,
        paddingVertical: 4,
    },

    pressed: {
        opacity: 0.6,
    },
});
