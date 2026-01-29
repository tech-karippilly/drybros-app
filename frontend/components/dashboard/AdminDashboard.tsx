"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
    Building2,
    Route,
    DollarSign,
    Car,
    Star,
    Calendar,
    Plus,
    AlertTriangle,
    CheckCircle,
    Building,
} from "lucide-react";
import {
    DashboardMetrics,
    DashboardAnalytics,
    AlertItem,
    getAdminDashboardMetrics,
    getAdminDashboardAnalytics,
    getAdminDashboardAlerts,
} from "@/lib/features/dashboard/dashboardApi";
import { ADMIN_DASHBOARD_STRINGS } from "@/lib/constants/dashboardMetrics";
import { cn } from "@/lib/utils";
import { useAppSelector, useActivityStream } from "@/lib/hooks";
import { DASHBOARD_ROUTES } from "@/lib/constants/routes";
import { activityToEventItem, getEmptyCriticalEventItem } from "@/lib/utils/activityFormatters";

/** Primary color from Dybros Super Admin design */
const PRIMARY = "#137fec";

interface StatCardProps {
    label: string;
    value: string | number;
    trend?: string;
    trendPositive?: boolean;
    icon: React.ReactNode;
    iconBgClass: string;
    barClass: string;
}

function StatCard({
    label,
    value,
    trend,
    trendPositive = true,
    icon,
    iconBgClass,
    barClass,
}: StatCardProps) {
    return (
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 dark:border-[#324d67] dark:bg-[#111a22] flex flex-col gap-1">
            <div className="mb-2 flex items-start justify-between">
                <div
                    className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg",
                        iconBgClass
                    )}
                >
                    {icon}
                </div>
                {trend != null && (
                    <span
                        className={cn(
                            "rounded-md px-2 py-1 text-xs font-bold",
                            trendPositive
                                ? "bg-green-500/10 text-green-500"
                                : "bg-slate-500/10 text-slate-500"
                        )}
                    >
                        {trend}
                    </span>
                )}
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-[#92adc9]">
                {label}
            </p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            <div
                className={cn(
                    "absolute bottom-0 left-0 h-1 w-full",
                    barClass
                )}
            />
        </div>
    );
}

interface EventItemProps {
    icon: React.ReactNode;
    iconBg: string;
    title: string;
    description: string;
    timeAgo: string;
}

function EventItem({
    icon,
    iconBg,
    title,
    description,
    timeAgo,
}: EventItemProps) {
    return (
        <div className="relative pl-8">
            <div
                className={cn(
                    "absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full text-white ring-4 ring-white dark:ring-[#111a22]",
                    iconBg
                )}
            >
                {icon}
            </div>
            <p className="text-xs font-bold leading-tight">{title}</p>
            <p className="text-[11px] text-slate-500 dark:text-[#92adc9]">
                {description}
            </p>
            <p className="mt-1 text-[10px] text-slate-400">{timeAgo}</p>
        </div>
    );
}

function RevenueChartSvg({ data }: { data: DashboardAnalytics["revenueTrend"] }) {
    const maxR = Math.max(...data.map((d) => d.revenue), 1);
    const pts = data.map((d, i) => {
        const x = (i / (data.length - 1 || 1)) * 800;
        const y = 200 - (d.revenue / maxR) * 160;
        return { x, y };
    });
    const pathLine = pts.length
        ? `M ${pts[0].x} ${pts[0].y} ${pts
              .slice(1)
              .map((p) => `L ${p.x} ${p.y}`)
              .join(" ")}`
        : "";
    const pathFill =
        pts.length > 0
            ? `${pathLine} L 800 200 L 0 200 Z`
            : "";

    return (
        <svg
            className="h-full w-full"
            preserveAspectRatio="none"
            viewBox="0 0 800 200"
        >
            <defs>
                <linearGradient
                    id="adminChartGradient"
                    x1="0"
                    x2="0"
                    y1="0"
                    y2="1"
                >
                    <stop offset="0%" stopColor={PRIMARY} stopOpacity="0.2" />
                    <stop offset="100%" stopColor={PRIMARY} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={pathFill} fill="url(#adminChartGradient)" />
            <path
                d={pathLine}
                fill="none"
                stroke={PRIMARY}
                strokeWidth="3"
            />
        </svg>
    );
}

