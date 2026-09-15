// A "bespoke tailor" palette - deep navy and antique gold (the classic
// fabric-and-thread pairing), on a warm ivory ground instead of a cold
// corporate gray. Every other file imports these tokens rather than
// hardcoding colors, so the whole app's look lives in one place.
export const colors = {
    primary: "#B8860D",
    primaryDark: "#8A6508",
    primaryLight: "#F7ECD1",

    secondary: "#13294B",
    secondaryDark: "#0B1B33",
    secondaryLight: "#E8ECF3",

    background: "#FAF8F4",
    surface: "#FFFFFF",

    text: "#1A1D29",
    textSecondary: "#5B6472",
    textMuted: "#98A1AC",

    border: "#EAE4D8",

    success: "#1F7A4D",
    successLight: "#E1F3E8",

    danger: "#B3261E",
    dangerLight: "#FBE4E2",

    // Kept visibly distinct from the gold primary (more orange, less
    // yellow) so an "In Progress" badge never reads as a brand accent.
    warning: "#C2540C",
    warningLight: "#FBE7D6",

    white: "#FFFFFF",
    black: "#000000",
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    huge: 40,
};

export const radius = {
    sm: 6,
    md: 10,
    lg: 14,
    xl: 18,
    round: 999,
};

export const fontSize = {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    huge: 34,
};

export const fontWeight = {
    regular: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
};

export const shadows = {
    small: {
        shadowColor: "#000000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
    },

    medium: {
        shadowColor: "#000000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
    },

    // A stronger, warm-tinted lift for elements that should look like
    // they're hovering above the page - currently just the FAB.
    floating: {
        shadowColor: colors.primaryDark,
        shadowOffset: {
            width: 0,
            height: 6,
        },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 8,
    },
};
