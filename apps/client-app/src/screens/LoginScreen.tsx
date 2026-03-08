import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { login, register } from '../api/api';
import LoadingScreen from '../components/LoadingScreen';

export default function LoginScreen({ navigation }: any) {
    const [tab, setTab] = useState<'login' | 'register'>('login');
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(false);

    // Form State
    const [form, setForm] = useState({
        name: '', surname: '', email: '', phone: '', password: '', confirmPassword: '',
        gender: '', nationality: 'South Africa', id_number: '', role: 'client',
        nokName: '', nokPhone: '', nokEmail: '',
        highestQualification: '', professionalBody: ''
    });

    const [agreed, setAgreed] = useState(false);
    const [files, setFiles] = useState<{ [key: string]: any }>({});
    const [localError, setLocalError] = useState('');

    const update = (field: string, value: any) => {
        setLocalError('');
        setForm(f => ({ ...f, [field]: value }));
    };

    const pickImage = async (field: string) => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (!result.canceled) setFiles(prev => ({ ...prev, [field]: result.assets[0] }));
    };

    const pickDocument = async (field: string) => {
        const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'] });
        if (result.assets) setFiles(prev => ({ ...prev, [field]: result.assets[0] }));
    };

    const stepCount = 4; // Simplified: Only Client registration

    const validateStep = () => {
        setLocalError('');
        if (step === 1) {
            if (tab === 'login') {
                if (!form.email) { setLocalError('Email is required'); return false; }
                if (!form.password) { setLocalError('Password is required'); return false; }
                return true;
            }
            if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setLocalError('Valid email is required'); return false; }
            if (form.password.length < 8) { setLocalError('Password must be at least 8 characters'); return false; }
            if (form.password !== form.confirmPassword) { setLocalError('Passwords do not match'); return false; }
            return true;
        }
        if (step === 2) {
            if (!form.name || !form.surname) { setLocalError('Name and Surname are required'); return false; }
            if (!form.phone) { setLocalError('Phone number is required'); return false; }
            if (!form.id_number) { setLocalError('ID/Passport number is required'); return false; }
            if (!form.gender) { setLocalError('Please select your gender'); return false; }
            return true;
        }
        if (step === 3) {
            if (!form.nokName) { setLocalError('Next of Kin name is required'); return false; }
            if (!form.nokPhone && !form.nokEmail) { setLocalError('Next of Kin contact is required'); return false; }
            return true;
        }
        if (step === 4) {
            if (!files.profile_photo) { setLocalError('Profile photo is required'); return false; }
            if (!files.id_document) { setLocalError('ID document is required'); return false; }
            if (!agreed) { setLocalError('You must agree to the Terms of Service'); return false; }
            return true;
        }
        return true;
    };

    const handleSubmit = async () => {
        setLocalError('');
        if (tab === 'login') {
            if (!validateStep()) return;
            setLoading(true);
            try {
                const res = await login(form.email, form.password);
                if (res.success) {
                    await SecureStore.setItemAsync('client_token', res.data.token);
                    setInitialLoading(true);
                    setTimeout(() => navigation.replace('Main'), 1500);
                } else { setLocalError(res.error?.message || 'Invalid credentials'); }
            } catch (err: any) { setLocalError('Login failed. Check your connection.'); }
            finally { setLoading(false); }
            return;
        }

        if (!validateStep()) return;

        if (step < stepCount) {
            setStep(step + 1);
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            const registration_data = {
                ...form,
                email: form.email.trim(),
                full_name: form.name.trim(),
                surname: form.surname.trim(),
                phone: form.phone.trim(),
                gender: form.gender.toLowerCase(),
                id_number: form.id_number.trim(),
                next_of_kin: { full_name: form.nokName.trim(), contact_number: form.nokPhone.trim(), contact_email: form.nokEmail.trim() }
            };

            formData.append('registration_data', JSON.stringify(registration_data));
            Object.keys(files).forEach(key => {
                const file = files[key];
                formData.append(key, { uri: file.uri, name: file.name || `upload_${key}.jpg`, type: file.mimeType || 'image/jpeg' } as any);
            });

            const res = await register(formData);
            if (res.success) {
                Alert.alert('✅ Success', 'Account created! Please sign in.');
                setTab('login'); setStep(1);
            } else { setLocalError(res.error || 'Registration failed'); }
        } catch (err: any) { setLocalError('Connection failed. Server might be down.'); }
        finally { setLoading(false); }
    };

    if (initialLoading) return <LoadingScreen message="Welcome to MzansiServe..." />;

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <View style={styles.header}>
                    <Image source={require('../../assets/logo.jpeg')} style={styles.logo} />
                    <Text style={styles.appName}>MzansiServe</Text>
                    <Text style={styles.tagline}>{tab === 'login' ? "Excellence in every service." : `Step ${step} of ${stepCount}`}</Text>
                </View>

                <View style={styles.card}>
                    {tab === 'login' ? (
                        <>
                            <Text style={styles.cardTitle}>LOGIN TO YOUR ACCOUNT</Text>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>EMAIL ADDRESS</Text>
                                <TextInput style={styles.input} placeholder="name@example.com" placeholderTextColor="#94A3B8" value={form.email} onChangeText={v => update('email', v)} autoCapitalize="none" />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>PASSWORD</Text>
                                <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor="#94A3B8" value={form.password} onChangeText={v => update('password', v)} secureTextEntry />
                            </View>
                        </>
                    ) : (
                        <>
                            <Text style={styles.cardTitle}>CREATE NEW ACCOUNT</Text>
                            {step === 1 && (
                                <>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>EMAIL ADDRESS</Text>
                                        <TextInput style={styles.input} placeholder="you@example.co.za" placeholderTextColor="#94A3B8" value={form.email} onChangeText={v => update('email', v)} autoCapitalize="none" />
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>CREATE PASSWORD</Text>
                                        <TextInput style={styles.input} placeholder="Min 8 characters" placeholderTextColor="#94A3B8" value={form.password} onChangeText={v => update('password', v)} secureTextEntry />
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>CONFIRM PASSWORD</Text>
                                        <TextInput style={styles.input} placeholder="Re-enter password" placeholderTextColor="#94A3B8" value={form.confirmPassword} onChangeText={v => update('confirmPassword', v)} secureTextEntry />
                                    </View>
                                </>
                            )}

                            {step === 2 && (
                                <>
                                    <View style={styles.inputGroup}>
                                        <View style={{ flexDirection: 'row' }}>
                                            <View style={{ flex: 1, marginRight: 8 }}>
                                                <Text style={styles.label}>FIRST NAME</Text>
                                                <TextInput style={styles.input} placeholder="Thabo" placeholderTextColor="#94A3B8" value={form.name} onChangeText={v => update('name', v)} />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.label}>SURNAME</Text>
                                                <TextInput style={styles.input} placeholder="Mokoena" placeholderTextColor="#94A3B8" value={form.surname} onChangeText={v => update('surname', v)} />
                                            </View>
                                        </View>
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>PHONE NUMBER</Text>
                                        <TextInput style={styles.input} placeholder="081 000 1111" placeholderTextColor="#94A3B8" value={form.phone} onChangeText={v => update('phone', v)} keyboardType="phone-pad" />
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>NATIONALITY</Text>
                                        <View style={styles.optionRow}>
                                            {['South Africa', 'Other'].map((n) => (
                                                <TouchableOpacity key={n} style={[styles.optionBtn, form.nationality === n && styles.optionActive]} onPress={() => update('nationality', n)}>
                                                    <Text style={[styles.optionText, form.nationality === n && styles.optionTextActive]}>{n}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>{form.nationality === 'South Africa' ? 'ID NUMBER' : 'PASSPORT NUMBER'}</Text>
                                        <TextInput style={styles.input} placeholder="Enter number" placeholderTextColor="#94A3B8" value={form.id_number} onChangeText={v => update('id_number', v)} />
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>GENDER</Text>
                                        <View style={styles.optionRow}>
                                            {['Male', 'Female', 'Other'].map((g) => (
                                                <TouchableOpacity key={g} style={[styles.optionBtn, form.gender === g && styles.optionActive]} onPress={() => update('gender', g)}>
                                                    <Text style={[styles.optionText, form.gender === g && styles.optionTextActive]}>{g}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                </>
                            )}

                            {step === 3 && (
                                <>
                                    <Text style={styles.subHeader}>NEXT OF KIN</Text>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>FULL NAME</Text>
                                        <TextInput style={styles.input} placeholder="Contact Name" placeholderTextColor="#94A3B8" value={form.nokName} onChangeText={v => update('nokName', v)} />
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>PHONE NUMBER</Text>
                                        <TextInput style={styles.input} placeholder="Contact Phone" placeholderTextColor="#94A3B8" value={form.nokPhone} onChangeText={v => update('nokPhone', v)} keyboardType="phone-pad" />
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>EMAIL ADDRESS</Text>
                                        <TextInput style={styles.input} placeholder="Contact Email" placeholderTextColor="#94A3B8" value={form.nokEmail} onChangeText={v => update('nokEmail', v)} autoCapitalize="none" />
                                    </View>
                                </>
                            )}

                            {step === 4 && (
                                <>
                                    <Text style={styles.subHeader}>VERIFICATION</Text>
                                    <TouchableOpacity style={styles.uploadBox} onPress={() => pickImage('profile_photo')}>
                                        <Text style={styles.uploadText}>{files.profile_photo ? "✅ PHOTO SELECTED" : "UPLOAD PROFILE PHOTO"}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.uploadBox} onPress={() => pickDocument('id_document')}>
                                        <Text style={styles.uploadText}>{files.id_document ? "✅ ID SELECTED" : "UPLOAD ID / PASSPORT"}</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.agreementRow} onPress={() => setAgreed(!agreed)}>
                                        <View style={[styles.checkbox, agreed && styles.checkboxActive]}>
                                            {agreed && <Text style={styles.checkIcon}>✓</Text>}
                                        </View>
                                        <Text style={styles.agreementText}>I agree to the Terms of Service and Privacy Policy</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </>
                    )}

                    {localError ? <Text style={styles.errorText}>{localError}</Text> : null}

                    <TouchableOpacity style={styles.btn} onPress={handleSubmit} disabled={loading} activeOpacity={0.8}>
                        {loading ? <ActivityIndicator color="#fff" /> : (
                            <Text style={styles.btnText}>
                                {tab === 'login' ? 'SIGN IN' : (step === stepCount ? 'PAY & FINALIZE' : 'CONTINUE')}
                            </Text>
                        )}
                    </TouchableOpacity>

                    {tab === 'login' ? (
                        <>
                            <View style={styles.divider}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>OR</Text>
                                <View style={styles.dividerLine} />
                            </View>

                            <TouchableOpacity style={styles.googleBtn} onPress={() => Alert.alert('Notice', 'Google login config pending.')} activeOpacity={0.8}>
                                <Text style={styles.googleBtnText}>CONTINUE WITH GOOGLE</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.switchBtn} onPress={() => { setTab('register'); setStep(1); setLocalError(''); }}>
                                <Text style={styles.switchBtnText}>DON'T HAVE AN ACCOUNT? <Text style={styles.switchBtnBold}>JOIN NOW</Text></Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <TouchableOpacity style={styles.switchBtn} onPress={() => { setTab('login'); setLocalError(''); }}>
                            <Text style={styles.switchBtnText}>ALREADY HAVE AN ACCOUNT? <Text style={styles.switchBtnBold}>SIGN IN</Text></Text>
                        </TouchableOpacity>
                    )}

                    {tab === 'register' && step > 1 && (
                        <TouchableOpacity style={styles.backBtn} onPress={() => setStep(step - 1)}>
                            <Text style={styles.backBtnText}>BACK TO STEP {step - 1}</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Secure connection via RSA Protocol</Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    scrollContent: { flexGrow: 1, padding: 24, paddingVertical: 80 },
    header: { alignItems: 'center', marginBottom: 48 },
    logo: { width: 80, height: 80, marginBottom: 16 },
    appName: { fontSize: 32, fontWeight: '900', color: '#0F172A', letterSpacing: -1 },
    tagline: { fontSize: 12, color: '#64748B', fontWeight: '600', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1.5 },
    tabRow: { flexDirection: 'row', backgroundColor: '#F1F5F9', marginBottom: 32, padding: 4 },
    tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
    tabActive: { backgroundColor: '#FFFFFF', borderBottomWidth: 3, borderBottomColor: '#5B21B6' },
    tabText: { color: '#64748B', fontWeight: '800', fontSize: 12 },
    tabTextActive: { color: '#5B21B6' },
    card: { backgroundColor: '#F8FAFC', padding: 24, borderLeftWidth: 4, borderLeftColor: '#5B21B6' },
    cardTitle: { fontSize: 13, fontWeight: '900', color: '#0F172A', marginBottom: 24, letterSpacing: 1 },
    subHeader: { color: '#0F172A', fontSize: 14, fontWeight: '900', marginBottom: 24, textAlign: 'center', letterSpacing: 1 },
    inputGroup: { marginBottom: 24 },
    label: { color: '#475569', fontSize: 10, fontWeight: '900', marginBottom: 10, letterSpacing: 1 },
    input: {
        backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0',
        paddingHorizontal: 16, paddingVertical: 16,
        color: '#0F172A', fontSize: 14, fontWeight: '600'
    },
    optionRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    optionBtn: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' },
    optionActive: { backgroundColor: '#5B21B6', borderColor: '#5B21B6' },
    optionText: { color: '#64748B', fontSize: 11, fontWeight: '800' },
    optionTextActive: { color: '#FFFFFF' },
    uploadBox: { borderStyle: 'dashed', borderWidth: 2, borderColor: '#CBD5E1', padding: 24, alignItems: 'center', marginBottom: 16, backgroundColor: '#FFFFFF' },
    uploadText: { color: '#64748B', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
    agreementRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
    checkbox: { width: 22, height: 22, borderWidth: 2, borderColor: '#CBD5E1', marginRight: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
    checkboxActive: { backgroundColor: '#5B21B6', borderColor: '#5B21B6' },
    checkIcon: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
    agreementText: { color: '#475569', fontSize: 12, fontWeight: '600', flex: 1 },
    btn: {
        backgroundColor: '#0F172A',
        paddingVertical: 20, alignItems: 'center',
        marginTop: 10
    },
    btnText: { color: '#FFFFFF', fontWeight: '900', fontSize: 14, letterSpacing: 2 },
    divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
    dividerLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
    dividerText: { marginHorizontal: 16, color: '#94A3B8', fontSize: 10, fontWeight: '900' },
    googleBtn: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingVertical: 18,
        alignItems: 'center',
    },
    googleBtnText: { color: '#0F172A', fontWeight: '900', fontSize: 12, letterSpacing: 1 },
    switchBtn: { marginTop: 24, alignItems: 'center' },
    switchBtnText: { color: '#64748B', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
    switchBtnBold: { color: '#5B21B6', fontWeight: '900' },
    backBtn: { marginTop: 24, alignItems: 'center' },
    backBtnText: { color: '#64748B', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
    errorText: { color: '#EF4444', fontSize: 12, fontWeight: '700', marginBottom: 16, textAlign: 'center', backgroundColor: '#FEE2E2', padding: 8 },
    footer: { marginTop: 48, alignItems: 'center' },
    footerText: { color: '#94A3B8', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }
});
