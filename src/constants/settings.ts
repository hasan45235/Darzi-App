export const SETTING_KEYS = {
    businessName: "business_name",
    businessSubtitle: "business_subtitle",
    businessPhone: "business_phone",
    businessAddress: "business_address",
    customerNumberStarting: "customer_number_starting",
    nextCustomerNumber: "next_customer_number",

    basicSuitPrice: "basic_suit_price",
    basicPantPrice: "basic_pant_price",
    basicShirtPrice: "basic_shirt_price",
    currency: "currency",

    startingReceiptNumber: "starting_receipt_number",
    nextReceiptNumber: "next_receipt_number",

    receiptWarning: "receipt_warning",
} as const;

export const DEFAULT_SETTINGS = {
    [SETTING_KEYS.businessName]: "The Stitch Center",
    [SETTING_KEYS.businessSubtitle]: "Gents Specialist",
    [SETTING_KEYS.businessPhone]: "",
    [SETTING_KEYS.businessAddress]: "",
    [SETTING_KEYS.customerNumberStarting]: "2000",
    [SETTING_KEYS.nextCustomerNumber]: "2000",
    [SETTING_KEYS.basicSuitPrice]: "0",
    [SETTING_KEYS.basicPantPrice]: "0",
    [SETTING_KEYS.basicShirtPrice]: "0",

    [SETTING_KEYS.currency]: "PKR",

    [SETTING_KEYS.startingReceiptNumber]: "1",
    [SETTING_KEYS.nextReceiptNumber]: "1",

    [SETTING_KEYS.receiptWarning]:
        "If Order not collected on time, no responsibility will be taken for missing or damage.",
} as const;