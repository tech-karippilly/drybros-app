import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { STORAGE_KEYS, AUTH_ROUTES } from '@/lib/constants/auth';

/**
 * Hook to guard back button navigation
 * Checks if access token exists, if not redirects to login
 */
export function useBackButtonGuard() {
    const router = useRouter();

    useEffect(() => {
        const handlePopState = () => {
            // Check if access token exists
            if (typeof window !== 'undefined') {
                const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
                
                // If no access token, redirect to login
                if (!accessToken) {
                    router.replace(AUTH_ROUTES.LOGIN);
                }
            }
        };

        // Listen to browser back/forward button
        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [router]);
}
