import axios from 'axios';
import { useAuthStore } from '../features/auth/hooks/useAuthStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to decode JWT and check expiration
const isTokenExpiredSoon = (token: string) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    // Refresh if less than 5 minutes left (of a 30 min token)
    // or if the token is already expired (though it will fail anyway)
    return (payload.exp - now) < 300;
  } catch (e) {
    return true;
  }
};

const isUserActive = () => {
  const lastActivityStr = localStorage.getItem('lastActivity');
  const lastActivity = lastActivityStr ? parseInt(lastActivityStr, 10) : 0;
  // User is active if there was activity in the last 15 minutes
  return (Date.now() - lastActivity) < 15 * 60 * 1000;
};

api.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('token');
    const authStore = useAuthStore.getState();
    const selectedBranchId = authStore.selectedBranchId;

    if (token) {
      // Sliding Session: If token is close to expire, try to refresh it silently
      // We check if it's NOT a refresh request itself to avoid loops
      if (!config.url?.endsWith('/refresh') && isTokenExpiredSoon(token)) {
        if (isUserActive()) {
          try {
            await authStore.refreshToken();
            const newToken = localStorage.getItem('token');
            if (newToken) config.headers.Authorization = `Bearer ${newToken}`;
          } catch (e) {
            // If refresh fails, continue with old token, 
            // the response interceptor will catch the 401 if needed.
            config.headers.Authorization = `Bearer ${token}`;
          }
        } else {
          // User is inactive, do not refresh
          config.headers.Authorization = `Bearer ${token}`;
        }
      } else {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    if (selectedBranchId !== null) {
      config.headers['X-Branch-Id'] = selectedBranchId;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('Session expired or unauthorized. Logging out.');
      useAuthStore.getState().logout();
      // Force redirect to login if not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
