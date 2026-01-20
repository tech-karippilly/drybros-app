"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/lib/hooks';
import { setCredentials } from '@/lib/features/auth/authSlice';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { StaffDashboard } from '@/components/dashboard/StaffDashboard';
import { DriverDashboard } from '@/components/dashboard/DriverDashboard';
import { AUTH_ROUTES } from '@/lib/constants/auth';
import { getAuthTokens } from '@/lib/utils/auth';
import { getCurrentUser } from '@/lib/features/auth/authApi';
import { getIsRefreshTokenExpired } from '@/lib/utils/tokenRefresh';

export default function DashboardPage() {
    const { user, isAuthenticated, isLogin } = useAppSelector((state) => state.auth);
    const dispatch = useAppDispatch();
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);
    const [isLoadingUser, setIsLoadingUser] = useState(false);

    useEffect(() => {
        const checkAuthAndLoadUser = async () => {
            // Check if refresh token is expired - if so, don't load dashboard
            if (getIsRefreshTokenExpired()) {
                setIsChecking(false);
                return; // Modal will handle the UI
            }

            // Check both Redux state and localStorage
            const tokens = getAuthTokens();
            const hasAuth = isAuthenticated || isLogin || !!tokens.accessToken;

            if (!hasAuth) {
                // No authentication found, redirect to login
                router.replace(AUTH_ROUTES.LOGIN);
                return;
            }

            // If authenticated but user data is missing, fetch it
            if ((isAuthenticated || isLogin) && !user && tokens.accessToken) {
                setIsLoadingUser(true);
                try {
                    const userData = await getCurrentUser();
                    
                    // Map backend user response to frontend User type
                    const mapRole = (backendRole: string): string => {
                        const role = backendRole.toUpperCase();
                        if (role === 'ADMIN') return 'admin';
                        if (role === 'OFFICE_STAFF' || role === 'STAFF') return 'staff';
                        if (role === 'DRIVER') return 'driver';
                        return 'admin';
                    };

                    const mappedUser = {
                        _id: userData.id,
                        email: userData.email,
                        name: userData.fullName,
                        role: mapRole(userData.role),
                    };

                    // Update Redux state with user data
                    dispatch(setCredentials({
                        user: mappedUser,
                        accessToken: tokens.accessToken || '',
                        refreshToken: tokens.refreshToken || '',
                    }));
                } catch (error: any) {
                    // Check if this is a refresh token expired error
                    if (error?.message === 'REFRESH_TOKEN_EXPIRED') {
                        // Don't redirect - modal will handle it
                        // Just stop loading and don't show dashboard
                        setIsLoadingUser(false);
                        setIsChecking(false);
                        return;
                    }
                    
                    // If fetching user fails for other reasons, clear tokens and redirect to login
                    // Suppress error logging for refresh token expired
                    if (error?.message !== 'REFRESH_TOKEN_EXPIRED') {
                        // Only log non-refresh-token errors silently
                        // Don't show axios errors to user
                    }
                    router.replace(AUTH_ROUTES.LOGIN);
                    return;
                } finally {
                    setIsLoadingUser(false);
                }
            }

            // User is authenticated, show dashboard
            setIsChecking(false);
        };

        checkAuthAndLoadUser();
    }, [isAuthenticated, isLogin, user, router, dispatch]);

    // Show loading state while checking authentication or fetching user data
    if (isChecking || isLoadingUser) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0d59f2]"></div>
                    <p className="mt-4 text-[#49659c] dark:text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    // If no user data but has tokens, check if refresh token expired
    if (!isAuthenticated && !isLogin) {
        // Check if we're waiting for refresh token modal
        const tokens = getAuthTokens();
        if (!tokens.accessToken && !tokens.refreshToken) {
            // No tokens, but might be showing modal - don't render dashboard
            return null;
        }
        return null;
    }

    // Role-based rendering
    switch (user?.role) {
        case 'admin':
            return <AdminDashboard />;
        case 'staff':
            return <StaffDashboard />;
        case 'driver':
            return <DriverDashboard />;
        default:
            return <AdminDashboard />; // Default to admin for now if role is missing but authenticated
    }
}
