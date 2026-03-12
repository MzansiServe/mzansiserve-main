import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { Alert, Vibration } from 'react-native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useAuth } from './AuthContext';
import AuraService from '../services/auraService';

interface EmergencyContextType {
    isAlertActive: boolean;
    isCountingDown: boolean;
    countdown: number;
    activeAlertType: 'security' | 'medical' | null;
    startAlertCountdown: (type: 'security' | 'medical') => void;
    cancelCountdown: () => void;
    endAlert: () => Promise<void>;
    alertUrl: string | null;
}

const EmergencyContext = createContext<EmergencyContextType | null>(null);

export const EmergencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const router = useRouter();
    const [isAlertActive, setIsAlertActive] = useState(false);
    const [isCountingDown, setIsCountingDown] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const [activeAlertType, setActiveAlertType] = useState<'security' | 'medical' | null>(null);
    const [alertUrl, setAlertUrl] = useState<string | null>(null);
    
    const countdownInterval = useRef<NodeJS.Timeout | null>(null);

    const triggerAlert = useCallback(async (type: 'security' | 'medical') => {
        if (!user) return;

        try {
            // Get location
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Location permission is required to trigger emergency alerts.');
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            
            const payload = {
                external_user_id: user.id,
                role: user.role,
                location: {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    accuracy: location.coords.accuracy || 0
                },
                alert_type: type,
                timestamp: new Date().toISOString()
            };

            const result = await AuraService.triggerAlert(payload);
            
            setIsAlertActive(true);
            setAlertUrl(result.data?.response_url || 'https://panic.aura.services/active-alert-mock'); // Fallback for testing
            
            // Navigate to active alert screen
            router.push('/active-alert');
            
        } catch (error) {
            console.error('Alert trigger failed:', error);
            Alert.alert('Emergency Error', 'Failed to trigger alert. Please try calling emergency services directly.');
        } finally {
            setIsCountingDown(false);
        }
    }, [user, router]);

    const startAlertCountdown = useCallback((type: 'security' | 'medical') => {
        if (isAlertActive || isCountingDown) return;

        setActiveAlertType(type);
        setIsCountingDown(true);
        setCountdown(5);
        Vibration.vibrate([0, 500, 200, 500], false);

        countdownInterval.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    if (countdownInterval.current) clearInterval(countdownInterval.current);
                    triggerAlert(type);
                    return 0;
                }
                Vibration.vibrate(100);
                return prev - 1;
            });
        }, 1000);
    }, [isAlertActive, isCountingDown, triggerAlert]);

    const cancelCountdown = useCallback(() => {
        if (countdownInterval.current) {
            clearInterval(countdownInterval.current);
            countdownInterval.current = null;
        }
        setIsCountingDown(false);
        setActiveAlertType(null);
        Vibration.cancel();
    }, []);

    const endAlert = useCallback(async () => {
        // In a real app, you might notify Aura that the alert is resolved
        setIsAlertActive(false);
        setAlertUrl(null);
        setActiveAlertType(null);
        router.push('/(tabs)');
    }, [router]);

    return (
        <EmergencyContext.Provider value={{
            isAlertActive,
            isCountingDown,
            countdown,
            activeAlertType,
            startAlertCountdown,
            cancelCountdown,
            endAlert,
            alertUrl
        }}>
            {children}
        </EmergencyContext.Provider>
    );
};

export const useEmergency = () => {
    const context = useContext(EmergencyContext);
    if (!context) throw new Error('useEmergency must be used within EmergencyProvider');
    return context;
};
