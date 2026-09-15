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

// Saves a picked photo into the app's managed customer-images
// directory and returns just its FILENAME, not a full URI.
//
// Only the filename is stored in the database. The absolute path to
// the app's document directory isn't guaranteed to stay the same
// across reinstalls (and on iOS, sometimes across updates too) - if
// we stored the full resolved URI, every saved photo could silently
// stop loading the next time the OS moves that directory. Re-deriving
// the full path on every read via resolveCustomerImageUri() avoids
// that entirely.
export function saveCustomerImage(
    sourceUri: string,
    customerId: number
): string {
    const directory = ensureImageDirectory();

    const source = new File(sourceUri);

    // Normalize whether File.extension comes back as "jpg" or ".jpg".
    const rawExtension = source.extension || "jpg";
    const extension = rawExtension.startsWith(".")
        ? rawExtension
        : `.${rawExtension}`;

    const filename =
        `customer-${customerId}-${Date.now()}${extension}`;

    const destination = new File(
        directory,
        filename
    );

    source.copy(destination);

    return filename;
}

// Turns a stored photo reference into a URI that's usable right now.
// Handles every shape that can end up in the `photo_uri` column:
//   - null/empty                          -> null
//   - a fully-qualified URI (a freshly     -> used as-is
//     picked photo, or a legacy absolute
//     path saved before filenames-only
//     storage)
//   - a bare filename saved under the      -> re-resolved against the
//     managed customer-images directory       CURRENT document directory
export function resolveCustomerImageUri(
    value: string | null
): string | null {
    if (!value) {
        return null;
    }

    if (value.includes("://")) {
        return value;
    }

    return new File(
        getCustomerImageDirectory(),
        value
    ).uri;
}

export function deleteCustomerImage(
    value: string | null
): void {
    if (!value) {
        return;
    }

    try {
        const uri = resolveCustomerImageUri(value);

        if (!uri) {
            return;
        }

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