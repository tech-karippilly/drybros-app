"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Bell, Settings, ChevronDown, Building2, Check, Loader2, RefreshCw } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/lib/hooks';
import { setSelectedFranchise, setFranchiseList, triggerDashboardRefresh } from '@/lib/features/auth/authSlice';
import { DASHBOARD_ROUTES } from '@/lib/constants/routes';
import { getFranchiseList, FranchiseResponse } from '@/lib/features/franchise/franchiseApi';
import { Franchise } from '@/lib/types/franchise';
import { USER_ROLES } from '@/lib/constants/roles';
import { cn } from '@/lib/utils';
import { fetchFranchises } from '@/lib/features/franchise/franchiseSlice';

export function Header() {
    const { franchiseList, selectedFranchise, user } = useAppSelector((state) => state.auth);
    const dispatch = useAppDispatch();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoadingFranchises, setIsLoadingFranchises] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        // Fetch franchises from API when component mounts (only if list is empty or contains dummy data)
        // Admin and Manager can see franchise selector
        if (user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.MANAGER) {
            // Check if franchiseList is empty or contains dummy data (dummy data has _id starting with 'fran_')
            const hasDummyData = franchiseList.length > 0 && franchiseList.some(f => f._id.startsWith('fran_'));
            if (franchiseList.length === 0 || hasDummyData) {
                loadFranchises();
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.role]);

    // Auto-select manager's franchise when franchises are loaded
    useEffect(() => {
        if (user?.role === USER_ROLES.MANAGER && user?.franchise_id && franchiseList.length > 0) {
            const managerFranchise = franchiseList.find(f => f._id === user.franchise_id);
            if (managerFranchise && selectedFranchise?._id !== managerFranchise._id) {
                dispatch(setSelectedFranchise(managerFranchise));
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [franchiseList, user?.franchise_id, user?.role]);

    const loadFranchises = async () => {
        try {
            setIsLoadingFranchises(true);
            // Use the franchise slice's fetchFranchises to ensure consistency
            const franchises = await dispatch(fetchFranchises()).unwrap();
            // Sync franchises to auth slice (even if empty, to clear dummy data)
            dispatch(setFranchiseList(franchises));
        } catch (error) {
            console.error('Failed to fetch franchises:', error);
        } finally {
            setIsLoadingFranchises(false);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        // Trigger dashboard refresh by updating refreshTrigger timestamp
        dispatch(triggerDashboardRefresh());
        // Small delay to show refresh animation
        setTimeout(() => {
            setIsRefreshing(false);
        }, 500);
    };

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
                {/* Refresh Button */}
                <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className={cn(
                        "rounded-full p-2 transition-all group",
                        isRefreshing
                            ? "bg-[#0d59f2]/10 text-[#0d59f2] cursor-wait"
                            : "text-[#49659c] hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                    title="Refresh Dashboard Data"
                >
                    <RefreshCw size={20} className={cn("duration-500 transition-transform", isRefreshing && "animate-spin")} />
                </button>

                {(user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.MANAGER) && (
                    <div className="relative" ref={dropdownRef}>
                        {user?.role === USER_ROLES.MANAGER ? (
                            // Manager: Show only their franchise (no dropdown)
                            <div className="flex items-center gap-2 px-4 py-2 bg-[#f8f9fc] dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm font-medium text-[#0d121c] dark:text-white">
                                <Building2 size={18} className="text-[#49659c]" />
                                {isLoadingFranchises ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin text-[#49659c]" />
                                        <span className="max-w-[150px] truncate">Loading...</span>
                                    </>
                                ) : (
                                    <span className="max-w-[150px] truncate">
                                        {selectedFranchise?.name || user?.franchise_name || 'Franchise'}
                                    </span>
                                )}
                            </div>
                        ) : (
                            // Admin: Show dropdown with franchise selector
                            <>
                                <button
                                    onClick={() => {
                                        if (!isOpen && franchiseList.length === 0) {
                                            loadFranchises();
                                        }
                                        setIsOpen(!isOpen);
                                    }}
                                    disabled={isLoadingFranchises}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#f8f9fc] dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm font-medium text-[#0d121c] dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Building2 size={18} className="text-[#49659c]" />
                                    {isLoadingFranchises ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin text-[#49659c]" />
                                            <span className="max-w-[150px] truncate">Loading...</span>
                                        </>
                                    ) : (
                                        <span className="max-w-[150px] truncate">{selectedFranchise?.name || 'Select Franchise'}</span>
                                    )}
                                    <ChevronDown size={18} className={cn("text-[#49659c] transition-transform duration-200", isOpen && "rotate-180")} />
                                </button>

                                {isOpen && (
                                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#1a2234] border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl z-50 py-2 animate-in fade-in zoom-in duration-200">
                                        <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                            <p className="text-[10px] uppercase font-bold text-[#49659c] tracking-wider">Select Franchise</p>
                                            <button
                                                onClick={loadFranchises}
                                                className="text-xs text-[#0d59f2] hover:underline"
                                                title="Refresh"
                                            >
                                                Refresh
                                            </button>
                                        </div>
                                        <div className="max-h-[300px] overflow-y-auto">
                                            {isLoadingFranchises ? (
                                                <div className="flex items-center justify-center py-8">
                                                    <Loader2 className="size-5 animate-spin text-[#0d59f2]" />
                                                </div>
                                            ) : franchiseList.length === 0 ? (
                                                <div className="px-4 py-8 text-center">
                                                    <p className="text-sm text-[#49659c]">No franchises found</p>
                                                    <button
                                                        onClick={loadFranchises}
                                                        className="mt-2 text-xs text-[#0d59f2] hover:underline"
                                                    >
                                                        Try again
                                                    </button>
                                                </div>
                                            ) : (
                                                franchiseList.map((franchise) => (
                                                    <button
                                                        key={franchise._id}
                                                        onClick={() => {
                                                            dispatch(setSelectedFranchise(franchise));
                                                            setIsOpen(false);
                                                        }}
                                                        className={cn(
                                                            "w-full flex items-center justify-between px-4 py-3 text-sm transition-colors hover:bg-[#f8f9fc] dark:hover:bg-gray-800/50",
                                                            selectedFranchise?._id === franchise._id ? "text-[#0d59f2] font-semibold" : "text-[#0d121c] dark:text-gray-300"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                                            <div className={cn(
                                                                "size-2 rounded-full flex-shrink-0",
                                                                selectedFranchise?._id === franchise._id ? "bg-[#0d59f2]" : "bg-gray-300 dark:bg-gray-600"
                                                            )} />
                                                            <div className="flex-1 min-w-0">
                                                                <span className="block truncate">{franchise.name}</span>
                                                                {franchise.code && (
                                                                    <span className="block text-xs text-[#49659c] truncate">{franchise.code}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {selectedFranchise?._id === franchise._id && <Check size={16} className="flex-shrink-0" />}
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                <Link
                    href={DASHBOARD_ROUTES.NOTIFICATIONS}
                    className={cn(
                        'relative rounded-full p-2 transition-all group',
                        pathname === DASHBOARD_ROUTES.NOTIFICATIONS
                            ? 'bg-[#0d59f2]/10 text-[#0d59f2]'
                            : 'text-[#49659c] hover:bg-gray-100 dark:hover:bg-gray-800'
                    )}
                >
                    <Bell size={20} className="transition-transform group-hover:rotate-12" />
                    <span className="absolute right-1.5 top-1.5 size-2 rounded-full border-2 border-white bg-red-500 dark:border-[#101622]" />
                </Link>

                <Link
                    href={DASHBOARD_ROUTES.SETTINGS}
                    className={cn(
                        'rounded-full p-2 transition-all group',
                        pathname === DASHBOARD_ROUTES.SETTINGS
                            ? 'bg-[#0d59f2]/10 text-[#0d59f2]'
                            : 'text-[#49659c] hover:bg-gray-100 dark:hover:bg-gray-800'
                    )}
                >
                    <Settings size={20} className="duration-500 transition-transform group-hover:rotate-90" />
                </Link>
            </div>
        </header>
    );
}
