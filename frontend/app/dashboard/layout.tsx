"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/lib/hooks';
import { setCredentials, setFranchiseList } from '@/lib/features/auth/authSlice';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { AUTH_ROUTES, REFRESH_TOKEN_EXPIRED_ERROR } from '@/lib/constants/auth';
import { mapBackendRoleToFrontend, USER_ROLES } from '@/lib/constants/roles';
import { getAuthTokens } from '@/lib/utils/auth';
import { getCurrentUser } from '@/lib/features/auth/authApi';
import { getIsRefreshTokenExpired } from '@/lib/utils/tokenRefresh';
import { fetchFranchises } from '@/lib/features/franchise/franchiseSlice';

export default function DashboardRouteLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isAuthenticated, isLogin } = useAppSelector((state) => state.auth);
    const dispatch = useAppDispatch();
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);
    const [isLoadingUser, setIsLoadingUser] = useState(false);

    const fetchUserData = useCallback(
        async (tokens: ReturnType<typeof getAuthTokens>) => {
            setIsLoadingUser(true);
            try {
                const userData = await getCurrentUser();
                const mappedUser = {
                    _id: userData.id,
                    email: userData.email,
                    name: userData.fullName,
                    role: mapBackendRoleToFrontend(userData.role),
                };

                dispatch(
                    setCredentials({
                        user: mappedUser,
                        accessToken: tokens.accessToken || '',
                        refreshToken: tokens.refreshToken || '',
                    })
                );

                const userRole = mapBackendRoleToFrontend(userData.role);
                try {
                    const franchises = await dispatch(fetchFranchises()).unwrap();
                    dispatch(setFranchiseList(franchises));
                } catch (franchiseError) {
                    console.warn('Failed to fetch franchises:', franchiseError);
                }
            } catch (error: unknown) {
                if (
                    error &&
                    typeof error === 'object' &&
                    'message' in error &&
                    (error as { message?: string }).message === REFRESH_TOKEN_EXPIRED_ERROR
                ) {
                    setIsLoadingUser(false);
                    setIsChecking(false);
                    return;
                }
                router.replace(AUTH_ROUTES.LOGIN);
            } finally {
                setIsLoadingUser(false);
            }
        },
        [dispatch, router]
    );

    useEffect(() => {
        const checkAuthAndLoadUser = async () => {
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

            if ((isAuthenticated || isLogin) && !user && tokens.accessToken) {
                await fetchUserData(tokens);
            }

            setIsChecking(false);
        };

        checkAuthAndLoadUser();
    }, [isAuthenticated, isLogin, user, router, fetchUserData]);

    if (isChecking || isLoadingUser) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#f5f6f8] dark:bg-[#101622]">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-[#0d59f2]" />
                    <p className="mt-4 text-[#49659c] dark:text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated && !isLogin) {
        return null;
    }

    return <DashboardLayout>{children}</DashboardLayout>;
}
