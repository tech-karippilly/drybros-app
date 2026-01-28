"use client";

import React, { useEffect, useState } from 'react';
import {
    Truck,
    DollarSign,
    Users,
    Clock,
    AlertTriangle,
    TrendingUp,
    MapPin,
    BarChart3,
    CheckCircle,
    XCircle,
} from 'lucide-react';
import {
    ManagerDashboardData,
    getManagerDashboardData,
} from '@/lib/features/dashboard/dashboardApi';
import { useAppSelector } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import { WelcomeMessage } from './WelcomeMessage';
import { AttendanceCard } from './AttendanceCard';

function MetricCard({ label, value, icon, trend }: { label: string; value: string | number; icon: React.ReactNode; trend?: number }) {
    return (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-3">
                <div className="text-[#0d59f2]">{icon}</div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#49659c] dark:text-gray-400">
                    {label}
                </p>
            </div>
            <div className="flex items-end justify-between">
                <h3 className="text-3xl font-bold text-[#0d121c] dark:text-white">{value}</h3>
                {trend !== undefined && (
                    <span className={cn(
                        'text-xs font-bold px-2 py-1 rounded',
                        trend > 0 ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-red-600 bg-red-50 dark:bg-red-900/20'
                    )}>
                        {trend > 0 ? '+' : ''}{trend}%
                    </span>
                )}
            </div>
        </div>
    );
}

