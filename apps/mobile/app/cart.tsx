import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react-native';
import { COLORS, SPACING, SIZES, SHADOWS } from '../constants/Theme';
import { Typography } from '../components/UI/Typography';
import { useCart } from '../contexts/CartContext';
import { Button } from '../components/UI/Button';

export default function Cart() {
    const router = useRouter();
    const { items, updateQuantity, removeItem, total, itemCount } = useCart();

    const handleCheckout = () => {
        router.push('/checkout');
    };

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.iconCircle}>
                <ShoppingBag size={48} color={COLORS.primary} fill={COLORS.primary + '20'} />
            </View>
            <Typography variant="h2" weight="bold" style={{ marginTop: SPACING.xl }}>
                Your Cart is Empty
            </Typography>
            <Typography variant="body" color={COLORS.gray[500]} align="center" style={{ marginTop: SPACING.sm, paddingHorizontal: SPACING.xl }}>
                Browse our ads to find products you'll love.
            </Typography>
            <Button
                title="Start Shopping"
                onPress={() => router.back()}
                style={{ marginTop: SPACING.xl, width: 220 }}
            />
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <ArrowLeft color={COLORS.gray[800]} size={24} />
                </TouchableOpacity>
                <Typography variant="h2" weight="bold" style={{ marginLeft: SPACING.md }}>
                    My Cart ({itemCount})
                </Typography>
            </View>

            {items.length === 0 ? (
                renderEmpty()
            ) : (
                <>
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {items.map((item) => (
                            <View key={item.id} style={styles.cartItemCard}>
                                <Image
                                    source={{ uri: item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=200' }}
                                    style={styles.itemImage}
                                />
                                <View style={styles.itemContent}>
                                    <Typography variant="subtitle" weight="bold" numberOfLines={2}>
                                        {item.name}
                                    </Typography>
                                    <Typography variant="h3" color={COLORS.primary} weight="bold" style={{ marginTop: 4 }}>
                                        R{(item.price * item.quantity).toFixed(2)}
                                    </Typography>

                                    <View style={styles.actionRow}>
                                        <View style={styles.quantityControl}>
                                            <TouchableOpacity
                                                style={styles.quantityBtn}
                                                onPress={() => item.quantity > 1 ? updateQuantity(item.id, item.quantity - 1) : removeItem(item.id)}
                                            >
                                                <Minus size={16} color={COLORS.gray[600]} />
                                            </TouchableOpacity>
                                            <Typography variant="subtitle" weight="bold" style={{ marginHorizontal: SPACING.md }}>
                                                {item.quantity}
                                            </Typography>
                                            <TouchableOpacity
                                                style={styles.quantityBtn}
                                                onPress={() => updateQuantity(item.id, item.quantity + 1)}
                                            >
                                                <Plus size={16} color={COLORS.gray[600]} />
                                            </TouchableOpacity>
                                        </View>

                                        <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.deleteBtn}>
                                            <Trash2 size={20} color={COLORS.error} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        ))}

                        <View style={styles.summaryCard}>
                            <Typography variant="h3" weight="bold" style={{ marginBottom: SPACING.md }}>
                                Order Summary
                            </Typography>
                            <View style={styles.summaryRow}>
                                <Typography variant="body" color={COLORS.gray[500]}>Subtotal</Typography>
                                <Typography variant="subtitle" weight="bold">R{total.toFixed(2)}</Typography>
                            </View>
                            <View style={styles.summaryRow}>
                                <Typography variant="body" color={COLORS.gray[500]}>Shipping</Typography>
                                <Typography variant="subtitle" weight="bold">Calculated at next step</Typography>
                            </View>
                            <View style={[styles.summaryRow, styles.totalRow]}>
                                <Typography variant="subtitle" weight="bold">Total</Typography>
                                <Typography variant="h2" color={COLORS.primary} weight="bold">R{total.toFixed(2)}</Typography>
                            </View>
                        </View>
                    </ScrollView>

                    <View style={styles.footer}>
                        <Button
                            title="Proceed to Checkout"
                            fullWidth
                            size="lg"
                            onPress={handleCheckout}
                        />
                    </View>
                </>
            )}
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
        padding: SPACING.lg,
        paddingBottom: 100, // Space for footer
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
        backgroundColor: COLORS.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cartItemCard: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radius.lg,
        padding: SPACING.md,
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    itemImage: {
        width: 90,
        height: 90,
        borderRadius: SIZES.radius.md,
        backgroundColor: COLORS.gray[100],
    },
    itemContent: {
        flex: 1,
        marginLeft: SPACING.md,
        justifyContent: 'space-between',
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: SPACING.sm,
    },
    quantityControl: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.gray[50],
        borderRadius: SIZES.radius.full,
        padding: 4,
    },
    quantityBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.sm,
        shadowOpacity: 0.1,
    },
    deleteBtn: {
        padding: SPACING.xs,
    },
    summaryCard: {
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radius.lg,
        padding: SPACING.lg,
        marginTop: SPACING.sm,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.sm,
    },
    totalRow: {
        marginTop: SPACING.sm,
        paddingTop: SPACING.md,
        borderTopWidth: 1,
        borderTopColor: COLORS.gray[200],
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
});
