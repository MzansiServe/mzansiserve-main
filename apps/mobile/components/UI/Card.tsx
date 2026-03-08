import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity, TouchableOpacityProps, StyleProp } from 'react-native';
import { COLORS, SPACING, SIZES, SHADOWS } from '../../constants/Theme';

interface CardProps {
    children: React.ReactNode;
    padding?: keyof typeof SPACING;
    shadow?: keyof typeof SHADOWS;
    onPress?: TouchableOpacityProps['onPress'];
    backgroundColor?: string;
    borderRadius?: number;
    style?: StyleProp<ViewStyle>;
}

export const Card: React.FC<CardProps> = ({
    children,
    padding = 'md',
    shadow = 'sm',
    onPress,
    backgroundColor = COLORS.surface,
    borderRadius = SIZES.radius.lg,
    style,
    ...props
}) => {
    const Container = onPress ? TouchableOpacity : View;

    return (
        <Container
            activeOpacity={onPress ? 0.9 : 1}
            onPress={onPress}
            style={[
                styles.base,
                {
                    padding: SPACING[padding],
                    backgroundColor,
                    borderRadius,
                    ...SHADOWS[shadow],
                    borderWidth: 1,
                    borderColor: COLORS.gray[100],
                },
                style,
            ]}
            {...props}
        >
            {children}
        </Container>
    );
};

const styles = StyleSheet.create({
    base: {
        width: '100%',
        marginBottom: SPACING.md,
    },
});

export default Card;
