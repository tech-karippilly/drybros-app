"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/lib/hooks';
import { setCredentials } from '@/lib/features/auth/authSlice';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { StaffDashboard } from '@/components/dashboard/StaffDashboard';
import { DriverDashboard } from '@/components/dashboard/DriverDashboard';
import { AUTH_ROUTES, REFRESH_TOKEN_EXPIRED_ERROR } from '@/lib/constants/auth';
import { getAuthTokens } from '@/lib/utils/auth';
import { getCurrentUser } from '@/lib/features/auth/authApi';
import { getIsRefreshTokenExpired } from '@/lib/utils/tokenRefresh';

// Role mapping function - extracted outside component for optimization
const mapBackendRoleToFrontend = (backendRole: string): string => {
    const role = backendRole.toUpperCase();
    if (role === 'ADMIN') return 'admin';
    if (role === 'OFFICE_STAFF' || role === 'STAFF') return 'staff';
    if (role === 'DRIVER') return 'driver';
    return 'admin';
};

export default function DashboardPage() {
    const { user, isAuthenticated, isLogin } = useAppSelector((state) => state.auth);
    const dispatch = useAppDispatch();
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);
    const [isLoadingUser, setIsLoadingUser] = useState(false);

    const fetchUserData = useCallback(async (tokens: ReturnType<typeof getAuthTokens>) => {
        setIsLoadingUser(true);
        try {
            const userData = await getCurrentUser();
            const mappedUser = {
                _id: userData.id,
                email: userData.email,
                name: userData.fullName,
                role: mapBackendRoleToFrontend(userData.role),
            };

            dispatch(setCredentials({
                user: mappedUser,
                accessToken: tokens.accessToken || '',
                refreshToken: tokens.refreshToken || '',
            }));
        } catch (error: any) {
            if (error?.message === REFRESH_TOKEN_EXPIRED_ERROR) {
                setIsLoadingUser(false);
                setIsChecking(false);
                return;
            }
            router.replace(AUTH_ROUTES.LOGIN);
        } finally {
            setIsLoadingUser(false);
        }
    }, [dispatch, router]);

    useEffect(() => {
        const checkAuthAndLoadUser = async () => {
            // Early return if refresh token expired
            if (getIsRefreshTokenExpired()) {
                setIsChecking(false);
                return;
            }

            const tokens = getAuthTokens();
            const hasAuth = isAuthenticated || isLogin || !!tokens.accessToken;

            if (!hasAuth) {
                router.replace(AUTH_ROUTES.LOGIN);
                return;
            }

            // Fetch user data if missing
            if ((isAuthenticated || isLogin) && !user && tokens.accessToken) {
                await fetchUserData(tokens);
            }

            setIsChecking(false);
        };

        checkAuthAndLoadUser();
    }, [isAuthenticated, isLogin, user, router, fetchUserData]);

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

    // Don't render if not authenticated
    if (!isAuthenticated && !isLogin) {
        return null;
    }

    const role = user?.role || 'admin';
    const DashboardComponent = {
        admin: AdminDashboard,
        staff: StaffDashboard,
        driver: DriverDashboard,
    }[role] || AdminDashboard;

    return <DashboardComponent />;
}
