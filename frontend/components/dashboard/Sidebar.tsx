"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { WashingMachine, LogOut, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppSelector, useAppDispatch } from '@/lib/hooks';
import { logout } from '@/lib/features/auth/authSlice';
import { ROLE_MENUS } from '@/lib/constants/dashboard';
import { handleLogout } from '@/lib/utils/auth';
import type { NavItem } from '@/lib/constants/dashboard';

interface SidebarProps {
    className?: string;
}

export function Sidebar({ className }: SidebarProps) {
    const { user } = useAppSelector((state) => state.auth);
    const dispatch = useAppDispatch();
    const router = useRouter();
    const pathname = usePathname();

    const items = ROLE_MENUS[user?.role as keyof typeof ROLE_MENUS] || ROLE_MENUS.admin;

    const getInitialExpanded = () => {
        const expanded = new Set<string>();
        items.forEach((item) => {
            if (item.submenu) {
                const hasActiveSubmenu = item.submenu.some(
                    (sub) => sub.href && pathname === sub.href
                );
                if (hasActiveSubmenu) expanded.add(item.id);
            }
        });
        return expanded;
    };

    const [expandedMenus, setExpandedMenus] = useState<Set<string>>(getInitialExpanded);

    useEffect(() => {
        const next = new Set<string>();
        items.forEach((item) => {
            if (item.submenu) {
                const hasActiveSubmenu = item.submenu.some(
                    (sub) => sub.href && pathname === sub.href
                );
                if (hasActiveSubmenu) next.add(item.id);
            }
        });
        setExpandedMenus(next);
    }, [pathname, items]);

    const toggleSubmenu = (menuId: string) => {
        setExpandedMenus((prev) => {
            const next = new Set(prev);
            if (next.has(menuId)) next.delete(menuId);
            else next.add(menuId);
            return next;
        });
    };

    const isMenuExpanded = (menuId: string) => expandedMenus.has(menuId);

    const isParentActive = (item: NavItem) => {
        if (item.href && pathname === item.href) return true;
        if (item.submenu) {
            return item.submenu.some((sub) => sub.href && pathname === sub.href);
        }
        return false;
    };

    const isSubmenuItemActive = (subItem: NavItem) =>
        !!subItem.href && pathname === subItem.href;

    return (
        <aside
            className={cn(
                'flex h-full w-64 flex-shrink-0 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-[#101622]',
                className
            )}
        >
            <div className="flex flex-col gap-1 border-b border-gray-200 p-6 dark:border-gray-800">
                <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-[#0d59f2] text-white">
                        <WashingMachine size={24} />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold uppercase leading-tight tracking-tight text-[#0d121c] dark:text-white">
                            Drybros
                        </h1>
                        <p className="text-xs font-medium uppercase tracking-tighter text-[#49659c] dark:text-gray-400">
                            Portal
                        </p>
                    </div>
                </div>
            </div>

            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
                {items.map((item) => {
                    const hasSubmenu = item.submenu && item.submenu.length > 0;
                    const isExpanded = isMenuExpanded(item.id);
                    const isActive = isParentActive(item);

                    return (
                        <div key={item.id} className="flex flex-col">
                            {hasSubmenu ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => toggleSubmenu(item.id)}
                                        className={cn(
                                            'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors',
                                            isActive
                                                ? 'bg-[#0d59f2] text-white shadow-lg shadow-blue-500/20'
                                                : 'text-[#0d121c] hover:bg-[#e7ebf4] dark:text-gray-300 dark:hover:bg-gray-800'
                                        )}
                                    >
                                        <item.icon
                                            size={20}
                                            className={cn(
                                                isActive ? 'text-white' : 'text-[#49659c] dark:text-gray-400'
                                            )}
                                        />
                                        <span className="flex-1">{item.label}</span>
                                        {isExpanded ? (
                                            <ChevronDown
                                                size={16}
                                                className={cn(
                                                    isActive ? 'text-white' : 'text-[#49659c] dark:text-gray-400'
                                                )}
                                            />
                                        ) : (
                                            <ChevronRight
                                                size={16}
                                                className={cn(
                                                    isActive ? 'text-white' : 'text-[#49659c] dark:text-gray-400'
                                                )}
                                            />
                                        )}
                                    </button>
                                    {isExpanded && (
                                        <div className="ml-4 mt-1 flex flex-col gap-1 border-l-2 border-gray-200 pl-2 dark:border-gray-800">
                                            {item.submenu!.map((subItem) => {
                                                const subActive = isSubmenuItemActive(subItem);
                                                if (subItem.external && subItem.href) {
                                                    return (
                                                        <a
                                                            key={subItem.id}
                                                            href={subItem.href}
                                                            className={cn(
                                                                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                                                subActive
                                                                    ? 'bg-[#0d59f2]/10 text-[#0d59f2] dark:bg-[#0d59f2]/20 dark:text-[#0d59f2]'
                                                                    : 'text-[#49659c] hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
                                                            )}
                                                        >
                                                            <subItem.icon size={16} />
                                                            <span>{subItem.label}</span>
                                                        </a>
                                                    );
                                                }
                                                return (
                                                    <Link
                                                        key={subItem.id}
                                                        href={subItem.href!}
                                                        className={cn(
                                                            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                                            subActive
                                                                ? 'bg-[#0d59f2]/10 text-[#0d59f2] dark:bg-[#0d59f2]/20 dark:text-[#0d59f2]'
                                                                : 'text-[#49659c] hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
                                                        )}
                                                    >
                                                        <subItem.icon size={16} />
                                                        <span>{subItem.label}</span>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </>
                            ) : item.external && item.href ? (
                                <a
                                    href={item.href}
                                    className={cn(
                                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                                        isActive
                                            ? 'bg-[#0d59f2] text-white shadow-lg shadow-blue-500/20'
                                            : 'text-[#0d121c] hover:bg-[#e7ebf4] dark:text-gray-300 dark:hover:bg-gray-800'
                                    )}
                                >
                                    <item.icon
                                        size={20}
                                        className={cn(
                                            isActive ? 'text-white' : 'text-[#49659c] dark:text-gray-400'
                                        )}
                                    />
                                    <span className="flex-1">{item.label}</span>
                                </a>
                            ) : (
                                <Link
                                    href={item.href!}
                                    className={cn(
                                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                                        isActive
                                            ? 'bg-[#0d59f2] text-white shadow-lg shadow-blue-500/20'
                                            : 'text-[#0d121c] hover:bg-[#e7ebf4] dark:text-gray-300 dark:hover:bg-gray-800'
                                    )}
                                >
                                    <item.icon
                                        size={20}
                                        className={cn(
                                            isActive ? 'text-white' : 'text-[#49659c] dark:text-gray-400'
                                        )}
                                    />
                                    <span className="flex-1">{item.label}</span>
                                </Link>
                            )}
                        </div>
                    );
                })}
            </nav>

            <div className="space-y-2 border-t border-gray-200 p-4 dark:border-gray-800">
                <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-2 dark:border-gray-800 dark:bg-gray-900">
                    <div className="flex size-8 flex-shrink-0 items-center justify-center rounded-full bg-[#0d59f2]/10 text-sm font-bold text-[#0d59f2]">
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                        <p className="truncate text-xs font-bold leading-tight text-[#0d121c] dark:text-white">
                            {user?.name || 'User'}
                        </p>
                        <p className="text-[10px] capitalize text-[#49659c] dark:text-gray-400">
                            {user?.role || 'User'}
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={async () => {
                        await handleLogout(dispatch, logout, router);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg border border-red-200 px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-800/50 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                    <LogOut size={18} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
}
