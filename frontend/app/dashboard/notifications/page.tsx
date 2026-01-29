"use client";

import React from 'react';
import { Bell, Loader2 } from 'lucide-react';
import { useAppSelector } from '@/lib/hooks';
import { useActivityStream } from '@/lib/hooks';
import { activityToEventItem } from '@/lib/utils/activityFormatters';
import { cn } from '@/lib/utils';

export default function NotificationsPage() {
    const { selectedFranchise } = useAppSelector((state) => state.auth);
    const { activities, loading, error } = useActivityStream({
        franchiseId: selectedFranchise?._id ?? undefined,
        enabled: true,
    });

    return (
        <div className="animate-in fade-in duration-500">
            <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0d59f2]/10 text-[#0d59f2]">
                    <Bell size={20} />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-[#0d121c] dark:text-white">System Notifications</h1>
                    <p className="text-sm text-[#49659c] dark:text-gray-400">
                        Real-time critical events for {selectedFranchise?.name ?? 'all franchises'}.
                    </p>
                </div>
            </div>

            {error && (
                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
                    {error}
                </div>
            )}

            {loading && activities.length === 0 ? (
                <div className="flex items-center justify-center gap-2 py-12 text-[#49659c] dark:text-gray-400">
                    <Loader2 size={20} className="animate-spin" />
                    <span>Loading activities…</span>
                </div>
            ) : activities.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
                    <Bell size={40} className="mx-auto mb-3 text-gray-400" />
                    <p className="font-medium text-[#0d121c] dark:text-white">No events yet</p>
                    <p className="mt-1 text-sm text-[#49659c] dark:text-gray-400">
                        Critical events for the selected franchise will appear here.
                    </p>
                </div>
            ) : (
                <div className="space-y-1 rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                    {activities.map((activity) => {
                        const ev = activityToEventItem(activity);
                        return (
                            <div
                                key={activity.id}
                                className={cn(
                                    'flex items-start gap-4 border-b border-gray-100 p-4 last:border-0 dark:border-gray-800'
                                )}
                            >
                                <div
                                    className={cn(
                                        'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-white',
                                        ev.iconBg
                                    )}
                                >
                                    {ev.icon}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-medium text-[#0d121c] dark:text-white">{ev.title}</p>
                                    <p className="mt-0.5 text-sm text-[#49659c] dark:text-gray-400">
                                        {ev.description}
                                    </p>
                                    <p className="mt-1 text-xs text-gray-400">{ev.timeAgo}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
