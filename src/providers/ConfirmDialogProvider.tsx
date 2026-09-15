import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useMemo,
    useState,
} from "react";

import ConfirmDialog, {
    ConfirmDialogOptions,
} from "@/components/ConfirmDialog";

type PendingConfirm = ConfirmDialogOptions & {
    resolve: (confirmed: boolean) => void;
};

type ConfirmFn = (options: ConfirmDialogOptions) => Promise<boolean>;

const ConfirmDialogContext = createContext<ConfirmFn | null>(null);

// App-wide replacement for Alert.alert("Delete...", [...]) confirmations.
// Mounted once at the root (see _layout.tsx) so any screen can just
// `await confirm({...})` and get back whether the user tapped Confirm,
// instead of every delete/deactivate flow building its own Alert wiring.
export function ConfirmDialogProvider({
    children,
}: {
    children: ReactNode;
}) {
    const [pending, setPending] = useState<PendingConfirm | null>(null);

    const confirm = useCallback<ConfirmFn>((options) => {
        return new Promise<boolean>((resolve) => {
            setPending({ ...options, resolve });
        });
    }, []);

    function handleCancel() {
        pending?.resolve(false);
        setPending(null);
    }

    function handleConfirm() {
        pending?.resolve(true);
        setPending(null);
    }

    return (
        <ConfirmDialogContext.Provider value={confirm}>
            {children}

            <ConfirmDialog
                visible={pending !== null}
                title={pending?.title ?? ""}
                message={pending?.message ?? ""}
                confirmText={pending?.confirmText}
                cancelText={pending?.cancelText}
                tone={pending?.tone}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
            />
        </ConfirmDialogContext.Provider>
    );
}

export function useConfirm(): ConfirmFn {
    const context = useContext(ConfirmDialogContext);

    if (!context) {
        throw new Error(
            "useConfirm must be used within a ConfirmDialogProvider."
        );
    }

    return context;
}
