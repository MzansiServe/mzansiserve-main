import React from 'react';
import { Text as RNText, StyleSheet, TextProps } from 'react-native';
import { COLORS, SIZES } from '../../constants/Theme';

interface TypographyProps extends TextProps {
    variant?: 'h1' | 'h2' | 'h3' | 'subtitle' | 'body' | 'caption' | 'label';
    color?: string;
    weight?: 'normal' | 'medium' | 'semibold' | 'bold';
    align?: 'auto' | 'left' | 'center' | 'right' | 'justify';
}

export const Typography: React.FC<TypographyProps> = ({
    children,
    variant = 'body',
    color = COLORS.text.primary,
    weight,
    align = 'left',
    style,
    ...props
}) => {
    const getFontWeight = () => {
        if (weight) return weight;
        if (variant === 'h1' || variant === 'h2' || variant === 'h3') return 'bold';
        if (variant === 'subtitle' || variant === 'label') return 'semibold';
        return 'normal';
    };

    const getFontSize = () => {
        switch (variant) {
            case 'h1': return SIZES.font.xxl;
            case 'h2': return SIZES.font.xl;
            case 'h3': return SIZES.font.lg;
            case 'subtitle': return SIZES.font.md;
            case 'label': return SIZES.font.sm;
            case 'caption': return SIZES.font.xs;
            default: return SIZES.font.md;
        }
    };

    return (
        <RNText
            style={[
                {
                    fontSize: getFontSize(),
                    fontWeight: getFontWeight(),
                    color,
                    textAlign: align,
                },
                style,
            ]}
            {...props}
        >
            {children}
        </RNText>
    );
};

export default Typography;
