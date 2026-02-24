import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    RefreshControl, Alert, ActivityIndicator, Image
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { getDashboard, acceptRide, updateRideStatus } from '../api/api';
import RatingModal from '../components/RatingModal';
import LoadingScreen from '../components/LoadingScreen';

export default function HomeScreen({ navigation }: any) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [ratingModal, setRatingModal] = useState({ visible: false, jobId: '', clientName: '' });

    const fetchData = async () => {
        try {
            const res = await getDashboard();
            if (res.success) setData(res.data);
        } catch (err) {
            console.error('Dashboard fetch error', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const onRefresh = () => { setRefreshing(true); fetchData(); };

    const handleUpdateStatus = async (jobId: string, status: string, clientName: string) => {
        try {
            const res = await updateRideStatus(jobId, status);
            if (res.success) {
                if (status === 'completed') {
                    setRatingModal({ visible: true, jobId, clientName });
                }
                fetchData();
            }
        } catch (err: any) {
            Alert.alert('Error', 'Failed to update ride status');
        }
    };

    const handleAcceptRide = async (requestId: string) => {
        try {
            const res = await acceptRide(requestId);
            if (res.success) {
                Alert.alert('✅ Success', 'Ride accepted. Head to the pickup location.');
                fetchData();
            }
        } catch (err: any) {
            Alert.alert('Err', err?.response?.data?.error?.message || 'Failed to accept');
        }
    };

    const handleLogout = async () => {
        await SecureStore.deleteItemAsync('driver_token');
        navigation.replace('Login');
    };

    if (loading && !data) return <LoadingScreen message="Syncing with mission control..." />;

    const user = data?.current_user;
    const availableRides = data?.available_cab_requests || [];
    const activeRides = data?.active_rides || [];

    return (
        <View style={styles.outer}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7c3aed" />}
            >
                {/* Premium Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Good Day, {user?.name?.split(' ')[0] || 'Partner'}</Text>
                        <Text style={styles.tracking}>Track ID: {user?.tracking_number}</Text>
                    </View>
                    <TouchableOpacity style={styles.avatar} onPress={handleLogout}>
                        <Text style={styles.avatarText}>{user?.name?.slice(0, 1) || 'D'}</Text>
                        <View style={styles.onlineBadge} />
                    </TouchableOpacity>
                </View>

                {/* Status Banner */}
                {!user?.is_approved && (
                    <View style={styles.banner}>
                        <View style={styles.bannerIconBox}>
                            <Text style={styles.bannerIcon}>🛡️</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.bannerTitle}>Account Verification Required</Text>
                            <Text style={styles.bannerSub}>Complete your profile to unlock full earnings potential.</Text>
                        </View>
                    </View>
                )}

                {/* High-Impact Stat Section */}
                <View style={styles.heroStats}>
                    <View style={styles.heroCard}>
                        <Text style={styles.heroLabel}>Total Earnings</Text>
                        <Text style={styles.heroValue}>R{(data?.driver_earnings || 0).toFixed(2)}</Text>
                        <View style={styles.heroTrend}>
                            <Text style={styles.trendText}>+12.5% this week</Text>
                        </View>
                    </View>
                    <View style={styles.statGrid}>
                        <View style={styles.miniCard}>
                            <Text style={styles.miniLabel}>Available</Text>
                            <Text style={styles.miniValue}>{availableRides.length}</Text>
                        </View>
                        <View style={styles.miniCard}>
                            <Text style={styles.miniLabel}>Completed</Text>
                            <Text style={styles.miniValue}>{data?.recent_rides?.length || 0}</Text>
                        </View>
                    </View>
                </View>

                {/* Active Rides Section */}
                {activeRides.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Current Assignment</Text>
                            <View style={styles.liveIndicator}>
                                <View style={styles.pulseDot} />
                                <Text style={styles.liveText}>LIVE</Text>
                            </View>
                        </View>
                        {activeRides.map((ride: any) => (
                            <View key={ride.id} style={styles.activeCard}>
                                <View style={styles.addressBox}>
                                    <View style={styles.dotLine}>
                                        <View style={[styles.dot, { backgroundColor: '#34d399' }]} />
                                        <View style={styles.line} />
                                        <View style={[styles.dot, { backgroundColor: '#f87171' }]} />
                                    </View>
                                    <View style={styles.addresses}>
                                        <Text style={styles.addrText} numberOfLines={1}>{ride.pickup_address || 'Current Location'}</Text>
                                        <Text style={styles.addrText} numberOfLines={1}>{ride.dropoff_address || 'Destination'}</Text>
                                    </View>
                                </View>
                                <View style={styles.cardFooter}>
                                    <Text style={styles.fare}>R{ride.payment_amount?.toFixed(2)}</Text>
                                    <TouchableOpacity
                                        style={styles.completeBtn}
                                        onPress={() => handleUpdateStatus(ride.id, 'completed', ride.client_name)}
                                    >
                                        <Text style={styles.completeText}>Mark as Complete</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* Available Requests */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Open Requests ({availableRides.length})</Text>
                    {availableRides.length === 0 ? (
                        <View style={styles.emptyBox}>
                            <Text style={styles.emptyText}>Standing by for new requests...</Text>
                        </View>
                    ) : (
                        availableRides.map((ride: any) => (
                            <View key={ride.id} style={styles.requestCard}>
                                <View style={styles.requestHeader}>
                                    <View>
                                        <Text style={styles.requestDist}>2.4 km away</Text>
                                        <Text style={styles.requestFee}>Est. R{ride.estimated_fare?.toFixed(2)}</Text>
                                    </View>
                                    <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAcceptRide(ride.id)}>
                                        <Text style={styles.acceptText}>Accept Job</Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.requestBody}>
                                    <Text style={styles.reqAddr} numberOfLines={1}>📍 {ride.pickup_address}</Text>
                                    <Text style={styles.reqAddr} numberOfLines={1}>🏁 {ride.dropoff_address}</Text>
                                </View>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>

            <RatingModal
                visible={ratingModal.visible}
                onClose={() => setRatingModal({ ...ratingModal, visible: false })}
                jobId={ratingModal.jobId}
                clientName={ratingModal.clientName}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    outer: { flex: 1, backgroundColor: '#0f172a' },
    container: { flex: 1 },
    scrollContent: { paddingBottom: 40 },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 24, paddingTop: 60, marginBottom: 24
    },
    greeting: { fontSize: 24, fontWeight: '900', color: '#f8fafc', letterSpacing: -0.5 },
    tracking: { fontSize: 12, color: '#64748b', fontWeight: '600', marginTop: 2 },
    avatar: {
        width: 48, height: 48, borderRadius: 16, backgroundColor: '#1e293b',
        alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#334155'
    },
    avatarText: { color: '#7c3aed', fontWeight: '800', fontSize: 18 },
    onlineBadge: {
        width: 12, height: 12, borderRadius: 6, backgroundColor: '#34d399',
        position: 'absolute', right: -2, top: -2, borderWidth: 2, borderColor: '#0f172a'
    },
    banner: {
        marginHorizontal: 24, backgroundColor: '#1e293b88', borderRadius: 24, padding: 16,
        flexDirection: 'row', alignItems: 'center', gap: 16, borderWidth: 1, borderColor: '#334155',
        marginBottom: 24
    },
    bannerIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#7c3aed22', alignItems: 'center', justifyContent: 'center' },
    bannerIcon: { fontSize: 20 },
    bannerTitle: { color: '#f1f5f9', fontWeight: '700', fontSize: 14 },
    bannerSub: { color: '#64748b', fontSize: 12, marginTop: 2 },
    heroStats: { paddingHorizontal: 24, marginBottom: 32 },
    heroCard: {
        backgroundColor: '#7c3aed', borderRadius: 32, padding: 24,
        shadowColor: '#7c3aed', shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4, shadowRadius: 20, elevation: 12, marginBottom: 16
    },
    heroLabel: { color: '#ddd6fe', fontSize: 14, fontWeight: '600' },
    heroValue: { color: '#fff', fontSize: 36, fontWeight: '900', marginVertical: 8 },
    heroTrend: { backgroundColor: '#ffffff22', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    trendText: { color: '#fff', fontSize: 11, fontWeight: '700' },
    statGrid: { flexDirection: 'row', gap: 12 },
    miniCard: { flex: 1, backgroundColor: '#1e293b', borderRadius: 24, padding: 16, borderWidth: 1, borderColor: '#334155' },
    miniLabel: { color: '#64748b', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
    miniValue: { color: '#f1f5f9', fontSize: 20, fontWeight: '800', marginTop: 4 },
    section: { paddingHorizontal: 24, marginBottom: 32 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: '#f8fafc' },
    liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ef444422', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ef4444' },
    liveText: { color: '#ef4444', fontSize: 10, fontWeight: '900' },
    activeCard: { backgroundColor: '#1e293b', borderRadius: 28, padding: 20, borderWidth: 1, borderColor: '#7c3aed66' },
    addressBox: { flexDirection: 'row', gap: 16, marginBottom: 20 },
    dotLine: { alignItems: 'center', paddingVertical: 4 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    line: { width: 2, flex: 1, backgroundColor: '#334155', marginVertical: 4 },
    addresses: { flex: 1, gap: 20 },
    addrText: { color: '#cbd5e1', fontSize: 15, fontWeight: '600' },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#334155', paddingTop: 16 },
    fare: { color: '#fff', fontSize: 20, fontWeight: '900' },
    completeBtn: { backgroundColor: '#34d399', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14 },
    completeText: { color: '#064e3b', fontWeight: '800', fontSize: 13 },
    emptyBox: { backgroundColor: '#1e293b66', borderRadius: 24, padding: 32, alignItems: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: '#334155' },
    emptyText: { color: '#475569', fontSize: 14, fontWeight: '600' },
    requestCard: { backgroundColor: '#1e293b', borderRadius: 24, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
    requestHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    requestDist: { color: '#64748b', fontSize: 12, fontWeight: '600' },
    requestFee: { color: '#a78bfa', fontSize: 20, fontWeight: '900', marginTop: 2 },
    acceptBtn: { backgroundColor: '#7c3aed', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14 },
    acceptText: { color: '#fff', fontWeight: '800', fontSize: 13 },
    requestBody: { gap: 8 },
    reqAddr: { color: '#94a3b8', fontSize: 13, fontWeight: '500' }
});
