import React, { useState } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { Mail, Lock, LogIn, ArrowLeft } from 'lucide-react-native';
import { COLORS, SPACING, SIZES, SHADOWS } from '../constants/Theme';
import apiClient from '../api/client';
import { Shield, ChevronDown } from 'lucide-react-native';
import { Typography } from '../components/UI/Typography';
import { Input } from '../components/UI/Input';
import { Button } from '../components/UI/Button';
import { Card } from '../components/UI/Card';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const checkRoles = async (emailVal: string) => {
    if (!emailVal || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) return;
    try {
      const res = await apiClient.get(`/auth/roles-for-email?email=${encodeURIComponent(emailVal)}`);
      if (res.data.success && res.data.data.roles.length > 0) {
        setAvailableRoles(res.data.data.roles);
        if (!res.data.data.roles.includes(role)) {
          setRole(res.data.data.roles[0]);
        }
      } else {
        setAvailableRoles([]);
      }
    } catch (err) {
      console.error("Failed to fetch roles:", err);
    }
  };

  const handleLogin = async () => {
    if (!email || !password || !role) {
      Alert.alert('Error', 'Please fill in all fields including role');
      return;
    }

    setLoading(true);
    try {
      const result = await login(email, password, role);
      if (result.success) {
        const userRole = result.data.user.role;
        
        // Handle verified/paid status
        const user = result.data.user;
        if (user.email_verified && !user.is_paid && userRole !== 'client' && userRole !== 'admin') {
           // Redirect to a payment/verification screen if needed
           // For now, mirroring mobile logic
        }

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
            onChangeText={(text) => { setEmail(text); }}
            onBlur={() => checkRoles(email)}
            autoCapitalize="none"
            keyboardType="email-address"
            icon={<Mail color={COLORS.gray[400]} size={20} />}
          />

          <View style={styles.roleContainer}>
            <Typography variant="label" color={COLORS.gray[700]} style={styles.roleLabel}>Login as</Typography>
            <View style={styles.roleButtons}>
              {['client', 'driver', 'professional', 'service-provider'].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.roleButton,
                    role === r && styles.roleButtonActive
                  ]}
                  onPress={() => setRole(r)}
                >
                  <Typography
                    variant="caption"
                    color={role === r ? COLORS.white : COLORS.gray[600]}
                    weight={role === r ? 'bold' : 'normal'}
                    style={{ textTransform: 'capitalize' }}
                  >
                    {r.replace('-', ' ')}
                  </Typography>
                </TouchableOpacity>
              ))}
            </View>
            {availableRoles.length > 0 && (
              <View style={styles.foundRoles}>
                <Shield size={12} color={COLORS.primary} />
                <Typography variant="caption" color={COLORS.primary} style={{ marginLeft: 4 }}>
                  Detected roles: {availableRoles.join(', ')}
                </Typography>
              </View>
            )}
          </View>
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
  roleContainer: {
    marginBottom: SPACING.lg,
  },
  roleLabel: {
    marginBottom: SPACING.xs,
    fontWeight: 'bold',
  },
  roleButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  roleButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: SIZES.radius.md,
    backgroundColor: COLORS.gray[100],
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  roleButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  foundRoles: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    padding: SPACING.xs,
    backgroundColor: COLORS.primary + '10',
    borderRadius: SIZES.radius.sm,
  },
});
