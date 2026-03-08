import React, { useState } from 'react';
import {
    View,
    TextInput,
    Text,
    StyleSheet,
    TextInputProps,
    ViewStyle,
    TextStyle,
} from 'react-native';
import { COLORS, SPACING, SIZES } from '../../constants/Theme';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    containerStyle?: ViewStyle;
    inputStyle?: TextStyle;
    icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    containerStyle,
    inputStyle,
    icon,
    onFocus,
    onBlur,
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleFocus = (e: any) => {
        setIsFocused(true);
        onFocus?.(e);
    };

    const handleBlur = (e: any) => {
        setIsFocused(false);
        onBlur?.(e);
    };

    return (
        <View style={[styles.container, containerStyle]}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View
                style={[
                    styles.inputWrapper,
                    isFocused && styles.inputFocused,
                    error && styles.inputError,
                ]}
            >
                {icon && <View style={styles.iconContainer}>{icon}</View>}
                <TextInput
                    style={[styles.input, inputStyle]}
                    placeholderTextColor={COLORS.gray[400]}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    {...props}
                />
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginBottom: SPACING.md,
    },
    label: {
        fontSize: SIZES.font.sm,
        fontWeight: '600',
        color: COLORS.gray[700],
        marginBottom: SPACING.xs,
        marginLeft: 2,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderWidth: 1.5,
        borderColor: COLORS.gray[200],
        borderRadius: SIZES.radius.md,
        height: 52,
        paddingHorizontal: SPACING.md,
    },
    inputFocused: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.white,
    },
    inputError: {
        borderColor: COLORS.error,
    },
    iconContainer: {
        marginRight: SPACING.sm,
    },
    input: {
        flex: 1,
        fontSize: SIZES.font.md,
        color: COLORS.text.primary,
        height: '100%',
    },
    errorText: {
        color: COLORS.error,
        fontSize: SIZES.font.xs,
        marginTop: 4,
        marginLeft: 2,
    },
});

export default Input;
