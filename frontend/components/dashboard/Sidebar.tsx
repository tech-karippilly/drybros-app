"use client";

import React from 'react';
import { WashingMachine } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppSelector, useAppDispatch } from '@/lib/hooks';
import { setActiveTab } from '@/lib/features/auth/authSlice';
import { ROLE_MENUS } from '@/lib/constants/dashboard';

interface SidebarProps {
    className?: string;
}

export function Sidebar({ className }: SidebarProps) {
    const { user, activeTab } = useAppSelector((state) => state.auth);
    const dispatch = useAppDispatch();

    const items = ROLE_MENUS[user?.role as keyof typeof ROLE_MENUS] || ROLE_MENUS.admin;

    return (
        <aside className={cn(
            "w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-[#101622] flex flex-col h-full",
            className
        )}>
            <div className="p-6 flex flex-col gap-1 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3">
                    <div className="bg-[#0d59f2] rounded-lg size-10 flex items-center justify-center text-white">
                        <WashingMachine size={24} />
                    </div>
                    <div>
                        <h1 className="text-[#0d121c] dark:text-white text-lg font-bold leading-tight uppercase tracking-tight">Drybros</h1>
                        <p className="text-[#49659c] dark:text-gray-400 text-xs font-medium uppercase tracking-tighter">Portal</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto p-4 flex flex-col gap-1">
                {items.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => dispatch(setActiveTab(item.id))}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium w-full text-left",
                            activeTab === item.id
                                ? "bg-[#0d59f2] text-white shadow-lg shadow-blue-500/20"
                                : "text-[#0d121c] dark:text-gray-300 hover:bg-[#e7ebf4] dark:hover:bg-gray-800"
                        )}
                    >
                        <item.icon size={20} className={cn(
                            activeTab === item.id ? "text-white" : "text-[#49659c] dark:text-gray-400"
                        )} />
                        <span>{item.label}</span>
                    </button>
                ))}
            </nav>

            <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                    <div className="size-8 rounded-full bg-[#0d59f2]/10 flex items-center justify-center text-[#0d59f2] font-bold text-sm">
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <p className="text-[#0d121c] dark:text-white text-xs font-bold leading-tight truncate">
                            {user?.name || 'User'}
                        </p>
                        <p className="text-[#49659c] dark:text-gray-400 text-[10px] capitalize">
                            {user?.role || 'User'}
                        </p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
