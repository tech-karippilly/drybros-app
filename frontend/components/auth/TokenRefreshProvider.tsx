"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { ReloginModal } from './ReloginModal';
import { setRefreshTokenExpiredCallback, clearRefreshTokenExpiredCallback } from '@/lib/utils/tokenRefresh';
import { AUTH_ROUTES } from '@/lib/constants/auth';

export function TokenRefreshProvider({ children }: { children: React.ReactNode }) {
    const [showReloginModal, setShowReloginModal] = useState(false);
    const pathname = usePathname();
    const modalShownRef = useRef(false);

    const handleCloseModal = useCallback(() => {
        setShowReloginModal(false);
    }, []);

    const handleShowModal = useCallback(() => {
        if (!modalShownRef.current) {
            modalShownRef.current = true;
            setShowReloginModal(true);
        }
    }, []);

    useEffect(() => {
        setRefreshTokenExpiredCallback(handleShowModal);
        return () => clearRefreshTokenExpiredCallback();
    }, [handleShowModal]);

    useEffect(() => {
        if (pathname === AUTH_ROUTES.LOGIN) {
            setShowReloginModal(false);
            modalShownRef.current = false;
        }
    }, [pathname]);

    return (
        <>
            {children}
            <ReloginModal isOpen={showReloginModal} onClose={handleCloseModal} />
        </>
    );
}
