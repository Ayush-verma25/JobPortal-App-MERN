// utils/axiosConfig.js or utils/api.js
import axios from 'axios';
import { toast } from 'sonner';

// Create axios instance
const api = axios.create({
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            toast.error('Session expired. Please login again.');
            
            // Redirect to login page
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
        } else if (error.response?.status === 403) {
            toast.error('Access denied. You do not have permission to perform this action.');
        } else if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
            toast.error('Network error. Please check your connection.');
        }
        
        return Promise.reject(error);
    }
);

export default api;

// Alternative: Configure default axios
// You can also configure the default axios instance instead of creating a new one
/*
axios.defaults.withCredentials = true;
axios.defaults.headers.common['Content-Type'] = 'application/json';

axios.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            toast.error('Session expired. Please login again.');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);
*/
