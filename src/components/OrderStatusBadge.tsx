import { StyleSheet, View, ViewStyle } from "react-native";

import AppText from "@/components/AppText";

import { radius, spacing } from "@/constants/theme";
import {
    ORDER_STATUS_COLORS,
    ORDER_STATUS_LABELS,
} from "@/constants/orderStatus";
import { OrderStatus } from "@/types/order";

type Props = {
    status: OrderStatus;
    style?: ViewStyle;
};

export default function OrderStatusBadge({ status, style }: Props) {
    const { text, background } = ORDER_STATUS_COLORS[status];

    return (
        <View
            style={[
                styles.badge,
                { backgroundColor: background },
                style,
            ]}
        >
            <AppText
                variant="caption"
                style={{ color: text }}
            >
                {ORDER_STATUS_LABELS[status]}
            </AppText>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        alignSelf: "flex-start",
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs / 2,
        borderRadius: radius.round,
    },
});
