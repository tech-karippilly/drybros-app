"use client";

import React from 'react';
import { Truck, AlertTriangle, UserPlus, ReceiptText } from 'lucide-react';
import { cn } from '@/lib/utils';

const activities = [
    {
        id: 1,
        icon: Truck,
        iconBg: "bg-blue-50 dark:bg-blue-900/30",
        iconColor: "text-[#0d59f2]",
        title: <><span className="font-bold">Driver John Doe</span> completed Trip #5482</>,
        time: "2 minutes ago"
    },
    {
        id: 2,
        icon: AlertTriangle,
        iconBg: "bg-amber-50 dark:bg-amber-900/30",
        iconColor: "text-amber-500",
        title: <><span className="font-bold">Staff Sarah M.</span> reported a complaint</>,
        time: "15 minutes ago"
    },
    {
        id: 3,
        icon: UserPlus,
        iconBg: "bg-green-50 dark:bg-green-900/30",
        iconColor: "text-green-600",
        title: <><span className="font-bold">New Driver</span> onboarding initiated</>,
        time: "45 minutes ago"
    },
    {
        id: 4,
        icon: ReceiptText,
        iconBg: "bg-purple-50 dark:bg-purple-900/30",
        iconColor: "text-purple-600",
        title: <>Payroll for <span className="font-bold">Sector A</span> processed</>,
        time: "1 hour ago"
    }
];

export function RecentActivities() {
    return (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex-1">
            <h4 className="text-lg font-bold mb-4 dark:text-white">Recent Activities</h4>
            <div className="space-y-6">
                {activities.map((activity) => (
                    <div key={activity.id} className="flex gap-4">
                        <div className={cn("size-8 rounded-full flex items-center justify-center shrink-0", activity.iconBg, activity.iconColor)}>
                            <activity.icon size={18} />
                        </div>
                        <div>
                            <p className="text-sm font-medium dark:text-gray-200">{activity.title}</p>
                            <p className="text-xs text-[#49659c] dark:text-gray-400">{activity.time}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
