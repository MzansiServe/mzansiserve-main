import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    View,
    ViewStyle,
    TextStyle,
    TouchableOpacityProps,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withSpring,
    withTiming,
    interpolate
} from 'react-native-reanimated';
import { COLORS, SPACING, SIZES, SHADOWS } from '../../constants/Theme';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

interface ButtonProps extends TouchableOpacityProps {
    title: string;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    icon?: React.ReactNode;
    fullWidth?: boolean;
    rounded?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    fullWidth = true,
    rounded = true,
    style,
    disabled,
    onPressIn,
    onPressOut,
    ...props
}) => {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    const handlePressIn = (e: any) => {
        scale.value = withSpring(0.96, { damping: 10, stiffness: 200 });
        opacity.value = withTiming(0.9);
        onPressIn?.(e);
    };

    const handlePressOut = (e: any) => {
        scale.value = withSpring(1);
        opacity.value = withTiming(1);
        onPressOut?.(e);
    };

    const getColors = () => {
        switch (variant) {
            case 'primary': 
                return [COLORS.primaryLight, COLORS.primary, COLORS.primaryDark] as const;
            case 'secondary': 
                return ['#34D399', COLORS.secondary, COLORS.secondaryDark] as const;
            case 'danger': 
                return ['#F87171', COLORS.error, '#B91C1C'] as const;
            default: 
                return [COLORS.white, COLORS.white] as const;
        }
    };

    const getTextStyle = (): TextStyle => {
        const baseStyle: TextStyle = {
            fontWeight: '700',
            fontSize: size === 'sm' ? SIZES.font.sm : size === 'lg' ? SIZES.font.lg : SIZES.font.md,
            letterSpacing: 0.5,
        };

        if (variant === 'primary' || variant === 'secondary' || variant === 'danger') {
            return { ...baseStyle, color: COLORS.white };
        }
        return { ...baseStyle, color: COLORS.primary };
    };

    const containerStyle: any[] = [
        styles.base,
        size === 'sm' ? styles.sm : size === 'lg' ? styles.lg : styles.md,
        fullWidth ? styles.fullWidth : styles.autoWidth,
        rounded ? styles.rounded : styles.standard,
        variant === 'outline' && styles.outline,
        variant === 'ghost' && styles.ghost,
        (variant === 'primary' || variant === 'secondary') && SHADOWS.primary,
        (disabled || loading) && styles.disabled,
        style,
    ];

    const renderContent = () => (
        <>
            {/* Glossy Overlay/Shine */}
            {(variant === 'primary' || variant === 'secondary' || variant === 'danger') && (
                <View style={styles.shine} />
            )}
            
            {loading ? (
                <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? COLORS.primary : COLORS.white} />
            ) : (
                <View style={styles.content}>
                    {icon && <View style={styles.iconContainer}>{icon}</View>}
                    <Text style={getTextStyle()}>{title}</Text>
                </View>
            )}
        </>
    );

    const isGradient = variant === 'primary' || variant === 'secondary' || variant === 'danger';

    return (
        <AnimatedTouchableOpacity
            activeOpacity={1}
            disabled={disabled || loading}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={[containerStyle, animatedStyle]}
            {...props}
        >
            {isGradient ? (
                <LinearGradient
                    colors={getColors()}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradient}
                >
                    {renderContent()}
                </LinearGradient>
            ) : (
                renderContent()
            )}
        </AnimatedTouchableOpacity>
    );
};

const styles = StyleSheet.create({
    base: {
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
    },
    rounded: {
        borderRadius: SIZES.radius.full,
    },
    standard: {
        borderRadius: SIZES.radius.lg,
    },
    sm: { height: 40 },
    md: { height: 56 },
    lg: { height: 64 },
    fullWidth: { width: '100%' },
    autoWidth: { alignSelf: 'flex-start', paddingHorizontal: SPACING.lg },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        marginRight: SPACING.sm,
    },
    gradient: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: SPACING.lg,
    },
    shine: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '50%',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderTopLeftRadius: SIZES.radius.full,
        borderTopRightRadius: SIZES.radius.full,
    },
    outline: {
        borderWidth: 2,
        borderColor: COLORS.primary,
        backgroundColor: 'transparent',
    },
    ghost: {
        backgroundColor: 'transparent',
    },
    disabled: {
        opacity: 0.5,
    },
});

export default Button;
