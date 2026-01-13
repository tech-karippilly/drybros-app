"use client";

import React from 'react';
import { KpiStatsGrid } from './KpiStats';
import { RecentActivities } from './RecentActivities';
import { PlaceholderScreen } from './PlaceholderScreen';
import { FranchiseManager } from './franchise/FranchiseManager';
import { useAppSelector } from '@/lib/hooks';
import { DashboardLayout } from './DashboardLayout';
import {
    Wallet,
    ArrowRight,
    Users,
    Truck,
    BarChart3,
    Map,
    MessageSquare,
    CalendarCheck,
    Bell,
    Settings,
    UserCircle,
    ShieldAlert
} from 'lucide-react';

export function AdminDashboard() {
    const { activeTab } = useAppSelector((state) => state.auth);

    const renderContent = () => {
        switch (activeTab) {
            case 'home':
                return (
                    <div className="animate-in fade-in duration-500">
                        {/* Header Section */}
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white">Dashboard Overview</h2>
                            <p className="text-[#49659c] dark:text-gray-400">Welcome back. Here&apos;s what&apos;s happening today.</p>
                        </div>

                        {/* KPI Stats Row */}
                        <KpiStatsGrid />

                        {/* Main Grid Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left: Charts */}
                            <div className="lg:col-span-2 flex flex-col gap-8">
                                {/* Trip Trends Chart */}
                                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h4 className="text-lg font-bold dark:text-white">Trip Trends</h4>
                                            <p className="text-sm text-[#49659c] dark:text-gray-400">Weekly performance metrics</p>
                                        </div>
                                        <select className="text-xs font-semibold border-gray-200 dark:border-gray-800 rounded bg-transparent dark:text-white px-2 py-1 outline-none">
                                            <option>Last 7 Days</option>
                                            <option>Last 30 Days</option>
                                        </select>
                                    </div>
                                    <div className="h-[220px] w-full mt-4">
                                        <svg fill="none" height="100%" preserveAspectRatio="none" viewBox="0 0 500 150" width="100%" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M0 120C20 120 40 40 60 40C80 40 100 80 120 80C140 80 160 30 180 30C200 30 220 100 240 100C260 100 280 50 300 50C320 50 340 110 360 110C380 110 400 130 420 130C440 130 460 20 480 20C500 20 500 20 500 20V150H0V120Z" fill="url(#chartGradient)"></path>
                                            <path d="M0 120C20 120 40 40 60 40C80 40 100 80 120 80C140 80 160 30 180 30C200 30 220 100 240 100C260 100 280 50 300 50C320 50 340 110 360 110C380 110 400 130 420 130C440 130 460 20 480 20" stroke="#0d59f2" strokeLinecap="round" strokeWidth="3"></path>
                                            <defs>
                                                <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                                                    <stop offset="0%" stopColor="#0d59f2" stopOpacity="0.1"></stop>
                                                    <stop offset="100%" stopColor="#0d59f2" stopOpacity="0"></stop>
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                        <div className="flex justify-between mt-4">
                                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                                <span key={day} className="text-[11px] font-bold text-[#49659c] uppercase">{day}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Revenue Over Time Chart */}
                                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h4 className="text-lg font-bold dark:text-white">Revenue Over Time</h4>
                                            <p className="text-sm text-[#49659c] dark:text-gray-400">Monthly financial summary</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold dark:text-white">$125,000</p>
                                            <p className="text-[11px] text-[#e73908] font-bold">-2.1% from last month</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-6 items-end gap-4 h-[180px] px-2">
                                        {['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN'].map((m, i) => {
                                            const heights = ['h-[40%]', 'h-[60%]', 'h-[85%]', 'h-[55%]', 'h-[70%]', 'h-[90%]'];
                                            const isActive = m === 'MAR';
                                            return (
                                                <div key={m} className={`relative group flex flex-col items-center w-full`}>
                                                    <div className={`w-full ${heights[i]} rounded-t-lg transition-all duration-300 cursor-pointer ${isActive ? 'bg-[#0d59f2] shadow-lg shadow-blue-500/20' : 'bg-[#0d59f2]/10 hover:bg-[#0d59f2]/30'}`} />
                                                    <p className="text-center mt-3 text-[11px] font-bold text-[#49659c]">{m}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="flex flex-col gap-8">
                                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">
                                    <div className="p-6 flex-1">
                                        <div className="flex items-center gap-2 text-[#0d59f2] mb-4">
                                            <Wallet size={16} />
                                            <p className="text-xs font-bold uppercase tracking-widest text-[#0d59f2]">Financial Overview</p>
                                        </div>
                                        <h4 className="text-xl font-bold mb-2 dark:text-white">Monthly Payout Summary</h4>
                                        <p className="text-sm text-[#49659c] dark:text-gray-400 mb-6">Total pending and processed payouts for March 2024.</p>

                                        <div className="space-y-4 mb-6">
                                            <div className="flex justify-between items-center py-3 border-b border-gray-50 dark:border-gray-800">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Processed</span>
                                                <span className="text-sm font-bold text-green-600">$42,500.00</span>
                                            </div>
                                            <div className="flex justify-between items-center py-3 border-b border-gray-50 dark:border-gray-800">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Pending</span>
                                                <span className="text-sm font-bold text-amber-500">$12,480.00</span>
                                            </div>
                                            <div className="flex justify-between items-center py-3">
                                                <span className="text-sm font-bold dark:text-white">Total Disbursed</span>
                                                <span className="text-sm font-bold dark:text-white">$54,980.00</span>
                                            </div>
                                        </div>

                                        <button className="w-full py-2.5 bg-[#0d59f2] text-white rounded-lg text-sm font-bold hover:bg-[#0d59f2]/90 transition-all flex items-center justify-center gap-2 group shadow-lg shadow-blue-500/20 active:scale-[0.98]">
                                            <span>View Detailed Report</span>
                                            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                                        </button>
                                    </div>
                                    <div className="h-24 bg-[#0d59f2]/5 dark:bg-[#0d59f2]/10 relative overflow-hidden">
                                        <div
                                            className="absolute inset-0 opacity-20"
                                            style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #0d59f2 1px, transparent 0)', backgroundSize: '20px 20px' }}
                                        ></div>
                                    </div>
                                </div>
                                <RecentActivities />
                            </div>
                        </div>
                    </div>
                );
            case 'franchises':
                return <FranchiseManager />;
            case 'staff':
                return <PlaceholderScreen icon={Users} title="Staff Management" description="Oversee your workforce, assign roles, and track performance across all departments and locations." />;
            case 'drivers':
                return <PlaceholderScreen icon={Truck} title="Fleet & Drivers" description="Real-time monitoring of your delivery fleet, driver assignments, and vehicle maintenance schedules." />;
            case 'reports':
                return <PlaceholderScreen icon={BarChart3} title="Business Analytics" description="Generate detailed reports on revenue, operational efficiency, and customer satisfaction metrics." />;
            case 'payroll':
                return <PlaceholderScreen icon={ShieldAlert} title="Penalties & Finance" description="Automated payroll processing, penalty management, and financial disbursement tracking." />;
            case 'trips':
                return <PlaceholderScreen icon={Map} title="Trip Logistics" description="Optimize delivery routes, monitor live trips, and manage dispatch operations in real-time." />;
            case 'complaints':
                return <PlaceholderScreen icon={MessageSquare} title="Customer Support" description="Review resolve customer complaints, feedback, and service quality reports." />;
            case 'attendance':
                return <PlaceholderScreen icon={CalendarCheck} title="Workforce Attendance" description="Track daily log-ins, leave requests, and shift schedules for all employees." />;
            case 'customer':
                return <PlaceholderScreen icon={UserCircle} title="Customer Database" description="Comprehensive management of the global user base and franchise-specific customers." />;
            case 'notifications':
                return <PlaceholderScreen icon={Bell} title="System Notifications" description="Stay updated with real-time alerts regarding system status, order updates, and administrative tasks." />;
            case 'settings':
                return <PlaceholderScreen icon={Settings} title="Account Settings" description="Customize your portal experience, update security preferences, and manage global system configurations." />;
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