export function AdminDashboard() {
    const { refreshTrigger, selectedFranchise } = useAppSelector((state) => state.auth);
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
    const [alerts, setAlerts] = useState<AlertItem[]>([]);
    const [loading, setLoading] = useState(true);
    const { activities: streamActivities, loading: streamLoading, error: streamError } = useActivityStream({
        franchiseId: selectedFranchise?._id ?? undefined,
        enabled: true,
    });

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                const [m, a, al] = await Promise.all([
                    getAdminDashboardMetrics(),
                    getAdminDashboardAnalytics(),
                    getAdminDashboardAlerts(),
                ]);
                if (!cancelled) {
                    setMetrics(m);
                    setAnalytics(a);
                    setAlerts(al);
                }
            } catch (e) {
                console.error("Failed to load dashboard data:", e);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [refreshTrigger]);

    const formatCurrency = (amount: number) =>
        `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

    if (loading || !metrics || !analytics) {
        return (
            <div className="animate-in fade-in duration-500">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                        {ADMIN_DASHBOARD_STRINGS.PAGE_TITLE}
                    </h2>
                    <p className="text-slate-500 dark:text-[#92adc9]">
                        {ADMIN_DASHBOARD_STRINGS.LOADING_MESSAGE}
                    </p>
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div
                            key={i}
                            className="h-32 animate-pulse rounded-xl bg-slate-100 dark:bg-[#233648]"
                        />
                    ))}
                </div>
            </div>
        );
    }

    const totalRevenueDisplay =
        analytics.revenueTrend.length > 0
            ? formatCurrency(
                  analytics.revenueTrend.reduce((s, d) => s + d.revenue, 0)
              )
            : formatCurrency(metrics.totalRevenue);
    const topBranches = analytics.cityBranchDistribution
        .slice(0, 3)
        .map((b) => ({
            initials: b.branch.slice(0, 2).toUpperCase(),
            name: `${b.branch} – ${b.city}`,
            trips: b.trips,
            revenue: formatCurrency(b.revenue),
            csat: "4.9",
            status:
                b.revenue > 600000
                    ? ADMIN_DASHBOARD_STRINGS.STATUS_EXCELLENT
                    : b.revenue > 400000
                      ? ADMIN_DASHBOARD_STRINGS.STATUS_HIGH
                      : ADMIN_DASHBOARD_STRINGS.STATUS_STEADY,
        }));

    const eventItems =
        streamActivities.length > 0
            ? streamActivities.slice(0, 10).map((a) => activityToEventItem(a))
            : [getEmptyCriticalEventItem()];

    return (
        <div className="animate-in fade-in duration-500">
            {/* Page Header */}
            <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                        {ADMIN_DASHBOARD_STRINGS.PAGE_TITLE}
                    </h2>
                    <p className="text-slate-500 dark:text-[#92adc9]">
                        {ADMIN_DASHBOARD_STRINGS.PAGE_SUBTITLE}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold transition-colors hover:bg-slate-50 dark:border-transparent dark:bg-[#233648] dark:hover:bg-[#233648]/80"
                    >
                        <Calendar className="h-5 w-5" />
                        {ADMIN_DASHBOARD_STRINGS.FILTER_LAST_30_DAYS}
                    </button>
                    <Link
                        href={DASHBOARD_ROUTES.FRANCHISES}
                        className="flex items-center gap-2 rounded-lg bg-[#137fec] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#137fec]/20 transition-transform active:scale-95"
                    >
                        <Plus className="h-5 w-5" />
                        {ADMIN_DASHBOARD_STRINGS.BTN_NEW_FRANCHISE}
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    label={ADMIN_DASHBOARD_STRINGS.STAT_TOTAL_FRANCHISES}
                    value={metrics.activeFranchises ?? metrics.totalBranches}
                    trend="+2%"
                    trendPositive
                    icon={<Building2 className="h-5 w-5 text-[#137fec]" />}
                    iconBgClass="bg-[#137fec]/10"
                    barClass="bg-[#137fec]/20"
                />
                <StatCard
                    label={ADMIN_DASHBOARD_STRINGS.STAT_ACTIVE_TRIPS}
                    value={metrics.ongoingTrips}
                    trend="+15%"
                    trendPositive
                    icon={<Route className="h-5 w-5 text-orange-500" />}
                    iconBgClass="bg-orange-500/10"
                    barClass="bg-orange-500/20"
                />
                <StatCard
                    label={ADMIN_DASHBOARD_STRINGS.STAT_DAILY_REVENUE}
                    value={formatCurrency(metrics.revenueToday)}
                    trend="+8%"
                    trendPositive
                    icon={<DollarSign className="h-5 w-5 text-green-500" />}
                    iconBgClass="bg-green-500/10"
                    barClass="bg-green-500/20"
                />
                <StatCard
                    label={ADMIN_DASHBOARD_STRINGS.STAT_ACTIVE_DRIVERS}
                    value={metrics.activeDrivers}
                    trend={ADMIN_DASHBOARD_STRINGS.TREND_FLAT}
                    trendPositive={false}
                    icon={<Car className="h-5 w-5 text-purple-500" />}
                    iconBgClass="bg-purple-500/10"
                    barClass="bg-purple-500/20"
                />
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Chart + Table */}
                <div className="flex flex-col gap-6 lg:col-span-2">
                    {/* Global Revenue Analytics */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-[#324d67] dark:bg-[#111a22]">
                        <div className="mb-8 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                    {ADMIN_DASHBOARD_STRINGS.CHART_TITLE}
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-[#92adc9]">
                                    {ADMIN_DASHBOARD_STRINGS.CHART_SUBTITLE}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                    {totalRevenueDisplay}
                                </p>
                                <p className="text-xs font-medium text-green-500">
                                    {ADMIN_DASHBOARD_STRINGS.CHART_VS_LAST_MONTH}
                                </p>
                            </div>
                        </div>
                        <div className="relative h-64">
                            <RevenueChartSvg data={analytics.revenueTrend} />
                            <div className="flex justify-between px-2 pt-4">
                                {["MAY 01", "MAY 08", "MAY 15", "MAY 22", "MAY 31"].map(
                                    (l) => (
                                        <span
                                            key={l}
                                            className="text-[10px] font-bold text-slate-400"
                                        >
                                            {l}
                                        </span>
                                    )
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Top Performing Franchises */}
                    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-[#324d67] bg-white dark:bg-[#111a22]">
                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-[#324d67]">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                {ADMIN_DASHBOARD_STRINGS.TABLE_TOP_FRANCHISES}
                            </h3>
                            <Link
                                href={DASHBOARD_ROUTES.FRANCHISES}
                                className="text-xs font-bold text-[#137fec] hover:underline"
                            >
                                {ADMIN_DASHBOARD_STRINGS.TABLE_VIEW_ALL}
                            </Link>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-[#1a2835]">
                                    <tr>
                                        <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#92adc9]">
                                            {ADMIN_DASHBOARD_STRINGS.TABLE_HEAD_FRANCHISE}
                                        </th>
                                        <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#92adc9]">
                                            {ADMIN_DASHBOARD_STRINGS.TABLE_HEAD_ACTIVE_TRIPS}
                                        </th>
                                        <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#92adc9]">
                                            {ADMIN_DASHBOARD_STRINGS.TABLE_HEAD_REVENUE}
                                        </th>
                                        <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#92adc9]">
                                            {ADMIN_DASHBOARD_STRINGS.TABLE_HEAD_CSAT}
                                        </th>
                                        <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#92adc9]">
                                            {ADMIN_DASHBOARD_STRINGS.TABLE_HEAD_STATUS}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-[#324d67]">
                                    {topBranches.map((row) => (
                                        <tr
                                            key={row.name}
                                            className="transition-colors hover:bg-slate-50 dark:hover:bg-[#1a2835]/50"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-200 font-bold text-xs dark:bg-[#233648] text-slate-900 dark:text-white">
                                                        {row.initials}
                                                    </div>
                                                    <span className="text-sm font-bold leading-none">
                                                        {row.name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                {row.trips}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-bold">
                                                {row.revenue}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1 text-yellow-500">
                                                    <Star className="h-4 w-4 fill-current" />
                                                    <span className="text-sm font-bold">
                                                        {row.csat}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={cn(
                                                        "rounded px-2 py-0.5 text-[10px] font-bold uppercase",
                                                        row.status ===
                                                            ADMIN_DASHBOARD_STRINGS.STATUS_EXCELLENT
                                                            ? "bg-green-500/10 text-green-500"
                                                            : row.status ===
                                                                ADMIN_DASHBOARD_STRINGS.STATUS_HIGH
                                                              ? "bg-green-500/10 text-green-500"
                                                              : "bg-blue-500/10 text-blue-500"
                                                    )}
                                                >
                                                    {row.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right: System Monitor + Critical Events */}
                <div className="flex flex-col gap-6">
                    {/* System Monitor */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-[#324d67] dark:bg-[#111a22]">
                        <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-[#92adc9]">
                            {ADMIN_DASHBOARD_STRINGS.SYSTEM_MONITOR_TITLE}
                        </h3>
                        <div className="space-y-4">
                            <div className="flex flex-col gap-1.5">
                                <div className="flex justify-between text-xs">
                                    <span className="font-medium">
                                        {ADMIN_DASHBOARD_STRINGS.SYSTEM_CORE_API}
                                    </span>
                                    <span className="font-bold text-green-500">
                                        24ms
                                    </span>
                                </div>
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-[#233648]">
                                    <div
                                        className="h-full bg-green-500"
                                        style={{ width: "15%" }}
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <div className="flex justify-between text-xs">
                                    <span className="font-medium">
                                        {ADMIN_DASHBOARD_STRINGS.SYSTEM_SERVER_LOAD}
                                    </span>
                                    <span className="font-bold text-[#137fec]">
                                        42%
                                    </span>
                                </div>
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-[#233648]">
                                    <div
                                        className="h-full bg-[#137fec]"
                                        style={{ width: "42%" }}
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <div className="flex justify-between text-xs">
                                    <span className="font-medium">
                                        {ADMIN_DASHBOARD_STRINGS.SYSTEM_MEMORY}
                                    </span>
                                    <span className="font-bold text-orange-500">
                                        68%
                                    </span>
                                </div>
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-[#233648]">
                                    <div
                                        className="h-full bg-orange-500"
                                        style={{ width: "68%" }}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 border-t border-slate-100 pt-4 dark:border-[#324d67]">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-green-500" />
                                    <span className="text-xs font-bold">
                                        AWS East-1
                                    </span>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400">
                                    {ADMIN_DASHBOARD_STRINGS.SYSTEM_AWS_UPTIME}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Critical Events (from /activities with selected franchise, debounced polling) */}
                    <div className="flex-1 rounded-xl border border-slate-200 bg-white p-6 dark:border-[#324d67] dark:bg-[#111a22]">
                        <h3 className="mb-6 text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-[#92adc9]">
                            {ADMIN_DASHBOARD_STRINGS.CRITICAL_EVENTS_TITLE}
                        </h3>
                        {streamError && (
                            <p className="mb-4 text-xs text-amber-600 dark:text-amber-400">{streamError}</p>
                        )}
                        {streamLoading && eventItems.length <= 1 ? (
                            <p className="text-xs text-slate-500 dark:text-[#92adc9]">Loading activities…</p>
                        ) : (
                            <div className="relative space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 dark:before:bg-[#233648]">
                                {eventItems.map((ev, idx) => (
                                    <EventItem
                                        key={idx}
                                        icon={ev.icon}
                                        iconBg={ev.iconBg}
                                        title={ev.title}
                                        description={ev.description}
                                        timeAgo={ev.timeAgo}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