export function ManagerDashboard() {
    const { user, refreshTrigger } = useAppSelector((state) => state.auth);
    const [data, setData] = useState<ManagerDashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                setLoading(true);
                const dashboardData = await getManagerDashboardData(user?.franchise_id);
                if (!cancelled) {
                    setData(dashboardData);
                }
            } catch (error) {
                console.error('Failed to load manager dashboard:', error);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [user?.franchise_id, refreshTrigger]);

    if (loading || !data) {
        return (
            <div className="animate-in fade-in duration-500">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white">Manager Dashboard</h2>
                    <p className="text-[#49659c] dark:text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

    return (
        <div className="animate-in fade-in duration-500 space-y-8">
            {/* Welcome Message and Attendance Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <WelcomeMessage />
                </div>
                <div className="lg:col-span-1">
                    <AttendanceCard />
                </div>
            </div>

            {/* Key Metrics */}
            <div>
                <h3 className="text-lg font-semibold text-[#0d121c] dark:text-white mb-4">Key Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <MetricCard
                        label="Trips Today"
                        value={data.metrics.tripsToday}
                        icon={<Truck size={20} />}
                    />
                    <MetricCard
                        label="Revenue Today"
                        value={formatCurrency(data.metrics.revenueToday)}
                        icon={<DollarSign size={20} />}
                    />
                    <MetricCard
                        label="Active Drivers on Duty"
                        value={data.metrics.activeDriversOnDuty}
                        icon={<Users size={20} />}
                    />
                    <MetricCard
                        label="Pending Trip Assignments"
                        value={data.metrics.pendingTripAssignments}
                        icon={<Clock size={20} />}
                    />
                    <MetricCard
                        label="Complaints Assigned"
                        value={data.metrics.complaintsAssigned}
                        icon={<AlertTriangle size={20} />}
                    />
                </div>
            </div>

            {/* Trip Management */}
            <div>
                <h3 className="text-lg font-semibold text-[#0d121c] dark:text-white mb-4">Trip Management</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <Truck size={20} className="text-[#0d59f2]" />
                            <p className="text-sm font-semibold text-[#49659c] dark:text-gray-400">Ongoing Trips</p>
                        </div>
                        <p className="text-2xl font-bold dark:text-white">{data.ongoingTrips.length}</p>
                        {data.ongoingTrips.length > 0 && (
                            <p className="text-xs text-[#49659c] dark:text-gray-400 mt-2">
                                {data.ongoingTrips.slice(0, 3).map((t: any) => t.id?.slice(0, 8)).join(', ')}
                            </p>
                        )}
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <Clock size={20} className="text-amber-600" />
                            <p className="text-sm font-semibold text-[#49659c] dark:text-gray-400">Waiting for Driver</p>
                        </div>
                        <p className="text-2xl font-bold dark:text-white">{data.tripsWaitingForDriver.length}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <AlertTriangle size={20} className="text-red-600" />
                            <p className="text-sm font-semibold text-[#49659c] dark:text-gray-400">Delayed / Escalated</p>
                        </div>
                        <p className="text-2xl font-bold dark:text-white">{data.delayedTrips.length}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <DollarSign size={20} className="text-green-600" />
                            <p className="text-sm font-semibold text-[#49659c] dark:text-gray-400">High-Value Trips</p>
                        </div>
                        <p className="text-2xl font-bold dark:text-white">{data.highValueTrips.length}</p>
                    </div>
                </div>
            </div>

            {/* Driver Performance */}
            <div>
                <h3 className="text-lg font-semibold text-[#0d121c] dark:text-white mb-4">Driver Performance</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#49659c] dark:text-gray-400 mb-2">
                            Driver Attendance
                        </p>
                        <p className="text-2xl font-bold dark:text-white">{data.driverPerformance.attendance}%</p>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#49659c] dark:text-gray-400 mb-2">
                            Avg Rating
                        </p>
                        <p className="text-2xl font-bold dark:text-white">{data.driverPerformance.avgRating.toFixed(1)}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#49659c] dark:text-gray-400 mb-2">
                            Trips per Driver
                        </p>
                        <p className="text-2xl font-bold dark:text-white">{data.driverPerformance.tripsPerDriver}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#49659c] dark:text-gray-400 mb-2">
                            Penalties Today
                        </p>
                        <p className="text-2xl font-bold dark:text-white">{data.driverPerformance.penaltiesToday}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#49659c] dark:text-gray-400 mb-2">
                            Idle Drivers
                        </p>
                        <p className="text-2xl font-bold dark:text-white">{data.driverPerformance.idleDrivers}</p>
                    </div>
                </div>
            </div>

            {/* Branch / Area Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <BarChart3 size={24} className="text-[#0d59f2]" />
                        <div>
                            <h4 className="text-lg font-bold dark:text-white">Revenue by Area</h4>
                            <p className="text-sm text-[#49659c] dark:text-gray-400">Branch performance</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {data.branchInsights.revenueByArea.map((item, idx) => (
                            <div key={idx}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium dark:text-white">{item.area}</span>
                                    <span className="text-sm font-semibold dark:text-white">{formatCurrency(item.revenue)}</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div
                                        className="bg-[#0d59f2] h-2 rounded-full"
                                        style={{
                                            width: `${(item.revenue / Math.max(...data.branchInsights.revenueByArea.map(a => a.revenue))) * 100}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <BarChart3 size={24} className="text-[#0d59f2]" />
                        <div>
                            <h4 className="text-lg font-bold dark:text-white">Cancellation Reasons</h4>
                            <p className="text-sm text-[#49659c] dark:text-gray-400">Top reasons</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {data.branchInsights.cancellationReasons.map((item, idx) => (
                            <div
                                key={idx}
                                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                            >
                                <span className="text-sm font-medium dark:text-white">{item.reason}</span>
                                <span className="text-sm font-semibold dark:text-white">{item.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Alerts */}
            {data.alerts.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold text-[#0d121c] dark:text-white mb-4 flex items-center gap-2">
                        <AlertTriangle size={20} />
                        Alerts
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {data.alerts.map((alert) => (
                            <div
                                key={alert.id}
                                className={cn(
                                    'p-4 rounded-lg border',
                                    alert.severity === 'high'
                                        ? 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                                        : alert.severity === 'medium'
                                        ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                                        : 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                                )}
                            >
                                <div className="flex items-start gap-3">
                                    <AlertTriangle size={20} className="mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-sm mb-1">{alert.title}</h4>
                                        <p className="text-xs opacity-80">{alert.description}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
