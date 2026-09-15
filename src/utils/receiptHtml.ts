import { ReceiptData } from "@/components/ReceiptRenderer";

import {
    colors,
    fontSize,
    fontWeight,
    radius,
    spacing,
} from "@/constants/theme";

import {
    ORDER_STATUS_COLORS,
    ORDER_STATUS_LABELS,
} from "@/constants/orderStatus";

import { OrderItem } from "@/types/order";
import { formatCurrency } from "@/utils/formatCurrency";

// Renders the same ReceiptData that ReceiptRenderer.tsx shows on screen
// as a standalone HTML document, for expo-print to turn into a PDF
// (receiptExportService.ts). A PDF needs plain HTML/CSS rather than React
// Native views, so this is necessarily a second layout - but it's driven
// by the exact same data shape and mirrors the same sections (brand
// header, billed-to/order-info, items table, totals, notes), so the two
// can't drift apart on *content*, only on markup. The customer's photo
// is intentionally left out here: it's a quick-identification aid for
// the tailor browsing the app, not something a customer needs to see on
// their own receipt.
export function buildReceiptHtml({
    order,
    items,
    customer,
    business,
}: ReceiptData): string {
    const subtotal = items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
    );

    const hasAdjustments = order.discount > 0 || order.addition > 0;
    const statusColor = ORDER_STATUS_COLORS[order.status];

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>${STYLES}</style>
</head>
<body>
    <div class="paper">
        <div class="brand-row">
            <div class="brand-info">
                <div class="business-name">${escapeHtml(business.name)}</div>
                ${business.subtitle ? `<div class="business-subtitle">${escapeHtml(business.subtitle)}</div>` : ""}
                ${business.phone ? `<div class="caption">${escapeHtml(business.phone)}</div>` : ""}
            </div>

            <div class="receipt-badge">
                <div class="receipt-badge-label">RECEIPT</div>
                <div class="receipt-badge-number">#${order.receiptNumber}</div>
            </div>
        </div>

        <div class="divider"></div>

        <div class="meta-grid">
            <div class="meta-column">
                <div class="meta-label">BILLED TO</div>
                <div class="customer-name">${escapeHtml(customer.name)}</div>
                <div class="caption">#${customer.customerNumber} &middot; ${escapeHtml(customer.phone)}</div>
            </div>

            <div class="meta-column meta-column-right">
                <div class="meta-label">ORDER INFO</div>
                <div class="meta-line"><span class="caption">Ordered</span><span>${displayDate(order.orderDate)}</span></div>
                <div class="meta-line"><span class="caption">Delivery</span><span class="delivery-date">${displayDate(order.deliveryDate)}</span></div>
                <div class="status-badge" style="background:${statusColor.background};color:${statusColor.text};">
                    ${ORDER_STATUS_LABELS[order.status]}
                </div>
            </div>
        </div>

        ${order.tailoringDetails
            ? `<div class="note-box">
                <div class="meta-label">SPECIAL INSTRUCTIONS</div>
                <div>${escapeHtml(order.tailoringDetails)}</div>
            </div>`
            : ""
        }

        <div class="divider"></div>

        <table class="items">
            <thead>
                <tr>
                    <th class="th-item">ITEM</th>
                    <th class="th-qty">QTY</th>
                    <th class="th-amount">AMOUNT</th>
                </tr>
            </thead>

            <tbody>
                ${items.map((item) => itemRowHtml(item, business.currency)).join("")}
            </tbody>
        </table>

        <div class="divider"></div>

        <div class="totals">
            ${hasAdjustments
                ? `<div class="total-row"><span class="secondary">Subtotal</span><span>${formatCurrency(subtotal, business.currency)}</span></div>`
                : ""
            }
            ${order.discount > 0
                ? `<div class="total-row"><span class="secondary">Discount</span><span>-${formatCurrency(order.discount, business.currency)}</span></div>`
                : ""
            }
            ${order.addition > 0
                ? `<div class="total-row"><span class="secondary">Addition</span><span>+${formatCurrency(order.addition, business.currency)}</span></div>`
                : ""
            }

            <div class="grand-total-row">
                <span class="grand-total-label">Total</span>
                <span class="grand-total-value">${formatCurrency(order.total, business.currency)}</span>
            </div>

            <div class="total-row"><span class="secondary">Paid</span><span>${formatCurrency(order.paid, business.currency)}</span></div>

            ${order.remaining > 0
                ? `<div class="balance-row"><span class="balance-label">Balance Due</span><span class="balance-value">${formatCurrency(order.remaining, business.currency)}</span></div>`
                : ""
            }
        </div>

        ${business.warning
            ? `<div class="warning-box">${escapeHtml(business.warning)}</div>`
            : ""
        }

        <div class="thank-you">Thank you for choosing ${escapeHtml(business.name)}!</div>
    </div>
