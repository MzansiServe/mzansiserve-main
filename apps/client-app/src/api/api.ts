import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

export const API_BASE_URL = 'http://192.168.0.161:5006';

const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use(async (config) => {
    const token = await SecureStore.getItemAsync('client_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export const login = async (email: string, password: string) => {
    const res = await api.post('/api/auth/login', { email, password, role: 'client' });
    return res.data;
};

export const register = async (formData: FormData) => {
    const res = await api.post('/api/auth/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
};

export const requestCab = async (data: object) => {
    const res = await api.post('/api/transport/request-cab', data);
    return res.data;
};

export const getProfessionals = async () => {
    const res = await api.get('/api/profile/professionals');
    return res.data;
};

export const getServiceProviders = async () => {
    const res = await api.get('/api/profile/service-providers');
    return res.data;
};

export const getShopProducts = async () => {
    const res = await api.get('/api/shop/products');
    return res.data;
};

export const createOrder = async (orderData: any) => {
    const res = await api.post('/api/payments/create-order', orderData);
    return res.data;
};

export const getOrderHistory = async () => {
    const res = await api.get('/api/shopping-history');
    return res.data;
};

export const getProfile = async () => {
    const res = await api.get('/api/profile');
    return res.data;
};

export default api;
