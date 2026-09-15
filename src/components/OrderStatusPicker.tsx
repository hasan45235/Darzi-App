import { Pressable, StyleSheet, View } from "react-native";

import AppText from "@/components/AppText";

import { colors, radius, spacing } from "@/constants/theme";
import {
    ORDER_STATUSES,
    ORDER_STATUS_LABELS,
} from "@/constants/orderStatus";
import { OrderStatus } from "@/types/order";

type Props = {
    value: OrderStatus;
    onChange: (status: OrderStatus) => void;
    disabled?: boolean;
};

// Chip row for picking an order's status - same interaction pattern as
// the Simple/Design item toggle on Create/Edit Order.
export default function OrderStatusPicker({
    value,
    onChange,
    disabled,
}: Props) {
    return (
        <View style={styles.row}>
            {ORDER_STATUSES.map((status) => {
                const isActive = status === value;

                return (
                    <Pressable
                        key={status}
                        disabled={disabled}
                        style={[
                            styles.chip,
                            isActive && styles.chipActive,
                            disabled && styles.chipDisabled,
                        ]}
                        onPress={() => onChange(status)}
                    >
                        <AppText
                            variant="caption"
                            style={
                                isActive
                                    ? styles.textActive
                                    : undefined
                            }
                        >
                            {ORDER_STATUS_LABELS[status]}
                        </AppText>
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.sm,
    },

    chip: {
        paddingHorizontal: 14,
        paddingVertical: spacing.sm,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
    },

    chipActive: {
        borderColor: colors.primary,
        backgroundColor: colors.primary,
    },

    chipDisabled: {
        opacity: 0.5,
    },

    textActive: {
        color: colors.white,
    },
});