</body>
</html>`;
}

function itemRowHtml(item: OrderItem, currency: string): string {
    const tags: string[] = [];

    if (item.designType === "design") {
        tags.push("Custom design");
    }

    if (item.buttonType === "fancy") {
        tags.push("Fancy buttons");
    }

    return `<tr>
        <td class="td-item">
            <div class="item-name">${escapeHtml(item.name)}</div>
            ${tags.length > 0 ? `<div class="item-tags">${escapeHtml(tags.join(" · "))}</div>` : ""}
            ${item.notes ? `<div class="caption">${escapeHtml(item.notes)}</div>` : ""}
        </td>
        <td class="td-qty">${item.quantity}</td>
        <td class="td-amount">${formatCurrency(item.quantity * item.unitPrice, currency)}</td>
    </tr>`;
}

function displayDate(dateString: string): string {
    const [year, month, day] = dateString.split("-");

    if (!year || !month || !day) {
        return dateString;
    }

    return `${day}-${month}-${year}`;
}

// Minimal HTML-escaping for user-entered text (names, notes, business
// info) - this string gets parsed as HTML by the print engine, so
// anything typed with "<", "&", etc. needs to stay inert text rather
// than being interpreted as markup.
function escapeHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

const STYLES = `
    * { box-sizing: border-box; }
    body {
        margin: 0;
        padding: ${spacing.xxl}px;
        background: ${colors.background};
        font-family: -apple-system, Roboto, Helvetica, Arial, sans-serif;
        color: ${colors.text};
        font-size: ${fontSize.md}px;
    }
    .paper {
        background: ${colors.surface};
        border-radius: ${radius.lg}px;
        padding: ${spacing.xl}px;
        max-width: 480px;
        margin: 0 auto;
    }
    .brand-row { display: flex; justify-content: space-between; align-items: flex-start; gap: ${spacing.md}px; }
    .brand-info { flex: 1; }
    .business-name { font-size: ${fontSize.xl}px; font-weight: ${fontWeight.bold}; color: ${colors.secondary}; }
    .business-subtitle { color: ${colors.primaryDark}; margin-top: 2px; }
    .caption { font-size: ${fontSize.sm}px; color: ${colors.textMuted}; }
    .receipt-badge { background: ${colors.secondary}; border-radius: ${radius.md}px; padding: ${spacing.sm}px ${spacing.md}px; text-align: right; }
    .receipt-badge-label { font-size: ${fontSize.xs}px; font-weight: ${fontWeight.semibold}; color: ${colors.primaryLight}; letter-spacing: 1px; }
    .receipt-badge-number { font-size: ${fontSize.lg}px; font-weight: ${fontWeight.bold}; color: ${colors.white}; }
    .divider { height: 1px; background: ${colors.border}; margin: ${spacing.lg}px 0; }
    .meta-grid { display: flex; gap: ${spacing.lg}px; }
    .meta-column { flex: 1; }
    .meta-column-right { text-align: right; }
    .meta-label { font-size: ${fontSize.xs}px; letter-spacing: 0.5px; color: ${colors.textMuted}; margin-bottom: ${spacing.xs}px; }
    .customer-name { font-size: ${fontSize.md}px; font-weight: ${fontWeight.semibold}; }
    .meta-line { display: flex; justify-content: space-between; gap: ${spacing.md}px; margin-bottom: 2px; }
    .delivery-date { font-weight: ${fontWeight.semibold}; color: ${colors.primaryDark}; }
    .status-badge { display: inline-block; margin-top: ${spacing.xs}px; padding: 2px ${spacing.md}px; border-radius: ${radius.round}px; font-size: ${fontSize.sm}px; font-weight: ${fontWeight.medium}; }
    .note-box { margin-top: ${spacing.lg}px; background: ${colors.background}; border-left: 3px solid ${colors.primary}; border-radius: ${radius.sm}px; padding: ${spacing.md}px; }
    table.items { width: 100%; border-collapse: collapse; }
    .th-item, .td-item { text-align: left; }
    .th-qty, .td-qty { width: 48px; text-align: center; }
    .th-amount, .td-amount { width: 100px; text-align: right; }
    thead th { font-size: ${fontSize.xs}px; letter-spacing: 0.5px; color: ${colors.textMuted}; font-weight: ${fontWeight.regular}; padding-bottom: ${spacing.sm}px; }
    tbody td { padding: ${spacing.sm}px 0; border-bottom: 1px solid ${colors.border}; vertical-align: top; }
    tbody tr:last-child td { border-bottom: none; }
    .item-name { font-weight: ${fontWeight.medium}; }
    .item-tags { font-size: ${fontSize.sm}px; color: ${colors.primaryDark}; }
    .td-amount { font-weight: ${fontWeight.medium}; }
    .totals { display: flex; flex-direction: column; gap: ${spacing.xs}px; }
    .total-row { display: flex; justify-content: space-between; }
    .secondary { color: ${colors.textSecondary}; }
    .grand-total-row { display: flex; justify-content: space-between; align-items: center; margin-top: ${spacing.xs}px; padding-top: ${spacing.sm}px; border-top: 1px solid ${colors.border}; }
    .grand-total-label { font-weight: ${fontWeight.semibold}; color: ${colors.textSecondary}; }
    .grand-total-value { font-size: ${fontSize.huge}px; font-weight: ${fontWeight.bold}; color: ${colors.secondary}; }
    .balance-row { display: flex; justify-content: space-between; align-items: center; margin-top: ${spacing.xs}px; padding-top: ${spacing.sm}px; border-top: 1px solid ${colors.dangerLight}; }
    .balance-label { font-weight: ${fontWeight.semibold}; color: ${colors.danger}; }
    .balance-value { font-size: ${fontSize.lg}px; font-weight: ${fontWeight.bold}; color: ${colors.danger}; }
    .warning-box { margin-top: ${spacing.lg}px; background: ${colors.dangerLight}; border-left: 4px solid ${colors.danger}; border-radius: ${radius.sm}px; padding: ${spacing.md}px; color: ${colors.danger}; font-weight: ${fontWeight.medium}; font-size: ${fontSize.sm}px; }
    .thank-you { text-align: center; margin-top: ${spacing.lg}px; color: ${colors.textSecondary}; font-style: italic; }
`;
