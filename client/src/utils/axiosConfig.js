// utils/axiosConfig.js or api/axiosConfig.js
import axios from 'axios';
import { toast } from 'sonner';

// Create axios instance
const api = axios.create({
    baseURL: process.env.REACT_BACKEND_URL || 'http://localhost:8000/api/v1',
    withCredentials: true,
    timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle authentication errors
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            // Clear token and redirect to login
            localStorage.removeItem('authToken');
            toast.error('Session expired. Please log in again.');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
