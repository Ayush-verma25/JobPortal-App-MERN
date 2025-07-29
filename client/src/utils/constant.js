// utils/constant.js
const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? process.env.VITE_BACKEND_URL || 'https://your-backend-api.vercel.app/api/v1'
    : 'http://localhost:8000/api/v1';

export const USER_API_END_POINT = `${API_BASE_URL}/api/v1/user`;
export const JOB_API_END_POINT = `${API_BASE_URL}/api/v1/job`;
export const APPLICATION_API_END_POINT = `${API_BASE_URL}/api/v1/application`;
export const COMPANY_API_END_POINT = `${API_BASE_URL}/api/v1/company`;
