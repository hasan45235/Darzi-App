import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, View } from "react-native";

import AppButton from "@/components/AppButton";
import AppText from "@/components/AppText";

import { colors, fontSize, fontWeight, radius, spacing } from "@/constants/theme";

export type ConfirmTone = "danger" | "neutral";

export type ConfirmDialogOptions = {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    // "danger" is for anything destructive/irreversible (delete,
    // permanently remove); "neutral" is for a plain yes/no decision.
    tone?: ConfirmTone;
};

type Props = ConfirmDialogOptions & {
    visible: boolean;
    loading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
};

const TONE_CONFIG: Record<
    ConfirmTone,
    {
        icon: keyof typeof Ionicons.glyphMap;
        iconBackground: string;
        iconColor: string;
        confirmVariant: "danger" | "primary";
    }
> = {
    danger: {
        icon: "warning",
        iconBackground: colors.dangerLight,
        iconColor: colors.danger,
        confirmVariant: "danger",
    },
    neutral: {
        icon: "help-circle",
        iconBackground: colors.primaryLight,
        iconColor: colors.primary,
        confirmVariant: "primary",
    },
};

// The one dialog every destructive or yes/no confirmation in the app
// should use (via useConfirm(), see ConfirmDialogProvider) instead of
// the plain native Alert.alert - a themed card with a tone-colored icon
// reads as part of the app, not an OS-level popup.
export default function ConfirmDialog({
    visible,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    tone = "neutral",
    loading = false,
    onConfirm,
    onCancel,
}: Props) {
    const { icon, iconBackground, iconColor, confirmVariant } =
        TONE_CONFIG[tone];

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={onCancel}
        >
            <Pressable style={styles.backdrop} onPress={onCancel}>
                {/* A no-op Pressable, not a plain View - it claims the
                touch so a tap on the card itself doesn't fall through to
                the backdrop's onPress and dismiss the dialog. */}
                <Pressable style={styles.card} onPress={() => {}}>
                    <View
                        style={[
                            styles.iconCircle,
                            { backgroundColor: iconBackground },
                        ]}
                    >
                        <Ionicons name={icon} size={28} color={iconColor} />
                    </View>

                    <AppText variant="heading" style={styles.title}>
                        {title}
                    </AppText>

                    <AppText variant="secondary" style={styles.message}>
                        {message}
                    </AppText>

                    <View style={styles.actions}>
                        <AppButton
                            title={cancelText}
                            variant="ghost"
                            onPress={onCancel}
                            disabled={loading}
                            style={styles.actionButton}
                        />

                        <AppButton
                            title={confirmText}
                            variant={confirmVariant}
                            onPress={onConfirm}
                            loading={loading}
                            style={styles.actionButton}
                        />
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: "rgba(19,41,75,0.45)",
        alignItems: "center",
        justifyContent: "center",
        padding: spacing.xl,
    },

    card: {
        width: "100%",
        maxWidth: 360,
        backgroundColor: colors.surface,
        borderRadius: radius.xl,
        padding: spacing.xl,
        alignItems: "center",
    },

    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: spacing.md,
    },

    title: {
        textAlign: "center",
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
    },

    message: {
        textAlign: "center",
        marginTop: spacing.sm,
    },

    actions: {
        flexDirection: "row",
        gap: spacing.md,
        marginTop: spacing.xl,
        width: "100%",
    },

    actionButton: {
        flex: 1,
    },
});
