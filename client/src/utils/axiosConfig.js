// utils/axiosConfig.js or api/axiosConfig.js
import axios from 'axios';
import { toast } from 'sonner';

// Create axios instance
const api = axios.create({
    baseURL: process.env.VITE_BACKEND_URL || 'http://localhost:8000/api/v1',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        // Get token from localStorage or cookies
        const token = localStorage.getItem('token') || 
                     document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
        
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            toast.error('Session expired. Please login again.');
            window.location.href = '/login';
        } else if (error.response?.status === 403) {
            toast.error('Access denied. Insufficient permissions.');
        }
        
        return Promise.reject(error);
    }
);

export default api;
