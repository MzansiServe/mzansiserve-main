import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Heart, ShoppingBag } from 'lucide-react-native';
import { COLORS, SPACING, SIZES, SHADOWS } from '../constants/Theme';
import { Typography } from '../components/UI/Typography';
import { useCart } from '../contexts/CartContext'; // Or wishlist context if it exists
import { Card } from '../components/UI/Card';

export default function Wishlist() {
    const router = useRouter();

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.iconCircle}>
                <Heart size={48} color={COLORS.error} fill={COLORS.error + '20'} />
            </View>
            <Typography variant="h2" weight="bold" style={{ marginTop: SPACING.xl }}>
                Your Wishlist is Empty
            </Typography>
            <Typography variant="body" color={COLORS.gray[500]} align="center" style={{ marginTop: SPACING.sm, paddingHorizontal: SPACING.xl }}>
                Tap the heart icon on services or products to save them for later.
            </Typography>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <ArrowLeft color={COLORS.gray[800]} size={24} />
                </TouchableOpacity>
                <Typography variant="h2" weight="bold" style={{ marginLeft: SPACING.md }}>
                    My Wishlist
                </Typography>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {renderEmpty()}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.gray[50],
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.xxl,
        paddingBottom: SPACING.md,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray[100],
    },
    backButton: {
        width: 40,
        height: 40,
        backgroundColor: COLORS.gray[50],
        borderRadius: SIZES.radius.full,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        flexGrow: 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
        marginTop: 100,
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.error + '10',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
