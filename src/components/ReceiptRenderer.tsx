import { StyleSheet, View } from "react-native";

import AppText from "@/components/AppText";
import CustomerAvatar from "@/components/CustomerAvatar";

import { resolveCustomerImageUri } from "@/services/customerImageService";

import {
    colors,
    fontSize,
    fontWeight,
    radius,
    shadows,
    spacing,
} from "@/constants/theme";

import { formatCurrency } from "@/utils/formatCurrency";

import { Customer } from "@/types/customer";
import { Order, OrderItem } from "@/types/order";

export type ReceiptBusinessInfo = {
    name: string;
    subtitle: string;
    phone: string;
    currency: string;
    warning: string;
};

type Props = {
    order: Order;
    items: OrderItem[];
    customer: Customer;
    business: ReceiptBusinessInfo;
};

function displayDate(dateString: string): string {
    const [year, month, day] = dateString.split("-");

    if (!year || !month || !day) {
        return dateString;
    }

    return `${day}-${month}-${year}`;
}

// The single source of truth for what a receipt looks like. This same
// component renders the in-app preview today, and is meant to back a
// PDF/print export later (Phase 5) - reusing it there instead of
// building a second layout is what keeps the two from ever drifting
// apart.
export default function ReceiptRenderer({
    order,
    items,
    customer,
    business,
}: Props) {
    // The "custom work" block (tailoring note + button style) only earns
    // its place on the receipt when there's something non-default to
    // say - a plain order with no note and stock buttons doesn't need a
    // whole extra section just to state the obvious.
    const hasTailoringNote = Boolean(order.tailoringDetails?.trim());
    const hasCustomDesign = items.some(
        (item) => item.designType === "design"
    );
    const hasFancyButtons = items.some(
        (item) => item.buttonType === "fancy"
    );
    const showDesignBlock =
        hasTailoringNote || hasCustomDesign || hasFancyButtons;

    return (
        <View style={styles.paper}>
            <View style={styles.header}>
                <View style={styles.businessInfo}>
                    <AppText style={styles.businessName}>
                        {business.name}
                    </AppText>

                    {business.subtitle ? (
                        <AppText variant="secondary">
                            {business.subtitle}
                        </AppText>
                    ) : null}

                    {business.phone ? (
                        <AppText variant="secondary">
                            {business.phone}
                        </AppText>
                    ) : null}
                </View>

                <CustomerAvatar
                    name={customer.name}
                    photoUri={resolveCustomerImageUri(customer.photoUri)}
                    size={64}
                />
            </View>

            <AppText style={styles.customerLine}>
                {customer.name} - {customer.customerNumber}
            </AppText>

            <View style={styles.divider} />

            <View style={styles.metaRow}>
                <AppText style={styles.metaLabel}>
                    Receipt No. {order.receiptNumber}
                </AppText>
            </View>

            <View style={styles.metaRow}>
                <AppText style={styles.metaLabel}>
                    Delivery Date
                </AppText>

                <AppText variant="body">
                    {displayDate(order.deliveryDate)}
                </AppText>
            </View>

            {showDesignBlock ? (
                <View style={styles.designBlock}>
                    <View style={styles.designIcon}>
                        <AppText style={styles.designIconText}>
                            S
                        </AppText>
                    </View>

                    <View style={styles.designText}>
                        {hasTailoringNote ? (
                            <AppText style={styles.designNote}>
                                {order.tailoringDetails}
                            </AppText>
                        ) : null}

                        {hasFancyButtons ? (
                            <AppText variant="caption">
                                Buttons - Fancy
                            </AppText>
                        ) : null}
                    </View>
                </View>
            ) : null}

            <AppText variant="secondary" style={styles.itemsHeading}>
                Items
            </AppText>

            <View style={styles.itemsList}>
                {items.map((item, index) => (
                    <View key={item.id} style={styles.itemRow}>
                        <View style={styles.itemNameRow}>
                            <AppText
                                variant="body"
                                style={styles.itemName}
                            >
                                {index + 1}) {item.name}
                            </AppText>

                            <AppText variant="body">
                                Qty. {item.quantity}
                            </AppText>
                        </View>

                        <AppText variant="caption">
                            {formatCurrency(
                                item.unitPrice,
                                business.currency
                            )}{" "}
                            each
                        </AppText>
                    </View>
                ))}
            </View>

            <View style={styles.totalRow}>
                <AppText style={styles.totalLabel}>Total</AppText>

                <AppText style={styles.totalValue}>
                    {formatCurrency(order.total, business.currency)}
                </AppText>
            </View>

            {order.remaining > 0 ? (
                <View style={styles.balanceRow}>
                    <AppText variant="caption">Balance due</AppText>

                    <AppText
                        variant="caption"
                        style={styles.balanceValue}
                    >
                        {formatCurrency(
                            order.remaining,
                            business.currency
                        )}
                    </AppText>
                </View>
            ) : null}

            {business.warning ? (
                <View style={styles.warningBox}>
                    <AppText style={styles.warningText}>
                        {business.warning}
                    </AppText>
                </View>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    paper: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.xl,
        ...shadows.medium,
    },

    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: spacing.md,
    },

    businessInfo: {
        flex: 1,
        gap: 2,
    },

    businessName: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        color: colors.primary,
    },

    customerLine: {
        marginTop: spacing.md,
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.secondary,
    },

    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: spacing.md,
    },

    metaRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: spacing.xs,
    },

    metaLabel: {
        fontWeight: fontWeight.semibold,
        color: colors.secondary,
    },

    designBlock: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        backgroundColor: colors.background,
        borderRadius: radius.md,
        padding: spacing.md,
        marginTop: spacing.md,
    },

    designIcon: {
        width: 36,
        height: 36,
        borderRadius: radius.sm,
        borderWidth: 2,
        borderColor: colors.secondary,
        alignItems: "center",
        justifyContent: "center",
    },

    designIconText: {
        fontWeight: fontWeight.bold,
        color: colors.secondary,
    },

    designText: {
        flex: 1,
        gap: 2,
    },

    designNote: {
        fontWeight: fontWeight.semibold,
        color: colors.secondary,
    },

    itemsHeading: {
        marginTop: spacing.lg,
        marginBottom: spacing.xs,
    },

    itemsList: {
        gap: spacing.sm,
    },

    itemRow: {
        gap: 2,
    },

    itemNameRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },

    itemName: {
        flex: 1,
        fontWeight: fontWeight.medium,
    },

    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: spacing.lg,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },

    totalLabel: {
        fontWeight: fontWeight.semibold,
        color: colors.textSecondary,
    },

    totalValue: {
        fontSize: fontSize.huge,
        fontWeight: fontWeight.bold,
        color: colors.text,
    },

    balanceRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: spacing.xs,
    },

    balanceValue: {
        color: colors.danger,
        fontWeight: fontWeight.semibold,
    },

    warningBox: {
        marginTop: spacing.lg,
        backgroundColor: colors.dangerLight,
        borderLeftWidth: 4,
        borderLeftColor: colors.danger,
        borderRadius: radius.sm,
        padding: spacing.md,
    },

    warningText: {
        color: colors.danger,
        fontWeight: fontWeight.medium,
        fontSize: fontSize.sm,
    },
});
