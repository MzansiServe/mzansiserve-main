import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ActivityIndicator, ScrollView, Alert, Switch
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { getDashboard } from '../api/api';
import LoadingScreen from '../components/LoadingScreen';

export default function ProfileScreen({ navigation }: any) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [online, setOnline] = useState(true);

    const fetchData = async () => {
        try {
            const res = await getDashboard();
            if (res.success) setData(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleLogout = async () => {
        await SecureStore.deleteItemAsync('driver_token');
        navigation.replace('Login');
    };

    if (loading && !data) return <LoadingScreen message="Securing your session..." />;

    const user = data?.current_user;

    return (
        <View style={styles.outer}>
            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <View style={styles.avatarLarge}>
                        <Text style={styles.avatarTextLarge}>{user?.name?.slice(0, 1) || 'D'}</Text>
                    </View>
                    <Text style={styles.userName}>{user?.name}</Text>
                    <Text style={styles.userEmail}>{user?.email}</Text>

                    <View style={styles.onlineToggle}>
                        <Text style={styles.statusText}>{online ? 'Accepting Requests' : 'Currently Offline'}</Text>
                        <Switch
                            value={online}
                            onValueChange={setOnline}
                            trackColor={{ false: '#334155', true: '#34d399' }}
                            thumbColor={online ? '#fff' : '#94a3b8'}
                        />
                    </View>
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statVal}>4.9</Text>
                        <Text style={styles.statLab}>Rating</Text>
                    </View>
                    <View style={[styles.statItem, styles.statBorder]}>
                        <Text style={styles.statVal}>{data?.recent_rides?.length || 0}</Text>
                        <Text style={styles.statLab}>Trips</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statVal}>2y</Text>
                        <Text style={styles.statLab}>Partner</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Account Settings</Text>

                    <TouchableOpacity style={styles.menuItem}>
                        <View style={styles.menuIconBox}><Text style={styles.menuIcon}>👤</Text></View>
                        <Text style={styles.menuText}>Personal Information</Text>
                        <Text style={styles.chevron}>›</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem}>
                        <View style={[styles.menuIconBox, { backgroundColor: '#3b82f622' }]}><Text style={[styles.menuIcon, { color: '#3b82f6' }]}>🏦</Text></View>
                        <Text style={styles.menuText}>Banking & Payouts</Text>
                        <Text style={styles.chevron}>›</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem}>
                        <View style={[styles.menuIconBox, { backgroundColor: '#ef444422' }]}><Text style={[styles.menuIcon, { color: '#ef4444' }]}>🛡️</Text></View>
                        <Text style={styles.menuText}>Security & Privacy</Text>
                        <Text style={styles.chevron}>›</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem}>
                        <View style={[styles.menuIconBox, { backgroundColor: '#eab30822' }]}><Text style={[styles.menuIcon, { color: '#eab308' }]}>⚙️</Text></View>
                        <Text style={styles.menuText}>App Preferences</Text>
                        <Text style={styles.chevron}>›</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Sign Out of Console</Text>
                </TouchableOpacity>

                <Text style={styles.version}>Version 1.0.0 (Premium Build)</Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    outer: { flex: 1, backgroundColor: '#0f172a' },
    container: { flex: 1 },
    scrollContent: { paddingBottom: 60 },
    header: { alignItems: 'center', paddingTop: 80, paddingBottom: 32, backgroundColor: '#1e293b99', borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
    avatarLarge: { width: 100, height: 100, borderRadius: 36, backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    avatarTextLarge: { color: '#fff', fontSize: 42, fontWeight: '900' },
    userName: { color: '#f8fafc', fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
    userEmail: { color: '#64748b', fontSize: 14, marginTop: 4, fontWeight: '500' },
    onlineToggle: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#0f172a', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginTop: 24, borderWidth: 1, borderColor: '#334155' },
    statusText: { color: '#94a3b8', fontSize: 13, fontWeight: '700' },
    statsRow: { flexDirection: 'row', marginHorizontal: 24, marginTop: -24, backgroundColor: '#1e293b', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#334155', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 },
    statItem: { flex: 1, alignItems: 'center' },
    statBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#334155' },
    statVal: { color: '#f1f5f9', fontSize: 18, fontWeight: '800' },
    statLab: { color: '#64748b', fontSize: 11, fontWeight: '700', marginTop: 2, textTransform: 'uppercase' },
    section: { paddingHorizontal: 24, marginTop: 40 },
    sectionLabel: { color: '#64748b', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 20, marginLeft: 4 },
    menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b66', padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
    menuIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#7c3aed22', alignItems: 'center', justifyContent: 'center' },
    menuIcon: { color: '#a78bfa', fontSize: 18 },
    menuText: { flex: 1, marginLeft: 16, color: '#f1f5f9', fontWeight: '700', fontSize: 15 },
    chevron: { color: '#475569', fontSize: 24, fontWeight: '300' },
    logoutBtn: { marginHorizontal: 24, marginTop: 32, paddingVertical: 20, borderRadius: 20, borderWidth: 1.5, borderColor: '#ef444455', alignItems: 'center' },
    logoutText: { color: '#ef4444', fontWeight: '800', fontSize: 15 },
    version: { textAlign: 'center', color: '#334155', fontSize: 11, fontWeight: '700', marginTop: 24, letterSpacing: 1 }
});
