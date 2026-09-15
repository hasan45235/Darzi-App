// Manual thousands-grouping instead of Number.toLocaleString()/Intl -
// their locale/currency-formatting support is inconsistent across
// Hermes builds on older Android devices, and this app only ever needs
// one simple format ("<code> 9,000"), so a small hand-rolled version is
// more predictable than relying on platform ICU data being present.
export function formatCurrency(
    amount: number,
    currencyCode: string
): string {
    const rounded = Math.round(amount);
    const isNegative = rounded < 0;

    const digits = Math.abs(rounded).toString();

    let grouped = "";

    for (let i = 0; i < digits.length; i++) {
        const positionFromEnd = digits.length - i;

        if (i > 0 && positionFromEnd % 3 === 0) {
            grouped += ",";
        }

        grouped += digits[i];
    }

    return `${isNegative ? "-" : ""}${currencyCode} ${grouped}`;
}
