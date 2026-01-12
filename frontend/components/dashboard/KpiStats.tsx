"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface KpiStatsProps {
    label: string;
    value: string | number;
    trend: number;
    trendType: 'up' | 'down';
}

function StatCard({ label, value, trend, trendType }: KpiStatsProps) {
    const isUp = trendType === 'up';

    return (
        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm transition-all hover:shadow-md">
            <p className="text-[#49659c] dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">
                {label}
            </p>
            <div className="flex items-end justify-between">
                <h3 className="text-2xl font-bold dark:text-white">{value}</h3>
                <span className={cn(
                    "text-xs font-bold flex items-center px-1.5 py-0.5 rounded",
                    isUp
                        ? "text-[#07883b] bg-green-50 dark:bg-green-900/20"
                        : "text-[#e73908] bg-red-50 dark:bg-red-900/20"
                )}>
                    {isUp ? '+' : '-'}{Math.abs(trend)}%
                </span>
            </div>
        </div>
    );
}

export function KpiStatsGrid() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <StatCard label="Today's Trip" value="142" trend={12} trendType="up" />
            <StatCard label="Active Trips" value="28" trend={5} trendType="up" />
            <StatCard label="Canceled Trips" value="12" trend={2} trendType="down" />
            <StatCard label="Total Drivers" value="85" trend={3} trendType="up" />
            <StatCard label="Today's Revenue" value="$4,250" trend={15} trendType="up" />
        </div>
    );
}
