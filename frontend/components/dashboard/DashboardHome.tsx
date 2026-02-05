"use client";

import React from 'react';
import Link from 'next/link';
import { useAppSelector } from '@/lib/hooks';
import { USER_ROLES } from '@/lib/constants/roles';
import { AdminDashboard } from './AdminDashboard';
import { ManagerDashboard } from './ManagerDashboard';
import { StaffDashboard } from './StaffDashboard';
import { DriverDashboardEnhanced } from './DriverDashboardEnhanced';
import { DASHBOARD_ROUTES } from '@/lib/constants/routes';
import { Building2, Plus } from 'lucide-react';

export function DashboardHome() {
    const { user, franchiseList } = useAppSelector((state) => state.auth);
    const role = user?.role || USER_ROLES.ADMIN;

    // Check if franchises exist and filter out dummy data
    const hasDummyData = franchiseList.some(f => f._id.startsWith('fran_'));
    const hasNoFranchises = franchiseList.length === 0 || hasDummyData;

    // Show "Create Franchise" message for Admin and Manager when no franchises exist
    if (hasNoFranchises && (role === USER_ROLES.ADMIN || role === USER_ROLES.MANAGER)) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center max-w-md mx-auto p-8">
                    <div className="mb-6 flex justify-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#137fec]/10">
                            <Building2 className="h-10 w-10 text-[#137fec]" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">
                        No Franchises Yet
                    </h2>
                    <p className="text-slate-500 dark:text-[#92adc9] mb-8">
                        Get started by creating your first franchise. You'll be able to manage staff, drivers, and operations once your franchise is set up.
                    </p>
                    <Link
                        href={DASHBOARD_ROUTES.FRANCHISES_ONBOARDING}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#137fec] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#137fec]/20 transition-transform hover:scale-105 active:scale-95"
                    >
                        <Plus className="h-5 w-5" />
                        Create Your First Franchise
                    </Link>
                </div>
            </div>
        );
    }

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
