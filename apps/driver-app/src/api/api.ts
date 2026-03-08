import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

export const API_BASE_URL = 'http://192.168.0.161:5006';

const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use(async (config) => {
    const token = await SecureStore.getItemAsync('driver_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export const login = async (email: string, password: string) => {
    const res = await api.post('/api/auth/login', { email, password, role: 'driver' });
    return res.data;
};

export const register = async (formData: FormData) => {
    const res = await api.post('/api/auth/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
};

export const getDashboard = async () => {
    const res = await api.get('/api/dashboard');
    return res.data;
};

export const acceptRide = async (requestId: string) => {
    const res = await api.post(`/api/transport/accept-request/${requestId}`);
    return res.data;
};

export const updateRideStatus = async (jobId: string, status: string) => {
    const res = await api.patch(`/api/dashboard/jobs/${jobId}/status`, { status });
    return res.data;
};

// Wallet & Vehicles
export const getWalletTransactions = async () => {
    const res = await api.get('/api/wallet/transactions');
    return res.data;
};

export const requestWithdrawal = async (amount: number) => {
    const res = await api.post('/api/wallet/withdraw', { amount });
    return res.data;
};

export const getVehicles = async () => {
    const res = await api.get('/api/profile/driver/vehicles');
    return res.data;
};

export const addVehicle = async (data: any) => {
    const res = await api.post('/api/profile/driver/vehicles', data);
    return res.data;
};

export const rateClient = async (jobId: string, rating: number, comment: string) => {
    const res = await api.post(`/api/jobs/${jobId}/rate-client`, { rating, comment });
    return res.data;
};

export default api;
