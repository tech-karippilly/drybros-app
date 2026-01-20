"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/lib/hooks';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { StaffDashboard } from '@/components/dashboard/StaffDashboard';
import { DriverDashboard } from '@/components/dashboard/DriverDashboard';
import { AUTH_ROUTES, STORAGE_KEYS } from '@/lib/constants/auth';
import { setCredentials } from '@/lib/features/auth/authSlice';
import { getCurrentUser } from '@/lib/features/auth/authApi';

export default function DashboardPage() {
    const { user, isAuthenticated, isLogin } = useAppSelector((state) => state.auth);
    const dispatch = useAppDispatch();
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const checkAuthAndFetchUser = async () => {
            // Always check localStorage first (source of truth for authentication)
            if (typeof window === 'undefined') {
                setIsChecking(false);
                return;
            }

            const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
            const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

            // If tokens exist, user is authenticated
            if (accessToken || refreshToken) {
                // If user data is missing, fetch from /auth/me endpoint
                if (!user || !isAuthenticated || !isLogin) {
                    try {
                        // Call /auth/me to get current user details
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

                        // Update Redux state with user data and tokens
                        dispatch(setCredentials({
                            user: mappedUser,
                            accessToken: accessToken || '',
                            refreshToken: refreshToken || '',
                        }));
                    } catch (error: any) {
                        // If fetching user fails (401, etc.), clear tokens and redirect
                        console.error('Failed to fetch user data:', error);
                        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
                        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
                        router.replace(AUTH_ROUTES.LOGIN);
                        return;
                    }
                }
                setIsChecking(false);
                return;
            }

            // No tokens found - redirect to login
            router.replace(AUTH_ROUTES.LOGIN);
        };

        checkAuthAndFetchUser();
    }, []); // Run only once on mount

    // Show loading state while checking authentication
    if (isChecking) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0d59f2]"></div>
                    <p className="mt-4 text-[#49659c] dark:text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    // Check localStorage directly (source of truth) to prevent redirect loops
    // If tokens exist, user is authenticated regardless of Redux state
    let hasTokens = false;
    if (typeof window !== 'undefined') {
        const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        hasTokens = !!(accessToken || refreshToken);
    }

    // If no tokens, don't render (redirect is in progress)
    if (!hasTokens) {
        return null;
    }

    // If Redux state is not synced yet, use a default role
    // The useEffect will sync the state, but we can render in the meantime
    const displayUser = user || {
        _id: 'temp',
        email: '',
        name: 'User',
        role: 'admin',
    };

    // Role-based rendering
    switch (displayUser.role) {
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
