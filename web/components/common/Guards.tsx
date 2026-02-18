'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppSelector } from '@/lib/hooks';
import { selectIsAuthenticated, selectCurrentUser } from '@/lib/features/auth/authSlice';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * AuthGuard - Protects routes that require authentication
 * Redirects to login if user is not authenticated
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      // Store the intended destination
      sessionStorage.setItem('redirectUrl', pathname);
      router.push('/login');
    }
  }, [isAuthenticated, router, pathname]);

  if (!isAuthenticated) {
    return null; // or a loading spinner
  }

  return <>{children}</>;
};

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
  fallbackUrl?: string;
}

/**
 * RoleGuard - Protects routes based on user roles
 * Redirects to unauthorized page if user doesn't have required role
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  fallbackUrl = '/unauthorized',
}) => {
  const router = useRouter();
  const user = useAppSelector(selectCurrentUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user && !allowedRoles.includes(user.role)) {
      router.push(fallbackUrl);
    }
  }, [isAuthenticated, user, allowedRoles, router, fallbackUrl]);

  if (!isAuthenticated || !user || !allowedRoles.includes(user.role)) {
    return null; // or a loading spinner
  }

  return <>{children}</>;
};

/**
 * Combined guard that checks both authentication and role
 */
export const ProtectedRoute: React.FC<RoleGuardProps> = ({ children, allowedRoles, fallbackUrl }) => {
  return (
    <AuthGuard>
      <RoleGuard allowedRoles={allowedRoles} fallbackUrl={fallbackUrl}>
        {children}
      </RoleGuard>
    </AuthGuard>
  );
};
