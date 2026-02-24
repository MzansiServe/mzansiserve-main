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

    // Form State - Exactly matching web Register.tsx for Driver role
    const [form, setForm] = useState({
        name: '', surname: '', email: '', phone: '', password: '', confirmPassword: '',
        gender: '', nationality: 'South Africa', id_number: '', role: 'driver',
        nokName: '', nokPhone: '', nokEmail: '',
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
            if (!form.gender) { setLocalError('Gender selection is required'); return false; }
            return true;
        }
        if (step === 3) {
            if (!form.nokName) { setLocalError('Next of Kin name is required'); return false; }
            if (!form.nokPhone && !form.nokEmail) { setLocalError('Next of Kin contact is required'); return false; }
            return true;
        }
        if (step === 4) {
            if (!files.profile_photo || !files.id_document || !files.drivers_license || !files.proof_of_residence) {
                setLocalError('All documents are required for fleet registration');
                return false;
            }
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
                    await SecureStore.setItemAsync('driver_token', res.data.token);
                    setInitialLoading(true);
                    setTimeout(() => navigation.replace('Main'), 1500);
                } else { setLocalError(res.error?.message || 'Invalid credentials'); }
            } catch (err: any) { setLocalError('Login failed'); }
            finally { setLoading(false); }
            return;
        }

        if (!validateStep()) return;

        if (step < 4) {
            setStep(step + 1);
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            const registration_data = {
                email: form.email.trim(),
                password: form.password,
                password_confirm: form.confirmPassword,
                role: 'driver',
                full_name: form.name.trim(),
                surname: form.surname.trim(),
                phone: form.phone.trim(),
                gender: form.gender.toLowerCase(),
                nationality: form.nationality,
                id_number: form.id_number.trim(),
                next_of_kin: {
                    full_name: form.nokName.trim(),
                    contact_number: form.nokPhone.trim(),
                    contact_email: form.nokEmail.trim()
                }
            };

            formData.append('registration_data', JSON.stringify(registration_data));

            Object.keys(files).forEach(key => {
                const file = files[key];
                formData.append(key, {
                    uri: file.uri,
                    name: file.name || `driver_upload_${key}.jpg`,
                    type: file.mimeType || 'image/jpeg',
                } as any);
            });

            const res = await register(formData);
            if (res.success) {
                Alert.alert('✅ Success', 'Application submitted! We will review your documents shortly.');
                setTab('login');
                setStep(1);
            } else { setLocalError(res.error || 'Registration failed'); }
        } catch (err: any) {
            setLocalError(err?.response?.data?.error?.message || 'Server unreachable');
        } finally { setLoading(false); }
    };

    if (initialLoading) return <LoadingScreen message="Setting up your driver console..." />;

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <View style={styles.header}>
                    <View style={styles.logoBadge}><Text style={styles.logoIcon}>🚗</Text></View>
                    <Text style={styles.appName}>MzansiDrive</Text>
                    <Text style={styles.tagline}>{tab === 'login' ? "Professional Driver Portal" : `Application Step ${step} of 4`}</Text>
                </View>

                <View style={styles.card}>
                    {tab === 'login' ? (
                        <>
                            <Text style={styles.cardTitle}>SIGN IN TO DRIVE</Text>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Email Address</Text>
                                <TextInput style={styles.input} placeholder="driver@mzansiserve.co.za" placeholderTextColor="#475569" value={form.email} onChangeText={v => update('email', v)} autoCapitalize="none" />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Password</Text>
                                <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor="#475569" value={form.password} onChangeText={v => update('password', v)} secureTextEntry />
                            </View>
                        </>
                    ) : (
                        <>
                            <Text style={styles.cardTitle}>DRIVER APPLICATION</Text>
                            {step === 1 && (
                                <>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Email Address</Text>
                                        <TextInput style={styles.input} placeholder="you@example.co.za" placeholderTextColor="#475569" value={form.email} onChangeText={v => update('email', v)} autoCapitalize="none" keyboardType="email-address" />
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Create Password</Text>
                                        <TextInput style={styles.input} placeholder="Min 8 characters" placeholderTextColor="#475569" value={form.password} onChangeText={v => update('password', v)} secureTextEntry />
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Confirm Password</Text>
                                        <TextInput style={styles.input} placeholder="Re-enter password" placeholderTextColor="#475569" value={form.confirmPassword} onChangeText={v => update('confirmPassword', v)} secureTextEntry />
                                    </View>
                                </>
                            )}
                            {step === 2 && (
                                <>
                                    <View style={styles.inputGroup}>
                                        <View style={{ flexDirection: 'row', gap: 12 }}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.label}>First Name</Text>
                                                <TextInput style={styles.input} placeholder="Thabo" placeholderTextColor="#475569" value={form.name} onChangeText={v => update('name', v)} />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.label}>Surname</Text>
                                                <TextInput style={styles.input} placeholder="Mokoena" placeholderTextColor="#475569" value={form.surname} onChangeText={v => update('surname', v)} />
                                            </View>
                                        </View>
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Phone Number</Text>
                                        <TextInput style={styles.input} placeholder="081 000 1111" placeholderTextColor="#475569" value={form.phone} onChangeText={v => update('phone', v)} keyboardType="phone-pad" />
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Nationality</Text>
                                        <View style={styles.roleRow}>
                                            {['South Africa', 'Other'].map((n) => (
                                                <TouchableOpacity key={n} style={[styles.roleBtn, form.nationality === n && styles.roleBtnActive]} onPress={() => update('nationality', n)}>
                                                    <Text style={[styles.roleBtnText, form.nationality === n && styles.roleBtnTextActive]}>{n}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>{form.nationality === 'South Africa' ? 'ID Number' : 'Passport Number'}</Text>
                                        <TextInput style={styles.input} placeholder="Enter your ID" placeholderTextColor="#475569" value={form.id_number} onChangeText={v => update('id_number', v)} />
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Gender</Text>
                                        <View style={styles.roleRow}>
                                            {['Male', 'Female', 'Other'].map((g) => (
                                                <TouchableOpacity key={g} style={[styles.roleBtn, form.gender === g && styles.roleBtnActive]} onPress={() => update('gender', g)}>
                                                    <Text style={[styles.roleBtnText, form.gender === g && styles.roleBtnTextActive]}>{g}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                </>
                            )}
                            {step === 3 && (
                                <>
                                    <Text style={styles.subHeader}>Next of Kin Details</Text>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Full Name</Text>
                                        <TextInput style={styles.input} placeholder="Emergency Contact Name" placeholderTextColor="#475569" value={form.nokName} onChangeText={v => update('nokName', v)} />
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Phone Number</Text>
                                        <TextInput style={styles.input} placeholder="Emergency Phone" placeholderTextColor="#475569" value={form.nokPhone} onChangeText={v => update('nokPhone', v)} keyboardType="phone-pad" />
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Email Address (Optional)</Text>
                                        <TextInput style={styles.input} placeholder="Emergency Email" placeholderTextColor="#475569" value={form.nokEmail} onChangeText={v => update('nokEmail', v)} autoCapitalize="none" />
                                    </View>
                                </>
                            )}
                            {step === 4 && (
                                <>
                                    <Text style={styles.subHeader}>Required Fleet Documents</Text>
                                    <TouchableOpacity style={styles.uploadBox} onPress={() => pickImage('profile_photo')}>
                                        <Text style={styles.uploadText}>{files.profile_photo ? "✅ Profile Photo Selected" : "📸 Upload Profile Photo (Required)"}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.uploadBox} onPress={() => pickDocument('id_document')}>
                                        <Text style={styles.uploadText}>{files.id_document ? "✅ ID Document Selected" : "📄 Upload ID / Passport (Required)"}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.uploadBox} onPress={() => pickDocument('drivers_license')}>
                                        <Text style={styles.uploadText}>{files.drivers_license ? "✅ License Selected" : "🪪 Upload Driver's License (Required)"}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.uploadBox} onPress={() => pickDocument('proof_of_residence')}>
                                        <Text style={styles.uploadText}>{files.proof_of_residence ? "✅ Proof of Residence Selected" : "🏠 Upload Proof of Residence (Required)"}</Text>
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
                                {tab === 'login' ? 'SIGN IN TO DASHBOARD' : (step === 4 ? 'PAY AND APPLY' : 'CONTINUE')}
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
                                <Text style={styles.switchBtnText}>NEW TO MZANSIDRIVE? <Text style={styles.switchBtnBold}>JOIN THE FLEET</Text></Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <TouchableOpacity style={styles.switchBtn} onPress={() => { setTab('login'); setLocalError(''); }}>
                            <Text style={styles.switchBtnText}>ALREADY REGISTERED? <Text style={styles.switchBtnBold}>SIGN IN</Text></Text>
                        </TouchableOpacity>
                    )}

                    {tab === 'register' && step > 1 && (
                        <TouchableOpacity style={styles.backBtn} onPress={() => setStep(step - 1)}>
                            <Text style={styles.backBtnText}>Back to Step {step - 1}</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <Text style={styles.legal}>Securely handled by MzansiDrive. RSA Privacy Compliant.</Text>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    scrollContent: { flexGrow: 1, padding: 24, paddingVertical: 60 },
    header: { alignItems: 'center', marginBottom: 32 },
    logoBadge: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#7c3aed22', alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#7c3aed66' },
    logoIcon: { fontSize: 28 },
    appName: { fontSize: 32, fontWeight: '900', color: '#f8fafc', letterSpacing: -1 },
    tagline: { fontSize: 13, color: '#64748b', fontWeight: '500', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
    tabRow: { flexDirection: 'row', backgroundColor: '#1e293b', borderRadius: 24, marginBottom: 28, padding: 6 },
    tab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 18 },
    tabActive: { backgroundColor: '#7c3aed' },
    tabText: { color: '#64748b', fontWeight: '700', fontSize: 13 },
    tabTextActive: { color: '#fff' },
    card: { backgroundColor: '#1e293b99', borderRadius: 32, padding: 24, borderLeftWidth: 4, borderLeftColor: '#7c3aed' },
    cardTitle: { fontSize: 13, fontWeight: '900', color: '#f1f5f9', marginBottom: 24, letterSpacing: 1 },
    subHeader: { color: '#f8fafc', fontSize: 16, fontWeight: '800', marginBottom: 20, textAlign: 'center' },
    inputGroup: { marginBottom: 20 },
    label: { color: '#94a3b8', fontSize: 11, fontWeight: '800', marginBottom: 10, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: {
        backgroundColor: '#0f172a', borderWidth: 1.5, borderColor: '#334155',
        borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14,
        color: '#f1f5f9', fontSize: 15, fontWeight: '500'
    },
    roleRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    roleBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155' },
    roleBtnActive: { backgroundColor: '#3b82f622', borderColor: '#3b82f6' },
    roleBtnText: { color: '#64748b', fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
    roleBtnTextActive: { color: '#3b82f6' },
    uploadBox: { borderRadius: 18, borderStyle: 'dashed', borderWidth: 2, borderColor: '#334155', padding: 20, alignItems: 'center', marginBottom: 12, backgroundColor: '#0f172a' },
    uploadText: { color: '#94a3b8', fontSize: 12, fontWeight: '600', textAlign: 'center' },
    agreementRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 16, paddingHorizontal: 4 },
    checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#334155', marginRight: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' },
    checkboxActive: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
    checkIcon: { color: '#fff', fontSize: 14, fontWeight: '900' },
    agreementText: { color: '#94a3b8', fontSize: 13, fontWeight: '500', flex: 1 },
    btn: {
        backgroundColor: '#7c3aed', borderRadius: 20,
        paddingVertical: 18, alignItems: 'center',
        shadowColor: '#7c3aed', shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3, shadowRadius: 12, elevation: 8, marginTop: 10
    },
    btnText: { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 1 },
    divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
    dividerLine: { flex: 1, height: 1.5, backgroundColor: '#334155' },
    dividerText: { marginHorizontal: 16, color: '#64748b', fontSize: 10, fontWeight: '900' },
    googleBtn: {
        backgroundColor: '#f1f5f9',
        borderRadius: 20,
        paddingVertical: 18,
        alignItems: 'center',
    },
    googleBtnText: { color: '#0f172a', fontWeight: '900', fontSize: 13, letterSpacing: 1 },
    switchBtn: { marginTop: 24, alignItems: 'center' },
    switchBtnText: { color: '#94a3b8', fontSize: 12, fontWeight: '600', letterSpacing: 0.2 },
    switchBtnBold: { color: '#7c3aed', fontWeight: '900' },
    backBtn: { marginTop: 16, alignItems: 'center' },
    backBtnText: { color: '#475569', fontSize: 13, fontWeight: '700' },
    errorText: { color: '#ef4444', fontSize: 12, fontWeight: '700', marginBottom: 16, textAlign: 'center', backgroundColor: '#ef444422', padding: 10, borderRadius: 12 },
    legal: { color: '#334155', fontSize: 11, textAlign: 'center', marginTop: 32, fontWeight: '700' }
});
