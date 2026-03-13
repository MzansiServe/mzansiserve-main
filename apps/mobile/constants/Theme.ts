export const COLORS = {
    primary: '#6366F1', // Indigo 500 (Vibrant)
    primaryDark: '#4338CA', // Indigo 700
    primaryLight: '#A5B4FC', // Indigo 300
    primaryShadow: 'rgba(99, 102, 241, 0.35)',
    
    secondary: '#10B981', // Emerald 500
    secondaryDark: '#059669', // Emerald 600
    secondaryShadow: 'rgba(16, 185, 129, 0.35)',
    
    accent: '#F59E0B', // Amber 500
    error: '#EF4444', // Red 500
    success: '#10B981', // Emerald 500
    warning: '#F59E0B', // Amber 500

    white: '#FFFFFF',
    black: '#000000',

    gray: {
        50: '#F9FAFB',
        100: '#F3F4F6',
        200: '#E5E7EB',
        300: '#D1D5DB',
        400: '#9CA3AF',
        500: '#6B7280',
        600: '#4B5563',
        700: '#374151',
        800: '#1F2937',
        900: '#111827',
    },

    background: '#F9FAFB',
    surface: '#FFFFFF',

    text: {
        primary: '#111827',
        secondary: '#4B5563',
        muted: '#9CA3AF',
        onPrimary: '#FFFFFF',
    },

    border: '#E5E7EB',
};

export const SPACING = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
    xxxl: 56,
};

export const SIZES = {
    radius: {
        sm: 8,
        md: 12,
        lg: 16,
        xl: 24,
        xxl: 32,
        full: 9999,
    },
    font: {
        xs: 12,
        sm: 14,
        md: 16,
        lg: 18,
        xl: 24,
        xxl: 32,
    },
};

export const SHADOWS = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
        elevation: 8,
    },
    primary: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
};

export default {
    COLORS,
    SPACING,
    SIZES,
    SHADOWS,
};
