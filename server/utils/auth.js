// utils/auth.js
export const getAuthToken = () => {
    return localStorage.getItem('authToken');
};

export const setAuthToken = (token) => {
    localStorage.setItem('authToken', token);
};

export const clearAuthTokens = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('token');
    sessionStorage.clear();
};

export const getAuthHeaders = () => {
    const token = getAuthToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};
