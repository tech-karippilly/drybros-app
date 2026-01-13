"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { Staff } from '@/lib/types/staff';

interface StatusBadgeProps {
    status: Staff['status'];
    duration?: string;
    className?: string;
}

export function StatusBadge({ status, duration, className }: StatusBadgeProps) {
    const getStyles = (s: Staff['status']) => {
        switch (s) {
            case 'active':
                return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-500";
            case 'suspended':
                return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-500";
            case 'fired':
                return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-500";
            case 'block':
                return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    return (
        <span className={cn(
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap",
            getStyles(status),
            className
        )}>
            {status}
            {duration && ` (${duration})`}
        </span>
    );
}
