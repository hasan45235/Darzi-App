import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppText from "@/components/AppText";
import { fontSize, fontWeight, spacing } from "@/constants/theme";

// One global full-screen viewer for any customer photo - pushed as a
// transparent modal (see _layout.tsx) from wherever a customer avatar is
// tappable (ViewableCustomerAvatar). Reads the photo straight out of the
// route params instead of re-fetching the customer, since every caller
// already has the resolved URI in hand.
export default function ImageViewerScreen() {
    const { uri, name } = useLocalSearchParams<{
        uri?: string;
        name?: string;
    }>();

    const insets = useSafeAreaInsets();

    const hasImage = Boolean(uri);

    return (
        <View style={styles.backdrop}>
            <Pressable
                onPress={() => router.back()}
                accessibilityRole="button"
                accessibilityLabel="Close"
                hitSlop={12}
                style={[
                    styles.closeButton,
                    { top: insets.top + spacing.md },
                ]}
            >
                <Ionicons name="close" size={26} color="#FFFFFF" />
            </Pressable>

            {hasImage ? (
                <Image
                    source={{ uri }}
                    style={styles.image}
                    resizeMode="contain"
                />
            ) : (
                <View style={styles.emptyState}>
                    <Ionicons
                        name="image-outline"
                        size={64}
                        color="rgba(255,255,255,0.35)"
                    />

                    <AppText style={styles.emptyTitle}>
                        No image to preview
                    </AppText>

                    <AppText style={styles.emptySubtitle}>
                        {name ? `${name} hasn't added a photo yet.` : ""}
                    </AppText>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    // Near-black rather than pure black so it still reads as an overlay
    // "sheet" above the app instead of a jarring hard cut to black.
    backdrop: {
        flex: 1,
        backgroundColor: "rgba(10,10,15,0.96)",
        alignItems: "center",
        justifyContent: "center",
    },

    closeButton: {
        position: "absolute",
        left: spacing.lg,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.12)",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1,
    },

    image: {
        width: "100%",
        height: "100%",
    },

    emptyState: {
        alignItems: "center",
        gap: spacing.sm,
        paddingHorizontal: spacing.xxl,
    },

    emptyTitle: {
        color: "#FFFFFF",
        fontSize: fontSize.lg,
        fontWeight: fontWeight.semibold,
    },

    emptySubtitle: {
        color: "rgba(255,255,255,0.6)",
        fontSize: fontSize.sm,
        textAlign: "center",
    },
});
