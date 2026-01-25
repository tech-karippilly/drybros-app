"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/lib/hooks';
import { setCredentials } from '@/lib/features/auth/authSlice';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { ManagerDashboard } from '@/components/dashboard/ManagerDashboard';
import { StaffDashboard } from '@/components/dashboard/StaffDashboard';
import { DriverDashboard } from '@/components/dashboard/DriverDashboard';
import { AUTH_ROUTES, REFRESH_TOKEN_EXPIRED_ERROR } from '@/lib/constants/auth';
import { mapBackendRoleToFrontend, USER_ROLES } from '@/lib/constants/roles';
import { getAuthTokens } from '@/lib/utils/auth';
import { getCurrentUser } from '@/lib/features/auth/authApi';
import { getIsRefreshTokenExpired } from '@/lib/utils/tokenRefresh';
import { fetchFranchises, fetchFranchiseById } from '@/lib/features/franchise/franchiseSlice';
import { getFranchiseByCode } from '@/lib/features/franchise/franchiseApi';

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

            // Fetch franchises based on role
            const userRole = mapBackendRoleToFrontend(userData.role);
            if (userRole === USER_ROLES.ADMIN) {
                // Admin: fetch all franchises
                await dispatch(fetchFranchises()).unwrap();
            } else {
                // For other roles (manager, staff, driver): fetch franchise by code if available
                // Note: If user data includes franchiseCode, use getFranchiseByCode
                // For now, we'll fetch all and let the user select if needed
                // You can add franchiseCode to user data in backend if needed
                try {
                    await dispatch(fetchFranchises()).unwrap();
                } catch (franchiseError) {
                    // If franchise fetch fails, continue anyway
                    console.warn('Failed to fetch franchises:', franchiseError);
                }
            }
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

    const role = user?.role || USER_ROLES.ADMIN;
    const DashboardComponent = {
        [USER_ROLES.ADMIN]: AdminDashboard,
        [USER_ROLES.MANAGER]: ManagerDashboard,
        [USER_ROLES.STAFF]: StaffDashboard,
        [USER_ROLES.DRIVER]: DriverDashboard,
    }[role] || AdminDashboard;

    return <DashboardComponent />;
}
