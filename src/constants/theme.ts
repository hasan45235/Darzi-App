export const colors = {
    primary: "#D97706",
    primaryDark: "#B45309",
    primaryLight: "#FEF3C7",

    secondary: "#17365D",
    secondaryDark: "#102A43",
    secondaryLight: "#E8EEF5",

    background: "#F7F8FA",
    surface: "#FFFFFF",

    text: "#17202A",
    textSecondary: "#667085",
    textMuted: "#98A2B3",

    border: "#E4E7EC",

    success: "#15803D",
    successLight: "#DCFCE7",

    danger: "#B42318",
    dangerLight: "#FEE4E2",

    warning: "#B54708",
    warningLight: "#FEF0C7",

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
};