import { useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from './useAuthStore';

// Decodes a JWT token without requiring external libraries
function parseJwt(token: string) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

export const useSessionManager = () => {
    const { user, logout, refreshToken } = useAuthStore();
    const isRefreshing = useRef(false);

    // Track user activity and store in localStorage to sync across tabs
    const updateActivity = useCallback(() => {
        if (!user) return;
        const now = Date.now().toString();
        // Throttle updates to localStorage to avoid excessive writes
        const lastActivity = localStorage.getItem('lastActivity');
        if (!lastActivity || Date.now() - parseInt(lastActivity, 10) > 5000) {
            localStorage.setItem('lastActivity', now);
        }
    }, [user]);

    // Setup activity listeners
    useEffect(() => {
        if (!user) return;

        // Initialize last activity if not present
        if (!localStorage.getItem('lastActivity')) {
            localStorage.setItem('lastActivity', Date.now().toString());
        }

        const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
        events.forEach(event => {
            window.addEventListener(event, updateActivity, { passive: true });
        });

        return () => {
            events.forEach(event => {
                window.removeEventListener(event, updateActivity);
            });
        };
    }, [user, updateActivity]);

    // Session validation timer
    useEffect(() => {
        if (!user) return;

        const checkSession = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            const decoded = parseJwt(token);
            if (!decoded || !decoded.exp) return;

            const expTimeMs = decoded.exp * 1000;
            const now = Date.now();
            const timeUntilExpMs = expTimeMs - now;

            // If token has already expired
            if (timeUntilExpMs <= 0) {
                console.warn('Session expired. Logging out.');
                logout();
                return;
            }

            // If token expires in less than 5 minutes, decide whether to refresh or expire
            if (timeUntilExpMs < 5 * 60 * 1000 && !isRefreshing.current) {
                const lastActivityStr = localStorage.getItem('lastActivity');
                const lastActivity = lastActivityStr ? parseInt(lastActivityStr, 10) : 0;
                const inactiveTimeMs = now - lastActivity;

                // User active within the last 15 minutes
                if (inactiveTimeMs < 15 * 60 * 1000) {
                    isRefreshing.current = true;
                    try {
                        await refreshToken();
                    } finally {
                        isRefreshing.current = false;
                    }
                } else {
                    // Do nothing. Token will expire naturally.
                    // A future check (when timeUntilExpMs <= 0) will log them out.
                    console.log('User inactive. Letting token expire naturally.');
                }
            }
        };

        // Run check initially and then every minute
        checkSession();
        const intervalId = setInterval(checkSession, 60 * 1000);

        return () => clearInterval(intervalId);
    }, [user, logout, refreshToken]);
};
