'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { authEvents } from '@/lib/authEvents';
import { logout } from '@/lib/features/auth/authSlice';
import SessionExpiredModal from './SessionExpiredModal';

interface AuthProviderProps {
    children: React.ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const dispatch = useDispatch();
    const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false);

    useEffect(() => {
        const handleTokenExpired = () => {
            // Logout user from Redux state
            dispatch(logout());
            // Show the session expired modal
            setShowSessionExpiredModal(true);
        };

        // Subscribe to token expired event
        authEvents.on('TOKEN_EXPIRED', handleTokenExpired);

        // Cleanup subscription on unmount
        return () => {
            authEvents.off('TOKEN_EXPIRED', handleTokenExpired);
        };
    }, [dispatch]);

    const handleCloseModal = () => {
        setShowSessionExpiredModal(false);
    };

    return (
        <>
            {children}
            <SessionExpiredModal 
                open={showSessionExpiredModal} 
                onClose={handleCloseModal} 
            />
        </>
    );
};

export default AuthProvider;
