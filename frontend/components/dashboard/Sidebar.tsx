"use client";

import React from 'react';
import {
    Users,
    Truck,
    BarChart3,
    CreditCard,
    Map,
    MessageSquare,
    CalendarCheck,
    WashingMachine,
    Store
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppSelector } from '@/lib/hooks';

interface SidebarProps {
    className?: string;
}

const navItems = [
    { icon: Store, label: 'Franchises', id: 'franchises' },
    { icon: Users, label: 'Staff', id: 'staff' },
    { icon: Truck, label: 'Drivers', id: 'drivers' },
    { icon: BarChart3, label: 'Reports', id: 'reports' },
    { icon: CreditCard, label: 'Payroll & Penalties', id: 'payroll' },
    { icon: Map, label: 'Trip Management', id: 'trips' },
    { icon: MessageSquare, label: 'Complaints', id: 'complaints' },
    { icon: CalendarCheck, label: 'Attendance', id: 'attendance' },
];

export function Sidebar({ className }: SidebarProps) {
    const user = useAppSelector((state) => state.auth.user);
    const [activeTab, setActiveTab] = React.useState('franchises');

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
                        <p className="text-[#49659c] dark:text-gray-400 text-xs font-medium">
                            {user?.role === 'admin' ? 'Admin Dashboard' :
                                user?.role === 'staff' ? 'Staff Portal' : 'Driver Portal'}
                        </p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto p-4 flex flex-col gap-1">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium w-full text-left",
                            activeTab === item.id
                                ? "bg-[#0d59f2] text-white"
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
