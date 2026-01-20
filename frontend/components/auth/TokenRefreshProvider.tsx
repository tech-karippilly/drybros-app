"use client";

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { ReloginModal } from './ReloginModal';
import { setRefreshTokenExpiredCallback, clearRefreshTokenExpiredCallback } from '@/lib/utils/tokenRefresh';
import { AUTH_ROUTES } from '@/lib/constants/auth';

export function TokenRefreshProvider({ children }: { children: React.ReactNode }) {
    const [showReloginModal, setShowReloginModal] = useState(false);
    const pathname = usePathname();
    const modalShownRef = useRef(false);

    useEffect(() => {
        // Set callback to show modal when refresh token expires
        setRefreshTokenExpiredCallback(() => {
            // Only show modal once, prevent multiple triggers
            if (!modalShownRef.current) {
                modalShownRef.current = true;
                setShowReloginModal(true);
            }
        });

        // Cleanup on unmount
        return () => {
            clearRefreshTokenExpiredCallback();
        };
    }, []);

    // Close modal ONLY when user navigates to login page
    // Don't close it for any other reason
    useEffect(() => {
        if (pathname === AUTH_ROUTES.LOGIN) {
            // Only close if we're actually on login page (not just checking)
            setShowReloginModal(false);
            modalShownRef.current = false; // Reset flag when on login page
        }
        // Don't close modal for any other pathname change
    }, [pathname]);

    return (
        <>
            {children}
            <ReloginModal 
                isOpen={showReloginModal} 
                onClose={() => setShowReloginModal(false)}
            />
        </>
    );
}
