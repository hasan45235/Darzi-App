import {
    Image,
    ImageStyle,
    StyleProp,
    StyleSheet,
    View,
    ViewStyle,
} from "react-native";

import AppText from "@/components/AppText";
import { colors, fontWeight } from "@/constants/theme";

type Props = {
    name: string;
    photoUri: string | null;
    size?: number;
    // Typed as ViewStyle since callers only ever pass layout/shadow
    // tweaks (margin, elevation) - those are valid on both View and
    // Image, so it's cast where it lands on the Image below.
    style?: ViewStyle;
};

// A palette of theme-consistent [background, text] pairs. Which pair a
// customer gets is derived from their name, so the same customer always
// lands on the same color (no re-render flicker) while a list of
// initials-only rows still reads as visually distinct people rather than
// a wall of identical gray boxes.
const PALETTE: readonly [string, string][] = [
    [colors.primaryLight, colors.primaryDark],
    [colors.secondaryLight, colors.secondaryDark],
    [colors.successLight, colors.success],
    [colors.warningLight, colors.warning],
    [colors.dangerLight, colors.danger],
];

function getInitials(name: string): string {
    const words = name.trim().split(/\s+/).filter(Boolean);

    if (words.length === 0) {
        return "?";
    }

    if (words.length === 1) {
        return words[0].slice(0, 2).toUpperCase();
    }

    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function getPaletteIndex(name: string): number {
    let hash = 0;

    for (let i = 0; i < name.length; i++) {
        hash = (hash * 31 + name.charCodeAt(i)) % PALETTE.length;
    }

    return Math.abs(hash) % PALETTE.length;
}

// Shows the customer's photo when they have one, otherwise a colored
// circle with their initials - used anywhere a photo placeholder would
// otherwise just be a flat gray box (customer list rows, profile header).
export default function CustomerAvatar({
    name,
    photoUri,
    size = 48,
    style,
}: Props) {
    const dimension = { width: size, height: size, borderRadius: size / 2 };

    if (photoUri) {
        return (
            <Image
                source={{ uri: photoUri }}
                style={[dimension, style] as StyleProp<ImageStyle>}
            />
        );
    }

    const [background, foreground] = PALETTE[getPaletteIndex(name)];

    return (
        <View
            style={[
                dimension,
                styles.fallback,
                { backgroundColor: background },
                style,
            ]}
        >
            <AppText
                variant="body"
                style={{
                    color: foreground,
                    fontWeight: fontWeight.bold,
                    fontSize: size / 2.4,
                }}
            >
                {getInitials(name)}
            </AppText>
        </View>
    );
}

const styles = StyleSheet.create({
    fallback: {
        justifyContent: "center",
        alignItems: "center",
    },
});
