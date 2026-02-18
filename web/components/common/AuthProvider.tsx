'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/lib/hooks';
import { selectIsAuthenticated, selectCurrentUser } from '@/lib/features/auth/authSlice';
import { authService } from '@/services';
import { setCredentials, logout } from '@/lib/features/auth/authSlice';
import { getDashboardRoute } from '@/lib/constants/routes';

/**
 * Auth Provider - Validates authentication on app load
 * Fetches user data if tokens exist
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectCurrentUser);

  useEffect(() => {
    const validateAuth = async () => {
      // If we have tokens but no user data, fetch user
      if (isAuthenticated && !user) {
        try {
          const response = await authService.getCurrentUser();
          const userData = response.data.data || response.data;
          
          // Update Redux with user data
          const accessToken = localStorage.getItem('accessToken');
          const refreshToken = localStorage.getItem('refreshToken');
          
          if (accessToken && refreshToken) {
            dispatch(setCredentials({
              user: userData,
              accessToken,
              refreshToken,
            }));
          }
        } catch (error) {
          console.error('Failed to validate auth:', error);
          // If validation fails, logout and redirect to login
          dispatch(logout());
          router.push('/login');
        }
      }
    };

    validateAuth();
  }, [isAuthenticated, user, dispatch, router]);

  return <>{children}</>;
};

/**
 * Role-based redirect on app load
 */
export const useAuthRedirect = () => {
  const router = useRouter();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectCurrentUser);

  useEffect(() => {
    if (isAuthenticated && user) {
      const currentPath = window.location.pathname;
      
      // If user is on root or login page, redirect to dashboard
      if (currentPath === '/' || currentPath.startsWith('/login')) {
        const dashboardUrl = getDashboardRoute(user.role);
        router.push(dashboardUrl);
      }
    }
  }, [isAuthenticated, user, router]);
};
