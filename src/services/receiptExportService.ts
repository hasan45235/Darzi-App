import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import { ReceiptData } from "@/components/ReceiptRenderer";
import { buildReceiptHtml } from "@/utils/receiptHtml";

// "Share" covers the case the tailor actually asked for: hand the
// receipt to the OS share sheet as a PDF, so the customer can pick
// WhatsApp, Drive, Files, email, etc. and the OS forwards the file to
// whichever they choose - there's no per-app logic to write here.
export async function shareReceipt(data: ReceiptData): Promise<void> {
    const html = buildReceiptHtml(data);
    const { uri } = await Print.printToFileAsync({ html, base64: false });

    const canShare = await Sharing.isAvailableAsync();

    if (!canShare) {
        throw new Error("Sharing isn't available on this device.");
    }

    await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: `Receipt #${data.order.receiptNumber}`,
        UTI: "com.adobe.pdf",
    });
}

// A separate action for actually printing (or saving to PDF through the
// system print dialog) on a physical/virtual printer, as opposed to
// handing the file to another app.
export async function printReceipt(data: ReceiptData): Promise<void> {
    const html = buildReceiptHtml(data);

    await Print.printAsync({ html });
}
