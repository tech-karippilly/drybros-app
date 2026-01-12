"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/lib/hooks';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { StaffDashboard } from '@/components/dashboard/StaffDashboard';
import { DriverDashboard } from '@/components/dashboard/DriverDashboard';
import { AUTH_ROUTES } from '@/lib/constants/auth';

export default function DashboardPage() {
    const { user, isAuthenticated, isLogin } = useAppSelector((state) => state.auth);
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated && !isLogin) {
            router.push(AUTH_ROUTES.LOGIN);
        }
    }, [isAuthenticated, isLogin, router]);

    if (!isAuthenticated && !isLogin) {
        return null; // Or a loader
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
