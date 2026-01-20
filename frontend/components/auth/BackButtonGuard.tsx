"use client";

import { useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { STORAGE_KEYS, AUTH_ROUTES } from '@/lib/constants/auth';

interface BackButtonGuardProps {
    children: ReactNode;
}

/**
 * Component to guard back button navigation
 * Checks if access token exists when navigating back, if not redirects to login
 */
export function BackButtonGuard({ children }: BackButtonGuardProps) {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const handlePopState = () => {
            // Check if access token exists
            if (typeof window !== 'undefined') {
                const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
                
                // If no access token and not already on login page, redirect to login
                if (!accessToken && pathname !== AUTH_ROUTES.LOGIN) {
                    router.replace(AUTH_ROUTES.LOGIN);
                }
            }
        };

        // Listen to browser back/forward button
        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [router, pathname]);

    return <>{children}</>;
}
