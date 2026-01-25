"use client";

import React, { useEffect, useState } from 'react';
import {
    Truck,
    Navigation,
    Star,
    DollarSign,
    Clock,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Shield,
    Bell,
    TrendingUp,
    Calendar,
} from 'lucide-react';
import {
    DriverDashboardData,
    getDriverDashboardData,
} from '@/lib/features/dashboard/dashboardApi';
import { useAppSelector } from '@/lib/hooks';
import { cn } from '@/lib/utils';

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

export function DriverDashboardEnhanced() {
    const { user } = useAppSelector((state) => state.auth);
    const [data, setData] = useState<DriverDashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                setLoading(true);
                // In a real app, driverId would come from user data
                const driverId = user?._id || 'driver-id';
                const dashboardData = await getDriverDashboardData(driverId);
                if (!cancelled) {
                    setData(dashboardData);
                }
            } catch (error) {
                console.error('Failed to load driver dashboard:', error);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [user?._id]);

    if (loading || !data) {
        return (
            <div className="animate-in fade-in duration-500">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white">Driver Portal</h2>
                    <p className="text-[#49659c] dark:text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

    return (
        <div className="animate-in fade-in duration-500 space-y-8">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white">Driver Portal</h2>
                <p className="text-[#49659c] dark:text-gray-400">Trips, earnings, and compliance</p>
            </div>

            {/* Trip Info */}
            <div>
                <h3 className="text-lg font-semibold text-[#0d121c] dark:text-white mb-4">Trip Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {data.tripInfo.currentTrip ? (
                        <div className="bg-gradient-to-br from-[#0d59f2] to-[#0d59f2]/80 p-6 rounded-xl text-white shadow-lg">
                            <div className="flex items-center gap-3 mb-3">
                                <Navigation size={20} />
                                <p className="text-xs font-semibold uppercase tracking-wider opacity-90">Current Trip</p>
                            </div>
                            <p className="text-lg font-bold">Trip #{data.tripInfo.currentTrip.id?.slice(0, 8)}</p>
                            <p className="text-sm opacity-90 mt-2">In Progress</p>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                                <Truck size={20} className="text-[#49659c]" />
                                <p className="text-xs font-semibold uppercase tracking-wider text-[#49659c] dark:text-gray-400">
                                    Current Trip
                                </p>
                            </div>
                            <p className="text-lg font-bold dark:text-white">No Active Trip</p>
                        </div>
                    )}
                    <StatCard
                        label="Upcoming Trips"
                        value={data.tripInfo.upcomingTrips.length}
                        icon={<Clock size={20} />}
                        color="text-blue-600"
                    />
                    <StatCard
                        label="Completed Today"
                        value={data.tripInfo.completedToday}
                        icon={<CheckCircle size={20} />}
                        color="text-green-600"
                    />
                    <StatCard
                        label="Cancelled Today"
                        value={data.tripInfo.cancelledToday}
                        icon={<XCircle size={20} />}
                        color="text-red-600"
                    />
                </div>
            </div>

            {/* Earnings */}
            <div>
                <h3 className="text-lg font-semibold text-[#0d121c] dark:text-white mb-4">Earnings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl text-white shadow-lg">
                        <div className="flex items-center gap-3 mb-3">
                            <DollarSign size={20} />
                            <p className="text-xs font-semibold uppercase tracking-wider opacity-90">Today's Earnings</p>
                        </div>
                        <p className="text-3xl font-bold">{formatCurrency(data.earnings.today)}</p>
                    </div>
                    <StatCard
                        label="Weekly Earnings"
                        value={formatCurrency(data.earnings.weekly)}
                        icon={<TrendingUp size={20} />}
                        color="text-green-600"
                    />
                    <StatCard
                        label="Pending Settlements"
                        value={formatCurrency(data.earnings.pendingSettlements)}
                        icon={<Clock size={20} />}
                        color="text-amber-600"
                    />
                    <StatCard
                        label="Incentives / Bonuses"
                        value={formatCurrency(data.earnings.incentives)}
                        icon={<Star size={20} />}
                        color="text-purple-600"
                    />
                </div>
            </div>

            {/* Attendance & Availability */}
            <div>
                <h3 className="text-lg font-semibold text-[#0d121c] dark:text-white mb-4">Attendance & Availability</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={cn(
                        "bg-white dark:bg-gray-900 p-6 rounded-xl border shadow-sm",
                        data.attendance.isOnline 
                            ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20" 
                            : "border-gray-200 dark:border-gray-800"
                    )}>
                        <div className="flex items-center gap-3 mb-3">
                            <div className={cn(
                                "w-3 h-3 rounded-full",
                                data.attendance.isOnline ? "bg-green-500" : "bg-gray-400"
                            )} />
                            <p className="text-xs font-semibold uppercase tracking-wider text-[#49659c] dark:text-gray-400">
                                Status
                            </p>
                        </div>
                        <p className="text-2xl font-bold dark:text-white">
                            {data.attendance.isOnline ? 'Online' : 'Offline'}
                        </p>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <Clock size={20} className="text-[#0d59f2]" />
                            <p className="text-xs font-semibold uppercase tracking-wider text-[#49659c] dark:text-gray-400">
                                Login Time
                            </p>
                        </div>
                        <p className="text-2xl font-bold dark:text-white">
                            {data.attendance.loginTime 
                                ? new Date(data.attendance.loginTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                                : '—'
                            }
                        </p>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <Calendar size={20} className="text-[#0d59f2]" />
                            <p className="text-xs font-semibold uppercase tracking-wider text-[#49659c] dark:text-gray-400">
                                Hours Worked Today
                            </p>
                        </div>
                        <p className="text-2xl font-bold dark:text-white">{data.attendance.hoursWorkedToday}h</p>
                    </div>
                </div>
            </div>

            {/* Performance */}
            <div>
                <h3 className="text-lg font-semibold text-[#0d121c] dark:text-white mb-4">Performance</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <Star size={20} className="text-amber-500" />
                            <p className="text-xs font-semibold uppercase tracking-wider text-[#49659c] dark:text-gray-400">
                                Rating
                            </p>
                        </div>
                        <div className="flex items-end gap-2">
                            <p className="text-3xl font-bold dark:text-white">{data.performance.rating.toFixed(1)}</p>
                            <Star size={20} className="text-amber-500 mb-1" />
                        </div>
                    </div>
                    <StatCard
                        label="Total Trips Completed"
                        value={data.performance.totalTripsCompleted}
                        icon={<CheckCircle size={20} />}
                        color="text-green-600"
                    />
                    <StatCard
                        label="Complaints"
                        value={data.performance.complaints}
                        icon={<AlertTriangle size={20} />}
                        color={data.performance.complaints > 0 ? "text-red-600" : "text-green-600"}
                    />
                    <StatCard
                        label="Penalties Applied"
                        value={data.performance.penalties}
                        icon={<Shield size={20} />}
                        color={data.performance.penalties > 0 ? "text-red-600" : "text-green-600"}
                    />
                </div>
            </div>

            {/* Compliance */}
            <div>
                <h3 className="text-lg font-semibold text-[#0d121c] dark:text-white mb-4">Compliance</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={cn(
                        "bg-white dark:bg-gray-900 p-6 rounded-xl border shadow-sm",
                        data.compliance.documentExpiryAlerts > 0
                            ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20"
                            : "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20"
                    )}>
                        <div className="flex items-center gap-3 mb-3">
                            <AlertTriangle size={20} className={data.compliance.documentExpiryAlerts > 0 ? "text-red-600" : "text-green-600"} />
                            <p className="text-xs font-semibold uppercase tracking-wider text-[#49659c] dark:text-gray-400">
                                Document Expiry Alerts
                            </p>
                        </div>
                        <p className="text-2xl font-bold dark:text-white">{data.compliance.documentExpiryAlerts}</p>
                    </div>
                    <div className={cn(
                        "bg-white dark:bg-gray-900 p-6 rounded-xl border shadow-sm",
                        data.compliance.vehicleVerificationStatus === 'Verified'
                            ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20"
                            : "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20"
                    )}>
                        <div className="flex items-center gap-3 mb-3">
                            <Shield size={20} className={data.compliance.vehicleVerificationStatus === 'Verified' ? "text-green-600" : "text-amber-600"} />
                            <p className="text-xs font-semibold uppercase tracking-wider text-[#49659c] dark:text-gray-400">
                                Vehicle Verification
                            </p>
                        </div>
                        <p className="text-2xl font-bold dark:text-white">{data.compliance.vehicleVerificationStatus}</p>
                    </div>
                    {data.compliance.appUpdates.length > 0 && (
                        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                                <Bell size={20} className="text-blue-600" />
                                <p className="text-xs font-semibold uppercase tracking-wider text-[#49659c] dark:text-gray-400">
                                    App Updates
                                </p>
                            </div>
                            <div className="space-y-1">
                                {data.compliance.appUpdates.map((update, idx) => (
                                    <p key={idx} className="text-sm font-medium dark:text-white">{update}</p>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
