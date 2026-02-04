"use client";

import React, { useEffect, useState } from 'react';
import {
    ClipboardList,
    MessageSquare,
    AlertTriangle,
    Clock,
    Truck,
    Phone,
    UserCheck,
    FileText,
    CheckCircle,
    TrendingUp,
    Timer,
} from 'lucide-react';
import {
    StaffDashboardData,
    getStaffDashboardData,
} from '@/lib/features/dashboard/dashboardApi';
import { AttendanceClockUI } from './AttendanceClockUI';
import { RecentActivities } from './RecentActivities';
import { cn } from '@/lib/utils';
import { useAppSelector } from '@/lib/hooks';
import { WelcomeMessage } from './WelcomeMessage';
import { AttendanceCard } from './AttendanceCard';

function StatCard({ label, value, icon, color = 'text-[#0d59f2]' }: { label: string; value: string | number; icon: React.ReactNode; color?: string }) {
    return (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-3">
                <div className={color}>{icon}</div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#49659c] dark:text-gray-400">
                    {label}
                </p>
            </div>
            <h3 className="text-3xl font-bold text-[#0d121c] dark:text-white">{value}</h3>
        </div>
    );
}

export function StaffDashboard() {
    const { refreshTrigger } = useAppSelector((state) => state.auth);
    const [data, setData] = useState<StaffDashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                setLoading(true);
                const dashboardData = await getStaffDashboardData();
                if (!cancelled) {
                    setData(dashboardData);
                }
            } catch (error) {
                console.error('Failed to load staff dashboard:', error);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [refreshTrigger]);

    if (loading || !data) {
        return (
            <div className="animate-in fade-in duration-500">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white">Staff Dashboard</h2>
                    <p className="text-[#49659c] dark:text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-500 space-y-8">
            {/* Welcome Message and Attendance Clock */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <WelcomeMessage />
                </div>
                <div className="lg:col-span-1">
                    <AttendanceClockUI variant="full" />
                </div>
            </div>

            {/* Task Overview */}
            <div>
                <h3 className="text-lg font-semibold text-[#0d121c] dark:text-white mb-4">Task Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        label="Assigned Tasks"
                        value={data.tasks.assigned}
                        icon={<ClipboardList size={20} />}
                    />
                    <StatCard
                        label="Open Complaints"
                        value={data.tasks.openComplaints}
                        icon={<MessageSquare size={20} />}
                        color="text-amber-600"
                    />
                    <StatCard
                        label="Escalated Issues"
                        value={data.tasks.escalatedIssues}
                        icon={<AlertTriangle size={20} />}
                        color="text-red-600"
                    />
                    <StatCard
                        label="Follow-ups Pending"
                        value={data.tasks.followUpsPending}
                        icon={<Clock size={20} />}
                        color="text-blue-600"
                    />
                </div>
            </div>

            {/* Trip Support */}
            <div>
                <h3 className="text-lg font-semibold text-[#0d121c] dark:text-white mb-4">Trip Support</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        label="Manual Intervention"
                        value={data.tripSupport.manualIntervention}
                        icon={<Truck size={20} />}
                        color="text-amber-600"
                    />
                    <StatCard
                        label="Driver Not Reachable"
                        value={data.tripSupport.driverNotReachable}
                        icon={<Phone size={20} />}
                        color="text-red-600"
                    />
                    <StatCard
                        label="Customer Help Requests"
                        value={data.tripSupport.customerHelpRequests}
                        icon={<MessageSquare size={20} />}
                        color="text-blue-600"
                    />
                    <StatCard
                        label="Trip Modification Requests"
                        value={data.tripSupport.tripModificationRequests}
                        icon={<FileText size={20} />}
                        color="text-purple-600"
                    />
                </div>
            </div>

            {/* Customer Support */}
            <div>
                <h3 className="text-lg font-semibold text-[#0d121c] dark:text-white mb-4">Customer Support</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        label="New Complaints"
                        value={data.customerSupport.newComplaints}
                        icon={<MessageSquare size={20} />}
                        color="text-red-600"
                    />
                    <StatCard
                        label="In-Progress Complaints"
                        value={data.customerSupport.inProgressComplaints}
                        icon={<Clock size={20} />}
                        color="text-amber-600"
                    />
                    <StatCard
                        label="Resolved Today"
                        value={data.customerSupport.resolvedToday}
                        icon={<CheckCircle size={20} />}
                        color="text-green-600"
                    />
                    <StatCard
                        label="SLA Breach Warnings"
                        value={data.customerSupport.slaBreachWarnings}
                        icon={<AlertTriangle size={20} />}
                        color="text-red-600"
                    />
                </div>
            </div>

            {/* Driver Support */}
            <div>
                <h3 className="text-lg font-semibold text-[#0d121c] dark:text-white mb-4">Driver Support</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <StatCard
                        label="Onboarding Pending"
                        value={data.driverSupport.onboardingPending}
                        icon={<UserCheck size={20} />}
                        color="text-blue-600"
                    />
                    <StatCard
                        label="Document Verification Pending"
                        value={data.driverSupport.documentVerificationPending}
                        icon={<FileText size={20} />}
                        color="text-amber-600"
                    />
                    <StatCard
                        label="Driver Queries / Tickets"
                        value={data.driverSupport.queries}
                        icon={<MessageSquare size={20} />}
                        color="text-purple-600"
                    />
                </div>
            </div>

            {/* Productivity */}
            <div>
                <h3 className="text-lg font-semibold text-[#0d121c] dark:text-white mb-4">Productivity</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <CheckCircle size={20} className="text-green-600" />
                            <p className="text-xs font-semibold uppercase tracking-wider text-[#49659c] dark:text-gray-400">
                                Tasks Completed Today
                            </p>
                        </div>
                        <div className="flex items-end gap-2">
                            <h3 className="text-3xl font-bold text-[#0d121c] dark:text-white">{data.productivity.tasksCompletedToday}</h3>
                            <TrendingUp size={16} className="text-green-600 mb-1" />
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <Timer size={20} className="text-[#0d59f2]" />
                            <p className="text-xs font-semibold uppercase tracking-wider text-[#49659c] dark:text-gray-400">
                                Avg Resolution Time
                            </p>
                        </div>
                        <h3 className="text-3xl font-bold text-[#0d121c] dark:text-white">{data.productivity.avgResolutionTime}h</h3>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <ClipboardList size={20} className="text-amber-600" />
                            <p className="text-xs font-semibold uppercase tracking-wider text-[#49659c] dark:text-gray-400">
                                Pending Backlog
                            </p>
                        </div>
                        <h3 className="text-3xl font-bold text-[#0d121c] dark:text-white">{data.productivity.pendingBacklog}</h3>
                    </div>
                </div>
            </div>
            <div className="mt-8">
                <RecentActivities />
            </div>
        </div>
    );
}
