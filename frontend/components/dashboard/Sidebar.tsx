"use client";

import React, { useState, useEffect } from 'react';
import { WashingMachine, LogOut, ChevronDown, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAppSelector, useAppDispatch } from '@/lib/hooks';
import { setActiveTab, logout } from '@/lib/features/auth/authSlice';
import { ROLE_MENUS } from '@/lib/constants/dashboard';
import { handleLogout } from '@/lib/utils/auth';

interface SidebarProps {
    className?: string;
}

export function Sidebar({ className }: SidebarProps) {
    const { user, activeTab } = useAppSelector((state) => state.auth);
    const dispatch = useAppDispatch();
    const router = useRouter();
    const [expandedMenus, setExpandedMenus] = useState<Set<string>>(
        new Set(
            ['trip-types', 'trip-booking', 'unassigned-trips'].includes(activeTab)
                ? ['trips']
                : []
        )
    );

    const items = ROLE_MENUS[user?.role as keyof typeof ROLE_MENUS] || ROLE_MENUS.admin;

    // Auto-expand parent menu when submenu item is active
    useEffect(() => {
        items.forEach((item) => {
            if (item.submenu) {
                const hasActiveSubmenu = item.submenu.some((subItem) => subItem.id === activeTab);
                if (hasActiveSubmenu && !expandedMenus.has(item.id)) {
                    setExpandedMenus((prev) => new Set(prev).add(item.id));
                }
            }
        });
    }, [activeTab, items, expandedMenus]);

    const toggleSubmenu = (menuId: string) => {
        setExpandedMenus((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(menuId)) {
                newSet.delete(menuId);
            } else {
                newSet.add(menuId);
            }
            return newSet;
        });
    };

    const isMenuExpanded = (menuId: string) => expandedMenus.has(menuId);
    const isParentActive = (item: typeof items[0]) => {
        if (item.id === activeTab) return true;
        if (item.submenu) {
            return item.submenu.some((subItem) => subItem.id === activeTab);
        }
        return false;
    };

    const handleMenuClick = (item: typeof items[0]) => {
        if (item.submenu && item.submenu.length > 0) {
            const wasExpanded = isMenuExpanded(item.id);
            toggleSubmenu(item.id);
            // If expanding (was not expanded), select first submenu item
            if (!wasExpanded && item.submenu.length > 0) {
                dispatch(setActiveTab(item.submenu[0].id));
            }
        } else {
            dispatch(setActiveTab(item.id));
        }
    };

    const handleSubmenuClick = (subItemId: string, parentId: string) => {
        dispatch(setActiveTab(subItemId));
    };

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
                {items.map((item) => {
                    const hasSubmenu = item.submenu && item.submenu.length > 0;
                    const isExpanded = isMenuExpanded(item.id);
                    const isActive = isParentActive(item);

                    return (
                        <div key={item.id} className="flex flex-col">
                            <button
                                onClick={() => handleMenuClick(item)}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium w-full text-left",
                                    isActive
                                        ? "bg-[#0d59f2] text-white shadow-lg shadow-blue-500/20"
                                        : "text-[#0d121c] dark:text-gray-300 hover:bg-[#e7ebf4] dark:hover:bg-gray-800"
                                )}
                            >
                                <item.icon size={20} className={cn(
                                    isActive ? "text-white" : "text-[#49659c] dark:text-gray-400"
                                )} />
                                <span className="flex-1">{item.label}</span>
                                {hasSubmenu && (
                                    isExpanded ? (
                                        <ChevronDown size={16} className={cn(
                                            isActive ? "text-white" : "text-[#49659c] dark:text-gray-400"
                                        )} />
                                    ) : (
                                        <ChevronRight size={16} className={cn(
                                            isActive ? "text-white" : "text-[#49659c] dark:text-gray-400"
                                        )} />
                                    )
                                )}
                            </button>
                            {hasSubmenu && isExpanded && (
                                <div className="ml-4 mt-1 flex flex-col gap-1 border-l-2 border-gray-200 dark:border-gray-800 pl-2">
                                    {item.submenu!.map((subItem) => (
                                        <button
                                            key={subItem.id}
                                            onClick={() => handleSubmenuClick(subItem.id, item.id)}
                                            className={cn(
                                                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium w-full text-left",
                                                activeTab === subItem.id
                                                    ? "bg-[#0d59f2]/10 text-[#0d59f2] dark:bg-[#0d59f2]/20 dark:text-[#0d59f2]"
                                                    : "text-[#49659c] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                                            )}
                                        >
                                            <subItem.icon size={16} />
                                            <span>{subItem.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
                <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                    <div className="size-8 rounded-full bg-[#0d59f2]/10 flex items-center justify-center text-[#0d59f2] font-bold text-sm">
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                        <p className="text-[#0d121c] dark:text-white text-xs font-bold leading-tight truncate">
                            {user?.name || 'User'}
                        </p>
                        <p className="text-[#49659c] dark:text-gray-400 text-[10px] capitalize">
                            {user?.role || 'User'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={async () => {
                        await handleLogout(dispatch, logout, router);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800/50"
                >
                    <LogOut size={18} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
}
