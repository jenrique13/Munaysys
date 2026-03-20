import axios from 'axios';
import api from '../../../services/api';

const BASE = '/auth';

export interface LoginParams {
    email: string;
    password: string;
}

export const authService = {
    login: async (credentials: LoginParams) => {
        // FastAPI OAuth2 expects form-encoded data with 'username' and 'password'
        const formData = new URLSearchParams();
        formData.append('username', credentials.email);
        formData.append('password', credentials.password);

        // We use standard axios here because 'api' interceptor might block us if we don't have a token yet
        // and we want to target the backend directly.
        const response = await axios.post<{ access_token: string; token_type: string }>(
            `${import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000/api/v1`}${BASE}/login`,
            formData,
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
        return response.data;
    },

    // Uses the interceptor 'api' since we must be authenticated to check 'me'
    me: async () => {
        const response = await api.get(`${BASE}/me`);
        return response.data;
    }
};
