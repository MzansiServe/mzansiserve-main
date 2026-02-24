import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, RefreshControl, ScrollView
} from 'react-native';
import { getDashboard } from '../api/api';
import LoadingScreen from '../components/LoadingScreen';

export default function WalletScreen() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async () => {
        try {
            const res = await getDashboard();
            if (res.success) setData(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); setRefreshing(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const renderTransaction = ({ item }: any) => (
        <View style={styles.transactionCard}>
            <View style={styles.iconBox}>
                <Text style={styles.icon}>{item.amount > 0 ? '📈' : '📉'}</Text>
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.txTitle}>{item.description || 'Service Payment'}</Text>
                <Text style={styles.txDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
            </View>
            <Text style={[styles.txAmount, { color: item.amount > 0 ? '#34d399' : '#f87171' }]}>
                {item.amount > 0 ? '+' : ''}R{Math.abs(item.amount).toFixed(2)}
            </Text>
        </View>
    );

    if (loading && !data) return <LoadingScreen message="Loading secure vault..." />;

    const transactions = data?.transactions || [];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Financial Hub</Text>
            </View>

            <View style={styles.balanceCard}>
                <Text style={styles.balanceLabel}>Current Balance</Text>
                <Text style={styles.balanceValue}>R{(data?.driver_earnings || 0).toFixed(2)}</Text>
                <TouchableOpacity style={styles.withdrawBtn} onPress={() => Alert.alert('Withdrawal', 'Payouts are processed every Monday.')}>
                    <Text style={styles.withdrawText}>Request Early Payout</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Transaction Activity</Text>
            <FlatList
                data={transactions}
                keyExtractor={(item: any) => item.id}
                renderItem={renderTransaction}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#7c3aed" />}
                ListEmptyComponent={(
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>No financial movements recorded yet.</Text>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    header: { paddingHorizontal: 24, paddingTop: 60, marginBottom: 20 },
    title: { fontSize: 24, fontWeight: '900', color: '#f8fafc' },
    balanceCard: {
        marginHorizontal: 20, backgroundColor: '#1e293b', borderRadius: 32, padding: 32,
        borderWidth: 1, borderColor: '#334155', alignItems: 'center', marginBottom: 32,
        shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15
    },
    balanceLabel: { color: '#64748b', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
    balanceValue: { color: '#fff', fontSize: 42, fontWeight: '900', marginVertical: 12 },
    withdrawBtn: { backgroundColor: '#7c3aed22', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16, borderWidth: 1, borderColor: '#7c3aed66' },
    withdrawText: { color: '#a78bfa', fontWeight: '800', fontSize: 13 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: '#f8fafc', marginHorizontal: 24, marginBottom: 16 },
    transactionCard: {
        flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: '#1e293b66',
        padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: '#334155'
    },
    iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' },
    icon: { fontSize: 20 },
    txTitle: { color: '#f1f5f9', fontWeight: '700', fontSize: 14 },
    txDate: { color: '#475569', fontSize: 12, marginTop: 2 },
    txAmount: { fontSize: 16, fontWeight: '800' },
    empty: { padding: 40, alignItems: 'center' },
    emptyText: { color: '#475569', textAlign: 'center', fontSize: 14, fontWeight: '600' }
});
