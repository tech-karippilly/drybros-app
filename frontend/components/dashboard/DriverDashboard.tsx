"use client";

import React from 'react';
import { PlaceholderScreen } from './PlaceholderScreen';
import { useAppSelector } from '@/lib/hooks';
import { DashboardLayout } from './DashboardLayout';
import {
    Truck,
    Navigation,
    Star,
    Store,
    Users,
    BarChart3,
    ShieldAlert,
    Map,
    MessageSquare,
    CalendarCheck,
    Bell,
    Settings
} from 'lucide-react';

export function DriverDashboard() {
    const { activeTab } = useAppSelector((state) => state.auth);

    const renderContent = () => {
        switch (activeTab) {
            case 'home':
                return (
                    <div className="animate-in fade-in duration-500">
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white">Driver Portal</h2>
                            <p className="text-[#49659c] dark:text-gray-400">Track your trips, earnings, and delivery schedules.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            {[
                                { label: 'Today\'s Trips', value: '8', icon: Truck, color: 'text-[#0d59f2]' },
                                { label: 'Completed', value: '142', icon: Navigation, color: 'text-green-600' },
                                { label: 'Rating', value: '4.9', icon: Star, color: 'text-amber-500' },
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
                                    <Navigation size={48} className="text-[#49659c]" />
                                </div>
                                <h3 className="text-lg font-bold dark:text-white">Driver Dashboard Content</h3>
                                <p className="text-[#49659c] max-w-sm mt-2">Trip logs, live navigation, and route optimization tools will be available here.</p>
                            </div>
                        </div>
                    </div>
                );
            case 'franchises':
                return <PlaceholderScreen icon={Store} title="Franchise Access" description="Identify the franchises you are currently serving and their pickup locations." />;
            case 'staff':
                return <PlaceholderScreen icon={Users} title="Dispatcher Contacts" description="Get in touch with the staff and dispatchers for your current assignments." />;
            case 'drivers':
                return <PlaceholderScreen icon={Truck} title="My Fleet Status" description="Check the status of your assigned vehicle and maintenance reports." />;
            case 'reports':
                return <PlaceholderScreen icon={BarChart3} title="Earnings Report" description="Weekly and monthly breakdown of your delivery earnings and bonuses." />;
            case 'payroll':
                return <PlaceholderScreen icon={ShieldAlert} title="Payout Status" description="Track your payout history, bank transfers, and pending payments." />;
            case 'trips':
                return <PlaceholderScreen icon={Map} title="Trip History" description="A complete log of all your past deliveries and route performance." />;
            case 'complaints':
                return <PlaceholderScreen icon={MessageSquare} title="Service Feedback" description="View customer ratings and feedback regarding your delivery service." />;
            case 'attendance':
                return <PlaceholderScreen icon={CalendarCheck} title="Service Hours" description="Log your active hours and view your attendance records." />;
            case 'notifications':
                return <PlaceholderScreen icon={Bell} title="Duty Alerts" description="Receive real-time notifications for new trip assignments and updates." />;
            case 'settings':
                return <PlaceholderScreen icon={Settings} title="Driver Settings" description="Manage your profile, vehicle preferences, and app configuration." />;
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
