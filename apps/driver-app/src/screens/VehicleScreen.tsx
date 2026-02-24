import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, RefreshControl, Image, Alert
} from 'react-native';
import { getDashboard } from '../api/api';
import LoadingScreen from '../components/LoadingScreen';

export default function VehicleScreen() {
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

    const renderVehicle = ({ item }: any) => (
        <View style={styles.vehicleCard}>
            <View style={styles.vehicleTop}>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.year || '2024'}</Text>
                </View>
                <Text style={styles.plate}>{item.license_plate}</Text>
            </View>
            <Text style={styles.model}>{item.make} {item.model}</Text>
            <View style={styles.footer}>
                <View style={styles.statusBox}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>Active In Fleet</Text>
                </View>
                <TouchableOpacity style={styles.manageBtn}>
                    <Text style={styles.manageText}>Update Docs</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading && !data) return <LoadingScreen message="Inspecting fleet status..." />;

    const vehicles = data?.current_user?.vehicles || [];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>My Marketplace Portfolio</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => Alert.alert('Fleet Management', 'Please contact support to register new vehicles or services.')}>
                    <Text style={styles.addBtnText}>+ Register Service</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={vehicles}
                keyExtractor={(item: any, idx) => idx.toString()}
                renderItem={renderVehicle}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#7c3aed" />}
                ListEmptyComponent={(
                    <View style={styles.empty}>
                        <View style={styles.emptyIconBox}>
                            <Text style={styles.emptyIcon}>🛠️</Text>
                        </View>
                        <Text style={styles.emptyTitle}>No Registered Assets</Text>
                        <Text style={styles.emptyText}>You haven't listed any services or vehicles yet. Complete your onboarding to start earning.</Text>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    header: {
        paddingHorizontal: 24, paddingTop: 60, marginBottom: 24,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
    },
    title: { fontSize: 22, fontWeight: '900', color: '#f8fafc', flex: 1 },
    addBtn: { backgroundColor: '#7c3aed', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
    addBtnText: { color: '#fff', fontSize: 11, fontWeight: '800' },
    vehicleCard: {
        backgroundColor: '#1e293b', borderRadius: 28, padding: 24,
        marginBottom: 16, borderWidth: 1, borderColor: '#334155'
    },
    vehicleTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    badge: { backgroundColor: '#7c3aed22', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    badgeText: { color: '#a78bfa', fontSize: 10, fontWeight: '900' },
    plate: { color: '#64748b', fontWeight: '800', fontSize: 13, letterSpacing: 1 },
    model: { color: '#f1f5f9', fontSize: 20, fontWeight: '800', marginBottom: 20 },
    footer: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        borderTopWidth: 1, borderTopColor: '#334155', paddingTop: 16
    },
    statusBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#34d399' },
    statusText: { color: '#34d399', fontSize: 12, fontWeight: '700' },
    manageBtn: { backgroundColor: '#334155', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
    manageText: { color: '#94a3b8', fontWeight: '700', fontSize: 12 },
    empty: { padding: 40, alignItems: 'center', marginTop: 60 },
    emptyIconBox: { width: 80, height: 80, borderRadius: 30, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
    emptyIcon: { fontSize: 32 },
    emptyTitle: { color: '#f1f5f9', fontSize: 20, fontWeight: '800', marginBottom: 8 },
    emptyText: { color: '#64748b', textAlign: 'center', fontSize: 14, lineHeight: 22 }
});
