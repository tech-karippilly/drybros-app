"use client";

import React from 'react';
import { useAppSelector } from '@/lib/hooks';
import { StaffList } from './StaffList';

export function StaffManager() {
    const { selectedStaff } = useAppSelector((state) => state.staff);

    // Later we can add StaffDetails view here
    if (selectedStaff) {
        return (
            <div className="flex flex-col gap-4">
                <button
                    onClick={() => window.location.reload()} // Temporary way to go back until it's connected
                    className="text-sm text-[#0d59f2] font-bold"
                >
                    &larr; Back to List
                </button>
                <div className="p-8 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                    <h2 className="text-2xl font-bold dark:text-white">{selectedStaff.name}</h2>
                    <p className="text-[#49659c]">Detailed view coming soon...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative">
            <StaffList />
        </div>
    );
}
