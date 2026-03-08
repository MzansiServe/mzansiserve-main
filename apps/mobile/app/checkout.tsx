import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle, MapPin, CreditCard } from 'lucide-react-native';
import { COLORS, SPACING, SIZES, SHADOWS } from '../constants/Theme';
import { Typography } from '../components/UI/Typography';
import { useCart } from '../contexts/CartContext';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';

export default function Checkout() {
    const router = useRouter();
    const { total, clearCart } = useCart();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handlePlaceOrder = () => {
        // In a real app this would call an API
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setSuccess(true);
            clearCart();
        }, 1500);
    };

    if (success) {
        return (
            <View style={styles.successContainer}>
                <CheckCircle size={80} color={COLORS.primary} />
                <Typography variant="h1" weight="bold" style={{ marginTop: SPACING.xl }}>
                    Order Confirmed!
                </Typography>
                <Typography variant="body" color={COLORS.gray[500]} align="center" style={{ marginTop: SPACING.md, paddingHorizontal: SPACING.xl }}>
                    Your purchase was successful. Detailed tracking information has been sent to your email.
                </Typography>
                <Button
                    title="Continue Shopping"
                    onPress={() => router.replace('/(tabs)/shop')}
                    style={{ marginTop: SPACING.xxl, width: 250 }}
                />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <ArrowLeft color={COLORS.gray[800]} size={24} />
                </TouchableOpacity>
                <Typography variant="h2" weight="bold" style={{ marginLeft: SPACING.md }}>
                    Secure Checkout
                </Typography>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MapPin color={COLORS.primary} size={20} />
                        <Typography variant="subtitle" weight="bold" style={{ marginLeft: SPACING.sm }}>
                            Shipping Address
                        </Typography>
                    </View>
                    <View style={styles.card}>
                        <Input placeholder="Full Name" defaultValue="John Doe" />
                        <Input placeholder="Street Address" defaultValue="123 Nelson Mandela Blvd" containerStyle={{ marginTop: SPACING.sm }} />
                        <Input placeholder="City" defaultValue="Cape Town" containerStyle={{ marginTop: SPACING.sm }} />
                        <Input placeholder="Postal Code" defaultValue="8001" keyboardType="numeric" containerStyle={{ marginTop: SPACING.sm }} />
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <CreditCard color={COLORS.primary} size={20} />
                        <Typography variant="subtitle" weight="bold" style={{ marginLeft: SPACING.sm }}>
                            Payment Method
                        </Typography>
                    </View>
                    <View style={styles.card}>
                        <Input placeholder="Card Number" defaultValue="**** **** **** 4242" keyboardType="numeric" icon={<CreditCard color={COLORS.gray[400]} size={20} />} />
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.sm }}>
                            <Input placeholder="MM/YY" defaultValue="12/26" containerStyle={{ flex: 1, marginRight: SPACING.sm }} />
                            <Input placeholder="CVC" defaultValue="123" keyboardType="numeric" secureTextEntry containerStyle={{ flex: 1 }} />
                        </View>
                    </View>
                </View>

            </ScrollView>

            <View style={styles.footer}>
                <View style={styles.totalRow}>
                    <Typography variant="subtitle" color={COLORS.gray[500]}>Total to Pay</Typography>
                    <Typography variant="h2" weight="bold" color={COLORS.primary}>R{total.toFixed(2)}</Typography>
                </View>
                <Button
                    title="Complete Purchase"
                    fullWidth
                    size="lg"
                    onPress={handlePlaceOrder}
                    loading={loading}
                    icon={<CheckCircle size={20} color={COLORS.white} />}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.gray[50],
    },
    successContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        padding: SPACING.xxl,
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
        padding: SPACING.lg,
        paddingBottom: 120, // Space for footer
    },
    section: {
        marginBottom: SPACING.xxl,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.sm,
        paddingHorizontal: SPACING.xs,
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radius.lg,
        padding: SPACING.md,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.white,
        padding: SPACING.lg,
        paddingBottom: SPACING.xxl, // Safe area
        borderTopWidth: 1,
        borderTopColor: COLORS.gray[200],
        ...SHADOWS.lg,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
});
