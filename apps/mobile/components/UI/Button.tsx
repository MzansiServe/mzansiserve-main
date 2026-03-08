import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
    TouchableOpacityProps,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, SIZES, SHADOWS } from '../../constants/Theme';

interface ButtonProps extends TouchableOpacityProps {
    title: string;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    icon?: React.ReactNode;
    fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    fullWidth = true,
    style,
    disabled,
    ...props
}) => {
    const getColors = () => {
        switch (variant) {
            case 'primary': return [COLORS.primary, COLORS.primaryDark] as const;
            case 'secondary': return [COLORS.secondary, '#059669'] as const;
            case 'danger': return [COLORS.error, '#DC2626'] as const;
            default: return [COLORS.white, COLORS.white] as const;
        }
    };

    const getTextStyle = (): TextStyle => {
        const baseStyle: TextStyle = {
            fontWeight: 'bold',
            fontSize: size === 'sm' ? SIZES.font.sm : size === 'lg' ? SIZES.font.lg : SIZES.font.md,
        };

        if (variant === 'primary' || variant === 'secondary' || variant === 'danger') {
            return { ...baseStyle, color: COLORS.white };
        }
        if (variant === 'outline' || variant === 'ghost') {
            return { ...baseStyle, color: COLORS.primary };
        }
        return baseStyle;
    };

    const containerStyle: any[] = [
        styles.base,
        size === 'sm' ? styles.sm : size === 'lg' ? styles.lg : styles.md,
        fullWidth ? styles.fullWidth : styles.autoWidth,
        variant === 'outline' ? styles.outline : null,
        (disabled || loading) ? styles.disabled : null,
        style,
    ];

    const renderContent = () => (
        <>
            {loading ? (
                <ActivityIndicator color={variant === 'outline' ? COLORS.primary : COLORS.white} />
            ) : (
                <>
                    {icon}
                    <Text style={[getTextStyle(), icon ? { marginLeft: SPACING.sm } : {}]}>{title}</Text>
                </>
            )}
        </>
    );

    if (variant === 'primary' || variant === 'secondary' || variant === 'danger') {
        return (
            <TouchableOpacity
                activeOpacity={0.8}
                disabled={disabled || loading}
                style={containerStyle}
                {...props}
            >
                <LinearGradient
                    colors={getColors()}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradient}
                >
                    {renderContent()}
                </LinearGradient>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            activeOpacity={0.7}
            disabled={disabled || loading}
            style={containerStyle}
            {...props}
        >
            {renderContent()}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    base: {
        borderRadius: SIZES.radius.md,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    sm: { paddingVertical: SPACING.xs, paddingHorizontal: SPACING.md, height: 40 },
    md: { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.lg, height: 52 },
    lg: { paddingVertical: SPACING.md, paddingHorizontal: SPACING.xl, height: 60 },
    fullWidth: { width: '100%' },
    autoWidth: { alignSelf: 'flex-start' },
    gradient: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        paddingHorizontal: SPACING.lg,
    },
    outline: {
        borderWidth: 1.5,
        borderColor: COLORS.primary,
        backgroundColor: 'transparent',
    },
    disabled: {
        opacity: 0.6,
    },
});

export default Button;
