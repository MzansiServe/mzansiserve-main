import React, { useState } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { Mail, Lock, User, UserPlus, ArrowLeft } from 'lucide-react-native';
import { COLORS, SPACING, SIZES, SHADOWS } from '../constants/Theme';
import { Typography } from '../components/UI/Typography';
import { Input } from '../components/UI/Input';
import { Button } from '../components/UI/Button';
import { Card } from '../components/UI/Card';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const router = useRouter();

    const handleRegister = async () => {
        if (!name || !email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            const result = await register(name, email, password, 'client');
            if (result.success) {
                Alert.alert('Success', 'Account created successfully', [
                    { text: 'OK', onPress: () => router.replace('/login' as any) }
                ]);
            } else {
                Alert.alert('Registration Failed', result.error);
            }
        } catch (error) {
            Alert.alert('Error', 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <ArrowLeft color={COLORS.gray[800]} size={24} />
                </TouchableOpacity>

                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <UserPlus color={COLORS.primary} size={40} />
                    </View>
                    <Typography variant="h1" style={styles.title}>Create Account</Typography>
                    <Typography variant="body" color={COLORS.gray[500]} align="center">
                        Join MzansiServe and find the best services today.
                    </Typography>
                </View>

                <Card shadow="md" style={styles.formCard}>
                    <Input
                        label="Full Name"
                        placeholder="e.g. John Doe"
                        value={name}
                        onChangeText={setName}
                        icon={<User color={COLORS.gray[400]} size={20} />}
                    />
                    <Input
                        label="Email Address"
                        placeholder="e.g. name@example.com"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        icon={<Mail color={COLORS.gray[400]} size={20} />}
                    />
                    <Input
                        label="Password"
                        placeholder="••••••••"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        icon={<Lock color={COLORS.gray[400]} size={20} />}
                    />

                    <Button
                        title="Register"
                        onPress={handleRegister}
                        loading={loading}
                        style={{ marginTop: SPACING.md }}
                    />
                </Card>

                <View style={styles.footer}>
                    <Typography variant="body" color={COLORS.gray[600]}>Already have an account? </Typography>
                    <TouchableOpacity onPress={() => router.push('/login' as any)}>
                        <Typography variant="body" color={COLORS.primary} weight="bold">Log In</Typography>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        flexGrow: 1,
        padding: SPACING.lg,
        paddingTop: SPACING.xxl,
    },
    backButton: {
        width: 44,
        height: 44,
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radius.xl,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    header: {
        alignItems: 'center',
        marginBottom: SPACING.xxl,
    },
    logoContainer: {
        width: 80,
        height: 80,
        backgroundColor: COLORS.primary + '10',
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    title: {
        marginBottom: SPACING.xs,
    },
    formCard: {
        marginBottom: SPACING.xl,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 'auto',
        paddingBottom: SPACING.lg,
    },
});
