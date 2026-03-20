import axios from 'axios';
import { useAuthStore } from '../features/auth/hooks/useAuthStore';

const api = axios.create({
  baseURL: `http://${window.location.hostname}:8000/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const selectedBranchId = useAuthStore.getState().selectedBranchId;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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

export default api;
