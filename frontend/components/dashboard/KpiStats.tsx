"use client";

import React, { useEffect, useState } from 'react';
import { getTripCount, getTripsPaginated } from '@/lib/features/trip/tripApi';
import { getDriversPaginated } from '@/lib/features/drivers/driverApi';
import { KPI_ACTIVE_TRIP_STATUSES, KPI_CANCELED_TRIP_STATUSES, getTodayYYYYMMDD } from '@/lib/constants/kpi';
import { cn } from '@/lib/utils';

interface KpiStatsProps {
    label: string;
    value: string | number;
    trend?: number | null;
    trendType?: 'up' | 'down';
}

function StatCard({ label, value, trend, trendType }: KpiStatsProps) {
    const hasTrend = trend != null && trendType;
    const isUp = trendType === 'up';

    return (
        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm transition-all hover:shadow-md">
            <p className="text-[#49659c] dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">
                {label}
            </p>
            <div className="flex items-end justify-between">
                <h3 className="text-2xl font-bold text-[#0d121c] dark:text-white">{value}</h3>
                {hasTrend ? (
                    <span
                        className={cn(
                            'text-xs font-bold flex items-center px-1.5 py-0.5 rounded',
                            isUp
                                ? 'text-[#07883b] bg-green-50 dark:bg-green-900/20'
                                : 'text-[#e73908] bg-red-50 dark:bg-red-900/20'
                        )}
                    >
                        {isUp ? '+' : '-'}{Math.abs(trend)}%
                    </span>
                ) : (
                    <span className="text-xs text-[#49659c] dark:text-gray-400">—</span>
                )}
            </div>
        </div>
    );
}

export function KpiStatsGrid() {
    const [todayCount, setTodayCount] = useState<number | null>(null);
    const [activeCount, setActiveCount] = useState<number | null>(null);
    const [canceledCount, setCanceledCount] = useState<number | null>(null);
    const [totalDrivers, setTotalDrivers] = useState<number | null>(null);
    const [todayRevenue, setTodayRevenue] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        const today = getTodayYYYYMMDD();

        (async () => {
            try {
                setLoading(true);
                setError(null);
                const [todayRes, activeRes, canceledRes, driversRes, todayTripsRes] = await Promise.all([
                    getTripCount({ dateFrom: today, dateTo: today }),
                    getTripCount({ statuses: [...KPI_ACTIVE_TRIP_STATUSES] }),
                    getTripCount({ statuses: [...KPI_CANCELED_TRIP_STATUSES] }),
                    getDriversPaginated({ page: 1, limit: 1 }),
                    getTripsPaginated({
                        page: 1,
                        limit: 500,
                        dateFrom: today,
                        dateTo: today,
                    }),
                ]);

                if (cancelled) return;
                setTodayCount(todayRes);
                setActiveCount(activeRes);
                setCanceledCount(canceledRes);
                setTotalDrivers(driversRes.pagination.total);
                const revenue = todayTripsRes.data.reduce(
                    (sum, t) => sum + (t.finalAmount ?? t.totalAmount ?? 0),
                    0
                );
                setTodayRevenue(revenue);
            } catch (e) {
                if (!cancelled) {
                    const msg = e && typeof e === 'object' && 'response' in e
                        ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
                        : e instanceof Error
                            ? e.message
                            : 'Failed to load KPIs';
                    setError(msg ?? 'Failed to load KPIs');
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div
                        key={i}
                        className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 animate-pulse h-24"
                    />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="mb-8 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm">
                {error}
            </div>
        );
    }

    const formatRevenue = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <StatCard
                label="Today's Trips"
                value={todayCount ?? 0}
            />
            <StatCard
                label="Active Trips"
                value={activeCount ?? 0}
            />
            <StatCard
                label="Canceled Trips"
                value={canceledCount ?? 0}
            />
            <StatCard
                label="Total Drivers"
                value={totalDrivers ?? 0}
            />
            <StatCard
                label="Today's Revenue"
                value={todayRevenue != null ? formatRevenue(todayRevenue) : '—'}
            />
        </div>
    );
}
