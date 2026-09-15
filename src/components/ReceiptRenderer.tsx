import { StyleSheet, View } from "react-native";

import AppText from "@/components/AppText";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import ViewableCustomerAvatar from "@/components/ViewableCustomerAvatar";

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

// Shared by the in-app preview (this component) and the exported
// PDF/print HTML (receiptHtml.ts) - one type so both stay in sync with
// whatever data a receipt actually needs.
export type ReceiptData = {
    order: Order;
    items: OrderItem[];
    customer: Customer;
    business: ReceiptBusinessInfo;
};

type Props = ReceiptData;

function displayDate(dateString: string): string {
    const [year, month, day] = dateString.split("-");

    if (!year || !month || !day) {
        return dateString;
    }

    return `${day}-${month}-${year}`;
}

// A single item's design/button-type call-outs, shown as small inline
// tags under its name (e.g. "Custom design · Fancy buttons") instead of
// one combined block for the whole order - the customer can see at a
// glance exactly which item they apply to.
function itemTags(item: OrderItem): string | null {
    const tags: string[] = [];

    if (item.designType === "design") {
        tags.push("Custom design");
    }

    if (item.buttonType === "fancy") {
        tags.push("Fancy buttons");
    }

    return tags.length > 0 ? tags.join(" · ") : null;
}

