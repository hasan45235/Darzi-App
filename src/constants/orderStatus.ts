import { colors } from "@/constants/theme";
import { OrderStatus } from "@/types/order";

export const ORDER_STATUSES: OrderStatus[] = [
    "waiting",
    "in_progress",
    "completed",
    "cancelled",
];

// Every new order starts here; the tailor moves it forward manually as
// work progresses.
export const DEFAULT_ORDER_STATUS: OrderStatus = "waiting";

// A customer can't be removed (not even soft-deleted) while they have an
// order in one of these states - there's still work owed to them.
export const BLOCKING_ORDER_STATUSES: OrderStatus[] = [
    "waiting",
    "in_progress",
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
    waiting: "Waiting",
    in_progress: "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
};

export const ORDER_STATUS_COLORS: Record<
    OrderStatus,
    { text: string; background: string }
> = {
    waiting: {
        text: colors.textSecondary,
        background: colors.secondaryLight,
    },
    in_progress: {
        text: colors.warning,
        background: colors.warningLight,
    },
    completed: {
        text: colors.success,
        background: colors.successLight,
    },
    cancelled: {
        text: colors.danger,
        background: colors.dangerLight,
    },
};
