import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    RefreshControl, Alert, TextInput, ActivityIndicator, Image
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { requestCab, getProfessionals, getServiceProviders } from '../api/api';
import LoadingScreen from '../components/LoadingScreen';

export default function HomeScreen({ navigation }: any) {
    const [loading, setLoading] = useState(true);
    const [requestLoading, setRequestLoading] = useState(false);
    const [activeSection, setActiveSection] = useState<'transport' | 'professionals' | 'services'>('transport');
    const [professionals, setProfessionals] = useState<any[]>([]);
    const [serviceProviders, setServiceProviders] = useState<any[]>([]);
    const [pickup, setPickup] = useState('');
    const [dropoff, setDropoff] = useState('');

    const loadData = async () => {
        try {
            const [proRes, spRes] = await Promise.all([getProfessionals(), getServiceProviders()]);
            if (proRes.success) setProfessionals(proRes.data?.professionals || []);
            if (spRes.success) setServiceProviders(spRes.data?.service_providers || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { loadData(); }, []);

    const handleRequestCab = async () => {
        if (!pickup || !dropoff) { Alert.alert('Location Missing', 'Please enter pickup and drop-off points'); return; }
        setRequestLoading(true);
        try {
            const res = await requestCab({ pickup_address: pickup, dropoff_address: dropoff });
            if (res.success) {
                Alert.alert('🚀 Request Sent!', 'A driver will be assigned to you shortly.');
                setPickup(''); setDropoff('');
            }
        } catch (err: any) {
            Alert.alert('Request Failed', err?.response?.data?.error?.message || 'Check your connection');
        } finally { setRequestLoading(false); }
    };

    const handleLogout = async () => {
        await SecureStore.deleteItemAsync('client_token');
        navigation.replace('Login');
    };

    if (loading) return <LoadingScreen message="Finding the best services for you..." />;

    return (
        <View style={styles.outer}>
            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
                {/* Premium Hub Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.welcome}>MzansiServe</Text>
                        <Text style={styles.tagline}>Excellence in every service.</Text>
                    </View>
                    <TouchableOpacity style={styles.profileBtn} onPress={handleLogout}>
                        <Text style={styles.profileIcon}>👤</Text>
                    </TouchableOpacity>
                </View>

                {/* Category Selector */}
                <View style={styles.categoryRow}>
                    {[
                        { id: 'transport', label: 'Cabs', icon: '🚗' },
                        { id: 'professionals', label: 'Experts', icon: '💼' },
                        { id: 'services', label: 'Home', icon: '🏠' }
                    ].map((cat) => (
                        <TouchableOpacity
                            key={cat.id}
                            onPress={() => setActiveSection(cat.id as any)}
                            style={[styles.catCard, activeSection === cat.id && styles.catActive]}
                        >
                            <View style={[styles.catIconBox, activeSection === cat.id && styles.catIconActive]}>
                                <Text style={styles.catIcon}>{cat.icon}</Text>
                            </View>
                            <Text style={[styles.catLabel, activeSection === cat.id && styles.catLabelActive]}>{cat.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Dynamic Content */}
                <View style={styles.main}>
                    {activeSection === 'transport' && (
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Book your arrival</Text>
                            <View style={styles.inputStack}>
                                <View style={styles.inputWrapper}>
                                    <Text style={styles.inputPrefix}>📍</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Pickup location"
                                        placeholderTextColor="#475569"
                                        value={pickup}
                                        onChangeText={setPickup}
                                    />
                                </View>
                                <View style={styles.inputWrapper}>
                                    <Text style={styles.inputPrefix}>🏁</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Where to?"
                                        placeholderTextColor="#475569"
                                        value={dropoff}
                                        onChangeText={setDropoff}
                                    />
                                </View>
                            </View>
                            <TouchableOpacity style={styles.actionBtn} onPress={handleRequestCab} disabled={requestLoading}>
                                {requestLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>Request Premium Ride</Text>}
                            </TouchableOpacity>
                        </View>
                    )}

                    {activeSection === 'professionals' && (
                        <View>
                            <Text style={styles.listTitle}>Verified Experts</Text>
                            {professionals.map((item: any) => {
                                const p = item.professional;
                                const name = `${p?.data?.full_name || ''} ${p?.data?.surname || ''}`.trim();
                                const service = item.services?.[0];
                                return (
                                    <TouchableOpacity key={p.id} style={styles.providerCard} activeOpacity={0.8}>
                                        <View style={styles.providerTop}>
                                            <View style={styles.providerAvatar}>
                                                <Text style={styles.avatarText}>{(name || 'P').slice(0, 1).toUpperCase()}</Text>
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.providerName}>{name || 'Expert'}</Text>
                                                <Text style={styles.providerCategory}>{service?.name || 'Consultant'}</Text>
                                            </View>
                                            <View style={styles.verifiedBadge}>
                                                <Text style={styles.verifiedText}>✓ Verified</Text>
                                            </View>
                                        </View>
                                        <Text style={styles.providerBio} numberOfLines={2}>{service?.description || 'Providing exceptional professional services to the community.'}</Text>
                                        <View style={styles.providerFooter}>
                                            <Text style={styles.rate}>From R{item.min_hourly_rate || '0'}/hr</Text>
                                            <View style={styles.bookTag}>
                                                <Text style={styles.bookTagText}>Book Consultation</Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}

                    {activeSection === 'services' && (
                        <View>
                            <Text style={styles.listTitle}>Home & Business Services</Text>
                            {serviceProviders.map((item: any) => {
                                const p = item.provider;
                                const name = p?.data?.business_name || `${p?.data?.full_name || ''} ${p?.data?.surname || ''}`.trim();
                                const service = item.services?.[0];
                                return (
                                    <TouchableOpacity key={p.id} style={styles.providerCard} activeOpacity={0.8}>
                                        <View style={styles.providerTop}>
                                            <View style={[styles.providerAvatar, { backgroundColor: '#1e40af33' }]}>
                                                <Text style={[styles.avatarText, { color: '#60a5fa' }]}>{(name || 'S').slice(0, 1).toUpperCase()}</Text>
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.providerName}>{name}</Text>
                                                <Text style={styles.providerCategory}>{service?.name || 'General Service'}</Text>
                                            </View>
                                        </View>
                                        <Text style={styles.providerBio} numberOfLines={2}>{service?.description || 'Your trusted partner for home and business maintenance.'}</Text>
                                        <View style={styles.providerFooter}>
                                            <Text style={styles.rate}>R{service?.hourly_rate || '0'}/hr</Text>
                                            <View style={[styles.bookTag, { backgroundColor: '#1e293b' }]}>
                                                <Text style={[styles.bookTagText, { color: '#94a3b8' }]}>View Details</Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    outer: { flex: 1, backgroundColor: '#0f172a' },
    container: { flex: 1 },
    scrollContent: { paddingBottom: 40 },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 24, paddingTop: 60, marginBottom: 20
    },
    welcome: { fontSize: 26, fontWeight: '900', color: '#a78bfa', letterSpacing: -1 },
    tagline: { fontSize: 13, color: '#64748b', fontWeight: '500', marginTop: 2 },
    profileBtn: {
        width: 44, height: 44, borderRadius: 14, backgroundColor: '#1e293b',
        alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#334155'
    },
    profileIcon: { fontSize: 20 },
    categoryRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 32 },
    catCard: {
        flex: 1, backgroundColor: '#1e293b99', borderRadius: 24, padding: 16,
        alignItems: 'center', borderWidth: 1, borderColor: '#334155'
    },
    catActive: { backgroundColor: '#7c3aed22', borderColor: '#7c3aed66' },
    catIconBox: {
        width: 48, height: 48, borderRadius: 16, backgroundColor: '#0f172a',
        alignItems: 'center', justifyContent: 'center', marginBottom: 10
    },
    catIconActive: { backgroundColor: '#7c3aed' },
    catIcon: { fontSize: 22 },
    catLabel: { fontSize: 12, fontWeight: '700', color: '#64748b' },
    catLabelActive: { color: '#fff' },
    main: { paddingHorizontal: 24 },
    card: { backgroundColor: '#1e293b', borderRadius: 32, padding: 24, borderWidth: 1, borderColor: '#334155' },
    cardTitle: { color: '#f8fafc', fontSize: 20, fontWeight: '800', marginBottom: 20 },
    inputStack: { gap: 12, marginBottom: 20 },
    inputWrapper: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a',
        borderRadius: 16, paddingHorizontal: 16, borderWidth: 1.5, borderColor: '#334155'
    },
    inputPrefix: { marginRight: 12, fontSize: 16 },
    input: { flex: 1, height: 56, color: '#f1f5f9', fontSize: 15, fontWeight: '500' },
    actionBtn: {
        backgroundColor: '#7c3aed', borderRadius: 18, height: 60,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#7c3aed', shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3, shadowRadius: 12, elevation: 6
    },
    actionBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
    listTitle: { fontSize: 18, fontWeight: '800', color: '#f8fafc', marginBottom: 16 },
    providerCard: {
        backgroundColor: '#1e293b', borderRadius: 28, padding: 20,
        marginBottom: 16, borderWidth: 1, borderColor: '#334155'
    },
    providerTop: { flexDirection: 'row', gap: 14, alignItems: 'center', marginBottom: 12 },
    providerAvatar: {
        width: 52, height: 52, borderRadius: 18, backgroundColor: '#7c3aed22',
        alignItems: 'center', justifyContent: 'center'
    },
    avatarText: { color: '#a78bfa', fontWeight: '800', fontSize: 20 },
    providerName: { color: '#f1f5f9', fontWeight: '700', fontSize: 16 },
    providerCategory: { color: '#64748b', fontSize: 12, marginTop: 2 },
    verifiedBadge: { backgroundColor: '#064e3b', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    verifiedText: { color: '#34d399', fontSize: 10, fontWeight: '900' },
    providerBio: { color: '#94a3b8', fontSize: 13, lineHeight: 18, marginBottom: 16 },
    providerFooter: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        borderTopWidth: 1, borderTopColor: '#334155', paddingTop: 16
    },
    rate: { color: '#fff', fontSize: 15, fontWeight: '800' },
    bookTag: { backgroundColor: '#7c3aed11', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    bookTagText: { color: '#a78bfa', fontSize: 12, fontWeight: '700' }
});
