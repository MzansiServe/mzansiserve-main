import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ActivityIndicator, ScrollView, Alert, Image
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { getProfile } from '../api/api';
import LoadingScreen from '../components/LoadingScreen';

export default function ProfileScreen({ navigation }: any) {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const res = await getProfile();
            if (res.success) setProfile(res.data?.user || res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleLogout = async () => {
        await SecureStore.deleteItemAsync('client_token');
        navigation.replace('Login');
    };

    if (loading && !profile) return <LoadingScreen message="Syncing your vault..." />;

    const name = profile?.full_name || profile?.name || 'Valued Member';

    return (
        <View style={styles.outer}>
            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <View style={styles.avatarLarge}>
                        <Text style={styles.avatarTextLarge}>{name.slice(0, 1).toUpperCase()}</Text>
                    </View>
                    <Text style={styles.userName}>{name}</Text>
                    <Text style={styles.userEmail}>{profile?.email}</Text>

                    <View style={styles.tierBox}>
                        <Text style={styles.tierText}>👑 Premium Member</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Marketplace Settings</Text>

                    <TouchableOpacity style={styles.menuItem}>
                        <View style={styles.menuIconBox}><Text style={styles.menuIcon}>👤</Text></View>
                        <Text style={styles.menuText}>Personal Profile</Text>
                        <Text style={styles.chevron}>›</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem}>
                        <View style={[styles.menuIconBox, { backgroundColor: '#10b98122' }]}><Text style={[styles.menuIcon, { color: '#10b981' }]}>💳</Text></View>
                        <Text style={styles.menuText}>Payment Methods</Text>
                        <Text style={styles.chevron}>›</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem}>
                        <View style={[styles.menuIconBox, { backgroundColor: '#3b82f622' }]}><Text style={[styles.menuIcon, { color: '#3b82f6' }]}>📍</Text></View>
                        <Text style={styles.menuText}>Saved Addresses</Text>
                        <Text style={styles.chevron}>›</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem}>
                        <View style={[styles.menuIconBox, { backgroundColor: '#f59e0b22' }]}><Text style={[styles.menuIcon, { color: '#f59e0b' }]}>🎁</Text></View>
                        <Text style={styles.menuText}>Promos & Rewards</Text>
                        <Text style={styles.chevron}>›</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Support</Text>
                    <TouchableOpacity style={styles.menuItem}>
                        <View style={[styles.menuIconBox, { backgroundColor: '#64748b22' }]}><Text style={[styles.menuIcon, { color: '#64748b' }]}>❓</Text></View>
                        <Text style={styles.menuText}>Help Center</Text>
                        <Text style={styles.chevron}>›</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Sign Out</Text>
                </TouchableOpacity>

                <Text style={styles.version}>MzansiServe v1.0.0 (Premium)</Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    outer: { flex: 1, backgroundColor: '#0f172a' },
    container: { flex: 1 },
    scrollContent: { paddingBottom: 60 },
    header: { alignItems: 'center', paddingTop: 80, paddingBottom: 40, backgroundColor: '#1e293b99', borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
    avatarLarge: { width: 90, height: 90, borderRadius: 32, backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    avatarTextLarge: { color: '#fff', fontSize: 36, fontWeight: '900' },
    userName: { color: '#f8fafc', fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
    userEmail: { color: '#64748b', fontSize: 13, marginTop: 4, fontWeight: '500' },
    tierBox: { backgroundColor: '#f59e0b22', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, marginTop: 20, borderWidth: 1, borderColor: '#f59e0b44' },
    tierText: { color: '#f59e0b', fontSize: 12, fontWeight: '800' },
    section: { paddingHorizontal: 24, marginTop: 32 },
    sectionLabel: { color: '#64748b', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16, marginLeft: 4 },
    menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b66', padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
    menuIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#7c3aed22', alignItems: 'center', justifyContent: 'center' },
    menuIcon: { fontSize: 20 },
    menuText: { flex: 1, marginLeft: 16, color: '#f1f5f9', fontWeight: '700', fontSize: 15 },
    chevron: { color: '#334155', fontSize: 22 },
    logoutBtn: { marginHorizontal: 24, marginTop: 40, paddingVertical: 20, borderRadius: 20, borderWidth: 1.5, borderColor: '#ef444455', alignItems: 'center' },
    logoutText: { color: '#ef4444', fontWeight: '800', fontSize: 15 },
    version: { textAlign: 'center', color: '#1e293b', fontSize: 10, fontWeight: '800', marginTop: 32, letterSpacing: 1.5, textTransform: 'uppercase' }
});
