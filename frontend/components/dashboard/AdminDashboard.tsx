"use client";

import React, { useEffect, useState } from 'react';
import {
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    CheckCircle,
    Clock,
    DollarSign,
    Users,
    Truck,
    Store,
    FileText,
    Shield,
    Bell,
    BarChart3,
    MapPin,
    Activity,
} from 'lucide-react';
import {
    DashboardMetrics,
    DashboardAnalytics,
    AlertItem,
    getAdminDashboardMetrics,
    getAdminDashboardAnalytics,
    getAdminDashboardAlerts,
} from '@/lib/features/dashboard/dashboardApi';
import { DASHBOARD_METRICS_LABELS, ALERT_SEVERITY_COLORS, CHART_COLORS } from '@/lib/constants/dashboardMetrics';
import { cn } from '@/lib/utils';

interface MetricCardProps {
    label: string;
    value: string | number;
    trend?: number;
    trendType?: 'up' | 'down';
    icon?: React.ReactNode;
}

function MetricCard({ label, value, trend, trendType, icon }: MetricCardProps) {
    return (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    {icon && <div className="text-[#0d59f2]">{icon}</div>}
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#49659c] dark:text-gray-400">
                        {label}
                    </p>
                </div>
                {trend !== undefined && trendType && (
                    <div
                        className={cn(
                            'flex items-center gap-1 text-xs font-bold px-2 py-1 rounded',
                            trendType === 'up'
                                ? 'text-green-600 bg-green-50 dark:bg-green-900/20'
                                : 'text-red-600 bg-red-50 dark:bg-red-900/20'
                        )}
                    >
                        {trendType === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            <h3 className="text-3xl font-bold text-[#0d121c] dark:text-white">{value}</h3>
        </div>
    );
}

function AlertCard({ alert }: { alert: AlertItem }) {
    const severityColor = ALERT_SEVERITY_COLORS[alert.severity] || ALERT_SEVERITY_COLORS.low;
    
    return (
        <div className={cn('p-4 rounded-lg border', severityColor)}>
            <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-1">{alert.title}</h4>
                    <p className="text-xs opacity-80">{alert.description}</p>
                </div>
            </div>
        </div>
    );
}

function RevenueChart({ data }: { data: DashboardAnalytics['revenueTrend'] }) {
    const maxRevenue = Math.max(...data.map((d) => d.revenue));
    
    return (
        <div className="h-[250px] w-full relative">
            <svg width="100%" height="100%" className="overflow-visible">
                <defs>
                    <linearGradient id="revenueGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor={CHART_COLORS.PRIMARY} stopOpacity="0.2" />
                        <stop offset="100%" stopColor={CHART_COLORS.PRIMARY} stopOpacity="0" />
                    </linearGradient>
                </defs>
                <path
                    d={`M 0 ${250 - (data[0].revenue / maxRevenue) * 200} ${data
                        .map(
                            (d, i) =>
                                `L ${(i / (data.length - 1)) * 100}% ${250 - (d.revenue / maxRevenue) * 200}`
                        )
                        .join(' ')} L 100% ${250 - (data[data.length - 1].revenue / maxRevenue) * 200} L 100% 250 L 0 250 Z`}
                    fill="url(#revenueGradient)"
                />
                <path
                    d={`M 0 ${250 - (data[0].revenue / maxRevenue) * 200} ${data
                        .map(
                            (d, i) =>
                                `L ${(i / (data.length - 1)) * 100}% ${250 - (d.revenue / maxRevenue) * 200}`
                        )
                        .join(' ')}`}
                    stroke={CHART_COLORS.PRIMARY}
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                />
            </svg>
        </div>
    );
}

export function AdminDashboard() {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
    const [alerts, setAlerts] = useState<AlertItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                setLoading(true);
                const [metricsData, analyticsData, alertsData] = await Promise.all([
                    getAdminDashboardMetrics(),
                    getAdminDashboardAnalytics(),
                    getAdminDashboardAlerts(),
                ]);

                if (!cancelled) {
                    setMetrics(metricsData);
                    setAnalytics(analyticsData);
                    setAlerts(alertsData);
                }
            } catch (error) {
                console.error('Failed to load dashboard data:', error);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    if (loading || !metrics || !analytics) {
        return (
            <div className="animate-in fade-in duration-500">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white">Admin Dashboard</h2>
                    <p className="text-[#49659c] dark:text-gray-400">Loading dashboard metrics...</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    const formatPercent = (value: number) => `${value.toFixed(1)}%`;

    return (
        <div className="animate-in fade-in duration-500 space-y-8">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white">Admin Dashboard</h2>
                <p className="text-[#49659c] dark:text-gray-400">Business health, compliance, growth, and risks</p>
            </div>

            {/* Key Metrics */}
            <div>
                <h3 className="text-lg font-semibold text-[#0d121c] dark:text-white mb-4">Key Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard
                        label={DASHBOARD_METRICS_LABELS.TRIPS_TODAY}
                        value={metrics.tripsToday}
                        icon={<Truck size={20} />}
                    />
                    <MetricCard
                        label={DASHBOARD_METRICS_LABELS.TOTAL_REVENUE}
                        value={formatCurrency(metrics.totalRevenue)}
                        icon={<DollarSign size={20} />}
                    />
                    <MetricCard
                        label={DASHBOARD_METRICS_LABELS.ACTIVE_DRIVERS}
                        value={metrics.activeDrivers}
                        icon={<Users size={20} />}
                    />
                    <MetricCard
                        label={DASHBOARD_METRICS_LABELS.ACTIVE_FRANCHISES}
                        value={metrics.activeFranchises}
                        icon={<Store size={20} />}
                    />
                    <MetricCard
                        label={DASHBOARD_METRICS_LABELS.TOTAL_CUSTOMERS}
                        value={metrics.totalCustomers}
                        icon={<Users size={20} />}
                    />
                    <MetricCard
                        label={DASHBOARD_METRICS_LABELS.CANCELLATION_RATE}
                        value={formatPercent(metrics.cancellationRate)}
                        icon={<TrendingDown size={20} />}
                    />
                    <MetricCard
                        label={DASHBOARD_METRICS_LABELS.COMPLAINTS_COUNT}
                        value={metrics.complaintsCount}
                        icon={<FileText size={20} />}
                    />
                    <MetricCard
                        label={DASHBOARD_METRICS_LABELS.PENALTIES_ISSUED}
                        value={metrics.penaltiesIssued}
                        icon={<Shield size={20} />}
                    />
                </div>
            </div>

            {/* Analytics & Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trend */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h4 className="text-lg font-bold dark:text-white">Revenue Trend</h4>
                            <p className="text-sm text-[#49659c] dark:text-gray-400">Last 30 days</p>
                        </div>
                        <BarChart3 size={24} className="text-[#0d59f2]" />
                    </div>
                    <RevenueChart data={analytics.revenueTrend} />
                </div>

                {/* Trips by Type */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h4 className="text-lg font-bold dark:text-white">Trips by Type</h4>
                            <p className="text-sm text-[#49659c] dark:text-gray-400">Distribution</p>
                        </div>
                        <MapPin size={24} className="text-[#0d59f2]" />
                    </div>
                    <div className="space-y-4">
                        {analytics.tripTypeDistribution.map((item, idx) => (
                            <div key={idx}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium dark:text-white">{item.type}</span>
                                    <span className="text-sm text-[#49659c] dark:text-gray-400">
                                        {item.count} trips
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div
                                        className="bg-[#0d59f2] h-2 rounded-full"
                                        style={{
                                            width: `${(item.count / analytics.tripTypeDistribution.reduce((sum, t) => sum + t.count, 0)) * 100}%`,
                                        }}
                                    />
                                </div>
                                <p className="text-xs text-[#49659c] dark:text-gray-400 mt-1">
                                    {formatCurrency(item.revenue)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Trips by City/Branch */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h4 className="text-lg font-bold dark:text-white">Trips by City / Branch</h4>
                            <p className="text-sm text-[#49659c] dark:text-gray-400">Geographic distribution</p>
                        </div>
                        <MapPin size={24} className="text-[#0d59f2]" />
                    </div>
                    <div className="space-y-3">
                        {analytics.cityBranchDistribution.map((item, idx) => (
                            <div
                                key={idx}
                                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                            >
                                <div>
                                    <p className="font-medium text-sm dark:text-white">{item.branch}</p>
                                    <p className="text-xs text-[#49659c] dark:text-gray-400">{item.city}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-sm dark:text-white">{item.trips}</p>
                                    <p className="text-xs text-[#49659c] dark:text-gray-400">
                                        {formatCurrency(item.revenue)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Peak Booking Hours */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h4 className="text-lg font-bold dark:text-white">Peak Booking Hours</h4>
                            <p className="text-sm text-[#49659c] dark:text-gray-400">Today's pattern</p>
                        </div>
                        <Clock size={24} className="text-[#0d59f2]" />
                    </div>
                    <div className="grid grid-cols-6 gap-2">
                        {analytics.peakBookingHours.map((item) => {
                            const maxBookings = Math.max(...analytics.peakBookingHours.map((h) => h.bookings));
                            return (
                                <div key={item.hour} className="flex flex-col items-center">
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-t-lg relative" style={{ height: '120px' }}>
                                        <div
                                            className="absolute bottom-0 w-full bg-[#0d59f2] rounded-t-lg transition-all"
                                            style={{
                                                height: `${(item.bookings / maxBookings) * 100}%`,
                                            }}
                                        />
                                    </div>
                                    <p className="text-xs font-medium mt-2 dark:text-white">{item.hour}:00</p>
                                    <p className="text-xs text-[#49659c] dark:text-gray-400">{item.bookings}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Alerts & Exceptions */}
            <div>
                <h3 className="text-lg font-semibold text-[#0d121c] dark:text-white mb-4 flex items-center gap-2">
                    <Bell size={20} />
                    Alerts & Exceptions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {alerts.map((alert) => (
                        <AlertCard key={alert.id} alert={alert} />
                    ))}
                </div>
            </div>

            {/* Operations Overview */}
            <div>
                <h3 className="text-lg font-semibold text-[#0d121c] dark:text-white mb-4">Operations Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <Activity size={20} className="text-[#0d59f2]" />
                            <p className="text-sm font-semibold text-[#49659c] dark:text-gray-400">Ongoing Trips</p>
                        </div>
                        <p className="text-2xl font-bold dark:text-white">{metrics.ongoingTrips}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <CheckCircle size={20} className="text-green-600" />
                            <p className="text-sm font-semibold text-[#49659c] dark:text-gray-400">Completed Trips</p>
                        </div>
                        <p className="text-2xl font-bold dark:text-white">{metrics.completedTrips}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <AlertTriangle size={20} className="text-red-600" />
                            <p className="text-sm font-semibold text-[#49659c] dark:text-gray-400">Cancelled Trips</p>
                        </div>
                        <p className="text-2xl font-bold dark:text-white">{metrics.cancelledTrips}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <DollarSign size={20} className="text-amber-600" />
                            <p className="text-sm font-semibold text-[#49659c] dark:text-gray-400">Failed Payments</p>
                        </div>
                        <p className="text-2xl font-bold dark:text-white">0</p>
                    </div>
                </div>
            </div>

            {/* User & System Control */}
            <div>
                <h3 className="text-lg font-semibold text-[#0d121c] dark:text-white mb-4">User & System Control</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard
                        label="New Driver Registrations"
                        value={metrics.pendingDriverRegistrations}
                        icon={<Users size={20} />}
                    />
                    <MetricCard
                        label="New Franchise Requests"
                        value={metrics.pendingFranchiseRequests}
                        icon={<Store size={20} />}
                    />
                    <MetricCard
                        label="Staff Activity Logs"
                        value="Active"
                        icon={<Activity size={20} />}
                    />
                    <MetricCard
                        label="System Health"
                        value="99.9%"
                        icon={<CheckCircle size={20} />}
                    />
                </div>
            </div>
        </div>
    );
}
