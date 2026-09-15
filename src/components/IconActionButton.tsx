import { Ionicons } from "@expo/vector-icons";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
} from "react-native";

import { colors } from "@/constants/theme";

type Tone = "neutral" | "danger";

type Props = {
    icon: keyof typeof Ionicons.glyphMap;
    // Screen-reader label - these buttons show an icon only, so this is
    // what accessibility tools actually announce.
    label: string;
    onPress: () => void;
    tone?: Tone;
    loading?: boolean;
    disabled?: boolean;
    size?: number;
};

const TONE_COLORS: Record<Tone, { background: string; icon: string }> = {
    neutral: {
        background: colors.secondaryLight,
        icon: colors.secondary,
    },
    danger: {
        background: colors.dangerLight,
        icon: colors.danger,
    },
};

// A small circular icon-only button for a secondary action next to a
// title or header (Edit, Delete) - the same affordance real contact
// and detail-page cards use instead of full-width text buttons for
// actions that aren't the screen's main flow.
export default function IconActionButton({
    icon,
    label,
    onPress,
    tone = "neutral",
    loading = false,
    disabled = false,
    size = 40,
}: Props) {
    const isDisabled = disabled || loading;
    const { background, icon: iconColor } = TONE_COLORS[tone];

    return (
        <Pressable
            onPress={onPress}
            disabled={isDisabled}
            accessibilityRole="button"
            accessibilityLabel={label}
            hitSlop={8}
            style={({ pressed }) => [
                styles.button,
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: background,
                },
                pressed && !isDisabled && styles.pressed,
                isDisabled && styles.disabled,
            ]}
        >
            {loading ? (
                <ActivityIndicator size="small" color={iconColor} />
            ) : (
                <Ionicons
                    name={icon}
                    size={Math.round(size * 0.45)}
                    color={iconColor}
                />
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        alignItems: "center",
        justifyContent: "center",
    },

    pressed: {
        opacity: 0.7,
    },

    disabled: {
        opacity: 0.4,
    },
});
