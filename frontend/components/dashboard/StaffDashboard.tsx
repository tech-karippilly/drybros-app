"use client";

import React from 'react';
import { PlaceholderScreen } from './PlaceholderScreen';
import { SettingsScreen } from './SettingsScreen';
import { PenaltiesManager } from './penalties/PenaltiesManager';
import { DriversManager } from './drivers/DriversManager';
import { TripManager } from './trips/TripManager';
import { useAppSelector } from '@/lib/hooks';
import { DashboardLayout } from './DashboardLayout';
import {
    Table,
    LayoutGrid,
    ClipboardList,
    Store,
    Users,
    Truck,
    BarChart3,
    ShieldAlert,
    Map,
    MessageSquare,
    CalendarCheck,
    Bell,
    Settings,
    UserCircle
} from 'lucide-react';

export function StaffDashboard() {
    const { activeTab } = useAppSelector((state) => state.auth);

    const renderContent = () => {
        switch (activeTab) {
            case 'home':
                return (
                    <div className="animate-in fade-in duration-500">
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white">Staff Management Portal</h2>
                            <p className="text-[#49659c] dark:text-gray-400">Manage daily operations, staff schedules, and franchise oversight.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            {[
                                { label: 'Active Staff', value: '24', icon: LayoutGrid, color: 'text-blue-600' },
                                { label: 'Pending Tasks', value: '18', icon: ClipboardList, color: 'text-amber-600' },
                                { label: 'Daily Attendance', value: '92%', icon: Table, color: 'text-green-600' },
                            ].map((stat, i) => (
                                <div key={i} className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
                                    <div className={`p-3 rounded-lg bg-gray-50 dark:bg-gray-800 ${stat.color}`}>
                                        <stat.icon size={24} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-[#49659c] uppercase tracking-wider">{stat.label}</p>
                                        <p className="text-2xl font-bold dark:text-white">{stat.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 min-h-[400px] flex items-center justify-center border-dashed">
                            <div className="text-center">
                                <div className="p-4 rounded-full bg-gray-50 dark:bg-gray-800 inline-block mb-4">
                                    <ClipboardList size={48} className="text-[#49659c]" />
                                </div>
                                <h3 className="text-lg font-bold dark:text-white">Staff Dashboard Content</h3>
                                <p className="text-[#49659c] max-w-sm mt-2">Operational tools and staff management features will be displayed here.</p>
                            </div>
                        </div>
                    </div>
                );
            case 'franchises':
                return <PlaceholderScreen icon={Store} title="Franchise List" description="View and manage franchise operations assigned to your staff profile." />;
            case 'staff':
                return <PlaceholderScreen icon={Users} title="Staff Directory" description="Access team members, schedules, and internal communication logs." />;
            case 'drivers':
                return <DriversManager />;
            case 'reports':
                return <PlaceholderScreen icon={BarChart3} title="Staff Reports" description="Generate performance reports and operational logs for your shifts." />;
            case 'payroll':
                return <PenaltiesManager />;
            case 'trips':
            case 'trip-types':
            case 'trip-booking':
            case 'unassigned-trips':
                return <TripManager />;
            case 'complaints':
                return <PlaceholderScreen icon={MessageSquare} title="Complaint Resolution" description="Address and document customer feedback and complaints." />;
            case 'attendance':
                return <PlaceholderScreen icon={CalendarCheck} title="Daily Attendance" description="Record your daily attendance and view historical logs." />;
            case 'customer':
                return <PlaceholderScreen icon={UserCircle} title="Customer Database" description="Manage customer profiles, order history, and relationship metrics." />;
            case 'notifications':
                return <PlaceholderScreen icon={Bell} title="Staff Notifications" description="View important updates and task assignments for your role." />;
            case 'settings':
                return <SettingsScreen />;
            default:
                return null;
        }
    };

    return (
        <DashboardLayout>
            {renderContent()}
        </DashboardLayout>
    );
}
