import { Ionicons } from "@expo/vector-icons";
import { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import AppText from "@/components/AppText";
import {
    colors,
    fontWeight,
    spacing,
} from "@/constants/theme";

type Props = {
    // A photo circle, initials avatar, or small icon - whatever leads
    // the row. Optional so this also works for rows with no visual
    // identity (e.g. a plain settings entry).
    leading?: ReactNode;
    title: string;
    subtitle?: string;
    caption?: string;
    onPress?: () => void;
    // Custom trailing content (a switch, a value, a button) replaces
    // the default chevron entirely.
    trailing?: ReactNode;
};

// The flat, divider-separated row pattern used by Contacts, Settings,
// and most real-world list UIs - an avatar/icon, one or two lines of
// text, and a chevron hinting the row is tappable. No card shadow, no
// border box - screens using this pair it with a thin
// ItemSeparatorComponent between rows instead.
export default function ListRow({
    leading,
    title,
    subtitle,
    caption,
    onPress,
    trailing,
}: Props) {
    const content = (
        <View style={styles.row}>
            {leading ? (
                <View style={styles.leading}>{leading}</View>
            ) : null}

            <View style={styles.text}>
                <AppText
                    variant="body"
                    numberOfLines={1}
                    style={styles.title}
                >
                    {title}
                </AppText>

                {subtitle ? (
                    <AppText variant="secondary" numberOfLines={1}>
                        {subtitle}
                    </AppText>
                ) : null}

                {caption ? (
                    <AppText variant="caption" numberOfLines={1}>
                        {caption}
                    </AppText>
                ) : null}
            </View>

            {trailing ??
                (onPress ? (
                    <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={colors.textMuted}
                    />
                ) : null)}
        </View>
    );

    if (!onPress) {
        return content;
    }

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                pressed && styles.pressed,
            ]}
        >
            {content}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        paddingVertical: spacing.md,
    },

    pressed: {
        backgroundColor: colors.background,
    },

    leading: {
        // Keeps a photo/icon from being squeezed by a long two-line
        // text block next to it.
        flexShrink: 0,
    },

    text: {
        flex: 1,
        gap: 2,
    },

    title: {
        fontWeight: fontWeight.semibold,
    },
});
