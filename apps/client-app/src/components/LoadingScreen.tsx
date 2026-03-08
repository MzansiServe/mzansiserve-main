import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';

export default function LoadingScreen({ message = 'Loading...' }) {
    const spinValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.timing(spinValue, {
                toValue: 1,
                duration: 1500,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
    }, [spinValue]);

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={styles.container}>
            <View style={styles.loaderWrapper}>
                <Animated.View style={[styles.ring, { transform: [{ rotate: spin }] }]}>
                    <View style={styles.dot} />
                </Animated.View>
                <Text style={styles.text}>{message}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loaderWrapper: {
        alignItems: 'center',
    },
    ring: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 3,
        borderColor: '#7c3aed',
        borderTopColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#a78bfa',
        position: 'absolute',
        top: -4,
    },
    text: {
        marginTop: 20,
        color: '#94a3b8',
        fontSize: 15,
        fontWeight: '600',
        letterSpacing: 1,
    },
});
