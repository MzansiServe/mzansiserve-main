import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity
} from 'react-native';
import { getOrderHistory } from '../api/api';
import LoadingScreen from '../components/LoadingScreen';

export default function HistoryScreen() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async () => {
        try {
            const res = await getOrderHistory();
            if (res.success) setOrders(res.data?.orders || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); refreshing && setRefreshing(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const renderOrder = ({ item }: any) => {
        const isShop = item.type === 'shop';
        return (
            <View style={styles.historyCard}>
                <View style={styles.txHeader}>
                    <View style={[styles.txIconBox, { backgroundColor: isShop ? '#7c3aed22' : '#3b82f622' }]}>
                        <Text style={styles.txEmoji}>{isShop ? '🛍️' : '🚗'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.txId}>REF: #{item.order_number?.slice(-8) || item.id.slice(0, 8).toUpperCase()}</Text>
                        <Text style={styles.txDate}>{new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: item.status === 'completed' ? '#34d39922' : '#fbbf2422' }]}>
                        <Text style={[styles.statusText, { color: item.status === 'completed' ? '#34d399' : '#fbbf24' }]}>
                            {item.status?.toUpperCase()}
                        </Text>
                    </View>
                </View>

                <View style={styles.txBody}>
                    <Text style={styles.txLabel}>{isShop ? 'Shopping Order' : 'Marketplace Service'}</Text>
                    <Text style={styles.txValue}>R{(item.total_amount || item.payment_amount || 0).toFixed(2)}</Text>
                </View>

                <TouchableOpacity style={styles.detailsBtn}>
                    <Text style={styles.detailsText}>View Receipt</Text>
                </TouchableOpacity>
            </View>
        );
    };

    if (loading && !orders.length) return <LoadingScreen message="Retrieving your history..." />;

    return (
        <View style={styles.outer}>
            <View style={styles.header}>
                <Text style={styles.title}>Your Activity</Text>
                <Text style={styles.subtitle}>A complete record of your premium experience.</Text>
            </View>

            <FlatList
                data={orders}
                keyExtractor={(item: any) => item.id}
                renderItem={renderOrder}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#7c3aed" />}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <View style={styles.emptyIconBox}>
                            <Text style={styles.emptyIcon}>⏳</Text>
                        </View>
                        <Text style={styles.emptyTitle}>Nothing here yet</Text>
                        <Text style={styles.emptySub}>Your future bookings and orders will appear here.</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    outer: { flex: 1, backgroundColor: '#0f172a' },
    header: { padding: 24, paddingTop: 60, marginBottom: 10 },
    title: { fontSize: 26, fontWeight: '900', color: '#f8fafc', letterSpacing: -1 },
    subtitle: { color: '#64748b', fontSize: 13, fontWeight: '500', marginTop: 4 },
    listContent: { paddingHorizontal: 20, paddingBottom: 40 },
    historyCard: {
        backgroundColor: '#1e293b', borderRadius: 28, padding: 20,
        marginBottom: 16, borderWidth: 1, borderColor: '#334155'
    },
    txHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
    txIconBox: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    txEmoji: { fontSize: 20 },
    txId: { color: '#f1f5f9', fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
    txDate: { color: '#64748b', fontSize: 11, fontWeight: '600', marginTop: 2 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 10, fontWeight: '900' },
    txBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 },
    txLabel: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
    txValue: { color: '#fff', fontSize: 22, fontWeight: '900' },
    detailsBtn: { backgroundColor: '#0f172a', paddingVertical: 12, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
    detailsText: { color: '#a78bfa', fontWeight: '800', fontSize: 13 },
    empty: { padding: 60, alignItems: 'center', marginTop: 40 },
    emptyIconBox: { width: 80, height: 80, borderRadius: 32, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    emptyIcon: { fontSize: 32 },
    emptyTitle: { color: '#f1f5f9', fontSize: 18, fontWeight: '800', marginBottom: 8 },
    emptySub: { color: '#64748b', textAlign: 'center', fontSize: 14, lineHeight: 20 }
});
