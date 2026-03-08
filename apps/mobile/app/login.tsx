import React, { useState } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { Mail, Lock, LogIn, ArrowLeft } from 'lucide-react-native';
import { COLORS, SPACING, SIZES, SHADOWS } from '../constants/Theme';
import { Typography } from '../components/UI/Typography';
import { Input } from '../components/UI/Input';
import { Button } from '../components/UI/Button';
import { Card } from '../components/UI/Card';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const result = await login(email, password, 'client');
      if (result.success) {
        const userRole = result.data.user.role;
        if (userRole === 'driver') {
          router.replace('/dashboard/driver' as any);
        } else if (userRole === 'professional') {
          router.replace('/dashboard/professional' as any);
        } else if (userRole === 'service-provider') {
          router.replace('/dashboard/service-provider' as any);
        } else {
          router.replace('/(tabs)');
        }
      } else {
        Alert.alert('Login Failed', result.error);
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
            <LogIn color={COLORS.primary} size={40} />
          </View>
          <Typography variant="h1" style={styles.title}>Welcome Back</Typography>
          <Typography variant="body" color={COLORS.gray[500]} align="center">
            Sign in to continue accessing our services and features.
          </Typography>
        </View>

        <Card shadow="md" style={styles.formCard}>
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

          <TouchableOpacity style={styles.forgotPassword}>
            <Typography variant="label" color={COLORS.primary}>Forgot Password?</Typography>
          </TouchableOpacity>

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            style={{ marginTop: SPACING.md }}
          />
        </Card>

        <View style={styles.footer}>
          <Typography variant="body" color={COLORS.gray[600]}>Don't have an account? </Typography>
          <TouchableOpacity onPress={() => router.push('/register' as any)}>
            <Typography variant="body" color={COLORS.primary} weight="bold">Register</Typography>
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
    borderRadius: SIZES.radius.md,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: SPACING.lg,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 'auto',
    paddingBottom: SPACING.lg,
  },
});
