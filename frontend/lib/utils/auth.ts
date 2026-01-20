import { STORAGE_KEYS, AUTH_ROUTES } from '../constants/auth';
import { logout as logoutApi } from '../features/auth/authApi';

/**
 * Clear authentication tokens from localStorage
 */
export function clearAuthTokens(): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    }
}

/**
 * Get authentication tokens from localStorage
 */
export function getAuthTokens(): {
    accessToken: string | null;
    refreshToken: string | null;
} {
    if (typeof window !== 'undefined') {
        return {
            accessToken: localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
            refreshToken: localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
        };
    }
    return {
        accessToken: null,
        refreshToken: null,
    };
}

/**
 * Handle user logout
 * Calls logout API, clears tokens, dispatches logout action, and redirects to login
 */
export async function handleLogout(
    dispatch: (action: any) => void,
    logoutAction: () => any,
    router?: { push: (path: string) => void }
): Promise<void> {
    try {
        // Call logout API to notify backend
        // The API call includes the Bearer token automatically via axios interceptor
        await logoutApi();
    } catch (error) {
        // Even if API call fails, proceed with client-side logout
        // This ensures user can always log out even if network is down
        console.error('Logout API call failed:', error);
    }
    
    // Clear tokens from localStorage
    clearAuthTokens();
    
    // Dispatch logout action to clear Redux state
    dispatch(logoutAction());
    
    // Redirect to login page
    if (router) {
        router.push(AUTH_ROUTES.LOGIN);
    } else if (typeof window !== 'undefined') {
        window.location.href = AUTH_ROUTES.LOGIN;
    }
}
