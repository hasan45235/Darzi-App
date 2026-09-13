import * as FileSystem from "expo-file-system";

const CUSTOMER_IMAGE_DIRECTORY = "customer-images/";

async function ensureImageDirectory(): Promise<string> {
    if (!FileSystem.documentDirectory) {
        throw new Error("App document directory is unavailable.");
    }

    const directory =
        FileSystem.documentDirectory + CUSTOMER_IMAGE_DIRECTORY;

    const info = await FileSystem.getInfoAsync(directory);

    if (!info.exists) {
        await FileSystem.makeDirectoryAsync(directory, {
            intermediates: true,
        });
    }

    return directory;
}

export async function saveCustomerImage(
    sourceUri: string,
    customerId: number
): Promise<string> {
    const directory = await ensureImageDirectory();

    const extension =
        sourceUri.split(".").pop()?.split("?")[0] || "jpg";

    const destination =
        `${directory}customer-${customerId}-${Date.now()}.${extension}`;

    await FileSystem.copyAsync({
        from: sourceUri,
        to: destination,
    });

    return destination;
}

export async function deleteCustomerImage(
    uri: string | null
): Promise<void> {
    if (!uri) {
        return;
    }

    try {
        const info = await FileSystem.getInfoAsync(uri);

        if (info.exists) {
            await FileSystem.deleteAsync(uri, {
                idempotent: true,
            });
        }
    } catch (error) {
        console.warn(
            "Failed to delete customer image:",
            error
        );
    }
}