// The single source of truth for what a receipt looks like on screen.
// receiptHtml.ts renders the same data as a standalone HTML document for
// PDF export/printing/sharing - a separate file since a PDF needs plain
// HTML/CSS rather than React Native views, but both are driven by this
// same ReceiptData shape so neither can drift out of sync with what a
// receipt actually contains.
export default function ReceiptRenderer({
    order,
    items,
    customer,
    business,
}: Props) {
    const subtotal = items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
    );

    const hasAdjustments = order.discount > 0 || order.addition > 0;

    return (
        <View style={styles.paper}>
            <View style={styles.brandRow}>
                <View style={styles.brandInfo}>
                    <AppText style={styles.businessName}>
                        {business.name}
                    </AppText>

                    {business.subtitle ? (
                        <AppText variant="caption" style={styles.businessSubtitle}>
                            {business.subtitle}
                        </AppText>
                    ) : null}

                    {business.phone ? (
                        <AppText variant="caption">
                            {business.phone}
                        </AppText>
                    ) : null}
                </View>

                <View style={styles.receiptBadge}>
                    <AppText style={styles.receiptBadgeLabel}>
                        RECEIPT
                    </AppText>

                    <AppText style={styles.receiptBadgeNumber}>
                        #{order.receiptNumber}
                    </AppText>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.metaGrid}>
                <View style={styles.metaColumn}>
                    <AppText variant="caption" style={styles.metaLabel}>
                        BILLED TO
                    </AppText>

                    <View style={styles.customerRow}>
                        <ViewableCustomerAvatar
                            name={customer.name}
                            photoUri={resolveCustomerImageUri(
                                customer.photoUri
                            )}
                            size={40}
                        />

                        <View style={styles.customerText}>
                            <AppText
                                style={styles.customerName}
                                numberOfLines={1}
                            >
                                {customer.name}
                            </AppText>

                            <AppText variant="caption" numberOfLines={1}>
                                #{customer.customerNumber} · {customer.phone}
                            </AppText>
                        </View>
                    </View>
                </View>

                <View style={styles.metaColumn}>
                    <AppText variant="caption" style={styles.metaLabel}>
                        ORDER INFO
                    </AppText>

                    <View style={styles.metaLine}>
                        <AppText variant="caption">Ordered</AppText>

                        <AppText variant="body">
                            {displayDate(order.orderDate)}
                        </AppText>
                    </View>

                    <View style={styles.metaLine}>
                        <AppText variant="caption">Delivery</AppText>

                        <AppText style={styles.deliveryDate}>
                            {displayDate(order.deliveryDate)}
                        </AppText>
                    </View>

                    <OrderStatusBadge
                        status={order.status}
                        style={styles.statusBadge}
                    />
                </View>
            </View>

            {order.tailoringDetails ? (
                <View style={styles.noteBox}>
                    <AppText variant="caption" style={styles.noteLabel}>
                        SPECIAL INSTRUCTIONS
                    </AppText>

                    <AppText variant="body">
                        {order.tailoringDetails}
                    </AppText>
                </View>
            ) : null}

            <View style={styles.divider} />

            <View style={styles.tableHeader}>
                <AppText
                    variant="caption"
                    style={[styles.th, styles.thItem]}
                >
                    ITEM
                </AppText>

                <AppText
                    variant="caption"
                    style={[styles.th, styles.thQty]}
                >
                    QTY
                </AppText>

                <AppText
                    variant="caption"
                    style={[styles.th, styles.thAmount]}
                >
                    AMOUNT
                </AppText>
            </View>

            {items.map((item, index) => {
                const tags = itemTags(item);

                return (
                    <View
                        key={item.id}
                        style={[
                            styles.tableRow,
                            index === items.length - 1 &&
                            styles.tableRowLast,
                        ]}
                    >
                        <View style={styles.thItem}>
                            <AppText style={styles.itemName}>
                                {item.name}
                            </AppText>

                            {tags ? (
                                <AppText
                                    variant="caption"
                                    style={styles.itemTags}
                                >
                                    {tags}
                                </AppText>
                            ) : null}

                            {item.notes ? (
                                <AppText variant="caption">
                                    {item.notes}
                                </AppText>
                            ) : null}
                        </View>

                        <AppText style={styles.thQty}>
                            {item.quantity}
                        </AppText>

                        <AppText style={[styles.thAmount, styles.itemAmount]}>
                            {formatCurrency(
                                item.quantity * item.unitPrice,
                                business.currency
                            )}
                        </AppText>
                    </View>
                );
            })}

            <View style={styles.divider} />

            <View style={styles.totals}>
                {hasAdjustments ? (
                    <View style={styles.totalRow}>
                        <AppText variant="secondary">Subtotal</AppText>

                        <AppText variant="body">
                            {formatCurrency(subtotal, business.currency)}
                        </AppText>
                    </View>
                ) : null}

                {order.discount > 0 ? (
                    <View style={styles.totalRow}>
                        <AppText variant="secondary">Discount</AppText>

                        <AppText variant="body">
                            -{formatCurrency(order.discount, business.currency)}
                        </AppText>
                    </View>
                ) : null}

                {order.addition > 0 ? (
                    <View style={styles.totalRow}>
                        <AppText variant="secondary">Addition</AppText>

                        <AppText variant="body">
                            +{formatCurrency(order.addition, business.currency)}
                        </AppText>
                    </View>
                ) : null}

                <View style={styles.grandTotalRow}>
                    <AppText style={styles.grandTotalLabel}>Total</AppText>

                    <AppText style={styles.grandTotalValue}>
                        {formatCurrency(order.total, business.currency)}
                    </AppText>
                </View>

                <View style={styles.totalRow}>
                    <AppText variant="secondary">Paid</AppText>

                    <AppText variant="body">
                        {formatCurrency(order.paid, business.currency)}
                    </AppText>
                </View>

                {order.remaining > 0 ? (
                    <View style={styles.balanceRow}>
                        <AppText style={styles.balanceLabel}>
                            Balance Due
                        </AppText>

                        <AppText style={styles.balanceValue}>
                            {formatCurrency(
                                order.remaining,
                                business.currency
                            )}
                        </AppText>
                    </View>
                ) : null}
            </View>

            {business.warning ? (
                <View style={styles.warningBox}>
                    <AppText style={styles.warningText}>
                        {business.warning}
                    </AppText>
                </View>
            ) : null}

            <AppText style={styles.thankYou}>
                Thank you for choosing {business.name}!
            </AppText>
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

    brandRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: spacing.md,
    },

    brandInfo: {
        flex: 1,
        gap: 2,
    },

    businessName: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        color: colors.secondary,
    },

    businessSubtitle: {
        color: colors.primaryDark,
    },

    // A small branded badge (instead of the business info competing with
    // a customer photo for header space) - immediately tells the reader
    // "this is a receipt" and surfaces the receipt number without a
    // separate meta row.
    receiptBadge: {
        alignItems: "flex-end",
        backgroundColor: colors.secondary,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },

    receiptBadgeLabel: {
        fontSize: fontSize.xs,
        fontWeight: fontWeight.semibold,
        color: colors.primaryLight,
        letterSpacing: 1,
    },

    receiptBadgeNumber: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.white,
    },

    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: spacing.lg,
    },

    metaGrid: {
        flexDirection: "row",
        gap: spacing.lg,
    },

    metaColumn: {
        flex: 1,
        gap: spacing.sm,
    },

    metaLabel: {
        letterSpacing: 0.5,
        color: colors.textMuted,
    },

    customerRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
    },

    customerText: {
        flex: 1,
        gap: 1,
    },

    customerName: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        color: colors.text,
    },

    metaLine: {
        flexDirection: "row",
        justifyContent: "space-between",
    },

    deliveryDate: {
        fontWeight: fontWeight.semibold,
        color: colors.primaryDark,
    },

    statusBadge: {
        marginTop: 2,
    },

    noteBox: {
        marginTop: spacing.lg,
        backgroundColor: colors.background,
        borderLeftWidth: 3,
        borderLeftColor: colors.primary,
        borderRadius: radius.sm,
        padding: spacing.md,
        gap: 2,
    },

    noteLabel: {
        letterSpacing: 0.5,
        color: colors.textMuted,
    },

    tableHeader: {
        flexDirection: "row",
        marginBottom: spacing.sm,
    },

    th: {
        letterSpacing: 0.5,
        color: colors.textMuted,
    },

    thItem: {
        flex: 1,
    },

    thQty: {
        width: 40,
        textAlign: "center",
    },

    thAmount: {
        width: 92,
        textAlign: "right",
    },

    tableRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },

    tableRowLast: {
        borderBottomWidth: 0,
    },

    itemName: {
        fontWeight: fontWeight.medium,
    },

    itemTags: {
        color: colors.primaryDark,
    },

    itemAmount: {
        fontWeight: fontWeight.medium,
    },

    totals: {
        gap: spacing.xs,
    },

    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },

    grandTotalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: spacing.xs,
        paddingTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },

    grandTotalLabel: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        color: colors.textSecondary,
    },

    grandTotalValue: {
        fontSize: fontSize.huge,
        fontWeight: fontWeight.bold,
        color: colors.secondary,
    },

    balanceRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: spacing.xs,
        paddingTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.dangerLight,
    },

    balanceLabel: {
        fontWeight: fontWeight.semibold,
        color: colors.danger,
    },

    balanceValue: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.danger,
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

    thankYou: {
        textAlign: "center",
        marginTop: spacing.lg,
        color: colors.textSecondary,
        fontStyle: "italic",
    },
});
