import React, { useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    Alert, ActivityIndicator, Image
} from 'react-native';
import { createOrder } from '../api/api';

let cartItems: any[] = [];
export const addToCart = (product: any) => {
    cartItems.push(product);
    Alert.alert('🛍️ Added', `${product.name} is now in your cart.`);
};

export default function CartScreen({ navigation }: any) {
    const [items, setItems] = useState([...cartItems]);
    const [loading, setLoading] = useState(false);

    const total = items.reduce((sum, item) => sum + item.price, 0);

    const handleCheckout = async () => {
        if (items.length === 0) { Alert.alert('Cart empty', 'Please select items from the shop first.'); return; }
        setLoading(true);
        try {
            const res = await createOrder({
                items: items.map(i => ({ id: i.id, quantity: 1 })),
                shipping_address: 'Premium Express Delivery',
                total_amount: total
            });
            if (res.success) {
                Alert.alert('🚀 Order Confirmed', `Ref: ${res.data?.order_number}. Preparing for dispatch.`);
                cartItems = [];
                setItems([]);
                navigation.navigate('History');
            }
        } catch (err: any) {
            Alert.alert('Checkout Err', err?.response?.data?.error?.message || 'Transaction failed');
        } finally { setLoading(false); }
    };

    const renderItem = ({ item, index }: any) => (
        <View style={styles.itemCard}>
            <View style={styles.itemImgBox}>
                <Text style={styles.itemEmoji}>📦</Text>
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>R{item.price.toFixed(2)}</Text>
            </View>
            <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => { cartItems.splice(index, 1); setItems([...cartItems]); }}
            >
                <Text style={styles.removeText}>Remove</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Your Selection</Text>
                <Text style={styles.subtitle}>{items.length} items curated</Text>
            </View>

            <FlatList
                data={items}
                keyExtractor={(_, index) => index.toString()}
                renderItem={renderItem}
                contentContainerStyle={{ padding: 20 }}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyIcon}>🛒</Text>
                        <Text style={styles.emptyText}>Your cart is waiting to be filled.</Text>
                        <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.navigate('Shop')}>
                            <Text style={styles.shopBtnText}>Browse Marketplace</Text>
                        </TouchableOpacity>
                    </View>
                }
            />

            {items.length > 0 && (
                <View style={styles.footer}>
                    <View style={styles.summaryRow}>
                        <View>
                            <Text style={styles.totalLabel}>Grand Total</Text>
                            <Text style={styles.taxInfo}>Inc. VAT & Express Shipping</Text>
                        </View>
                        <Text style={styles.totalValue}>R{total.toFixed(2)}</Text>
                    </View>
                    <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout} disabled={loading}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.checkoutText}>Complete Order</Text>}
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    header: { padding: 24, paddingTop: 60, marginBottom: 10 },
    title: { fontSize: 28, fontWeight: '900', color: '#f8fafc', letterSpacing: -1 },
    subtitle: { color: '#64748b', fontSize: 13, fontWeight: '600', marginTop: 4 },
    itemCard: {
        flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: '#1e293b',
        padding: 16, borderRadius: 24, marginBottom: 12, borderWidth: 1, borderColor: '#334155'
    },
    itemImgBox: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' },
    itemEmoji: { fontSize: 24 },
    itemName: { color: '#f1f5f9', fontWeight: '800', fontSize: 15 },
    itemPrice: { color: '#a78bfa', fontSize: 14, fontWeight: '700', marginTop: 4 },
    removeBtn: { padding: 8 },
    removeText: { color: '#f87171', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
    footer: {
        padding: 32, backgroundColor: '#1e293b', borderTopLeftRadius: 40, borderTopRightRadius: 40,
        shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.2, shadowRadius: 20
    },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
    totalLabel: { color: '#94a3b8', fontSize: 14, fontWeight: '800', textTransform: 'uppercase' },
    taxInfo: { color: '#475569', fontSize: 11, marginTop: 2 },
    totalValue: { color: '#fff', fontSize: 32, fontWeight: '900' },
    checkoutBtn: {
        backgroundColor: '#7c3aed', height: 60, borderRadius: 20,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#7c3aed', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 15
    },
    checkoutText: { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 0.5 },
    empty: { padding: 40, alignItems: 'center', marginTop: 60 },
    emptyIcon: { fontSize: 60, marginBottom: 20, opacity: 0.3 },
    emptyText: { color: '#64748b', fontSize: 15, fontWeight: '600', textAlign: 'center', marginBottom: 24 },
    shopBtn: { backgroundColor: '#1e293b', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: '#334155' },
    shopBtnText: { color: '#a78bfa', fontWeight: '800', fontSize: 14 }
});
