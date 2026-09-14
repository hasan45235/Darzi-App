import {
    Directory,
    File,
    Paths,
} from "expo-file-system";

const CUSTOMER_IMAGE_DIRECTORY = "customer-images";

function getCustomerImageDirectory(): Directory {
    return new Directory(
        Paths.document,
        CUSTOMER_IMAGE_DIRECTORY
    );
}

function ensureImageDirectory(): Directory {
    const directory = getCustomerImageDirectory();

    if (!directory.exists) {
        directory.create({
            idempotent: true,
            intermediates: true,
        });
    }

    return directory;
}

export function saveCustomerImage(
    sourceUri: string,
    customerId: number
): string {
    const directory = ensureImageDirectory();

    const source = new File(sourceUri);

    const extension =
        source.extension || ".jpg";

    const filename =
        `customer-${customerId}-${Date.now()}${extension}`;

    const destination = new File(
        directory,
        filename
    );

    source.copy(destination);

    return destination.uri;
}

export function deleteCustomerImage(
    uri: string | null
): void {
    if (!uri) {
        return;
    }

    try {
        const file = new File(uri);

        if (file.exists) {
            file.delete();
        }
    } catch (error) {
        console.warn(
            "Failed to delete customer image:",
            error
        );
    }
}