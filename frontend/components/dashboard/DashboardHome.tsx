"use client";

import React from 'react';
import { useAppSelector } from '@/lib/hooks';
import { USER_ROLES } from '@/lib/constants/roles';
import { AdminDashboard } from './AdminDashboard';
import { ManagerDashboard } from './ManagerDashboard';
import { StaffDashboard } from './StaffDashboard';
import { DriverDashboardEnhanced } from './DriverDashboardEnhanced';

export function DashboardHome() {
    const { user } = useAppSelector((state) => state.auth);
    const role = user?.role || USER_ROLES.ADMIN;

    // Render role-specific dashboards
    switch (role) {
        case USER_ROLES.ADMIN:
            return <AdminDashboard />;
        case USER_ROLES.MANAGER:
            return <ManagerDashboard />;
        case USER_ROLES.STAFF:
            return <StaffDashboard />;
        case USER_ROLES.DRIVER:
            return <DriverDashboardEnhanced />;
        default:
            return <AdminDashboard />;
    }
}
