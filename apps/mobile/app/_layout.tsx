import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import { EmergencyProvider } from '../contexts/EmergencyContext';
import { CartProvider } from '../contexts/CartContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../constants/Theme';
import { ShieldAlert } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useEmergency } from '../contexts/EmergencyContext';

const queryClient = new QueryClient();

const FloatingSOS = () => {
  const { startAlertCountdown, isCountingDown } = useEmergency();

  if (isCountingDown) return null;

  return (
    <TouchableOpacity
      style={styles.fabContainer}
      onPress={() => startAlertCountdown('security')}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={[COLORS.error, '#B91C1C']}
        style={styles.fabGradient}
      >
        <ShieldAlert color={COLORS.white} size={28} />
      </LinearGradient>
    </TouchableOpacity>
  );
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    // Add custom fonts here if needed in the future
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <View style={styles.container}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <EmergencyProvider>
            <CartProvider>
              <Stack screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: COLORS.background },
              }}>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="login" options={{ presentation: 'modal' }} />
                <Stack.Screen name="register" options={{ presentation: 'modal' }} />
                <Stack.Screen name="active-alert" options={{ presentation: 'fullScreenModal' }} />
              </Stack>
              <FloatingSOS />
            </CartProvider>
          </EmergencyProvider>
        </AuthProvider>
      </QueryClientProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 80, // Above tab bar
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    elevation: 8,
    shadowColor: COLORS.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    zIndex: 999,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
});
