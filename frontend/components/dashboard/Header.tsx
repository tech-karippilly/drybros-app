"use client";

import React from 'react';
import { Search, Bell, Settings, ChevronDown, Building2 } from 'lucide-react';
import { useAppSelector } from '@/lib/hooks';

export function Header() {
    const user = useAppSelector((state) => state.auth.user);

    return (
        <header className="h-16 flex items-center justify-between px-8 bg-white dark:bg-[#101622] border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center flex-1 max-w-xl">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#49659c] size-5" />
                    <input
                        className="w-full bg-[#f8f9fc] dark:bg-gray-900 border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-[#0d59f2]/20 placeholder:text-[#49659c] dark:text-white"
                        placeholder="Search orders, drivers, or franchises..."
                        type="text"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative">
                    <button className="flex items-center gap-2 px-4 py-2 bg-[#f8f9fc] dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm font-medium text-[#0d121c] dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                        <Building2 size={18} className="text-[#49659c]" />
                        <span>{user?.franchise_name || 'Main Headquarters'}</span>
                        <ChevronDown size={18} className="text-[#49659c]" />
                    </button>
                </div>

                <button className="relative p-2 text-[#49659c] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                    <Bell size={20} />
                    <span className="absolute top-1.5 right-1.5 size-2 bg-red-500 rounded-full border-2 border-white dark:border-[#101622]"></span>
                </button>

                <button className="p-2 text-[#49659c] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                    <Settings size={20} />
                </button>
            </div>
        </header>
    );
}
