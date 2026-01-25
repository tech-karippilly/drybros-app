"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Settings, ChevronDown, Building2, Check, Loader2 } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/lib/hooks';
import { setSelectedFranchise, setFranchiseList, setActiveTab } from '@/lib/features/auth/authSlice';
import { getFranchiseList, FranchiseResponse } from '@/lib/features/franchise/franchiseApi';
import { Franchise } from '@/lib/types/franchise';
import { USER_ROLES } from '@/lib/constants/roles';
import { cn } from '@/lib/utils';

export function Header() {
    const { franchiseList, selectedFranchise, activeTab, user } = useAppSelector((state) => state.auth);
    const dispatch = useAppDispatch();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoadingFranchises, setIsLoadingFranchises] = useState(false);
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
                fetchFranchises();
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.role]);

    const fetchFranchises = async () => {
        try {
            setIsLoadingFranchises(true);
            const franchises = await getFranchiseList();
            
            // Map API response to Franchise type
            const mappedFranchises: Franchise[] = franchises.map((franchise: FranchiseResponse) => ({
                _id: franchise.id,
                code: franchise.code,
                name: franchise.name,
                address: franchise.address || '',
                location: franchise.region || franchise.city || '',
                email: '', // Not in API response
                phone: franchise.phone || '',
                staffCount: 0, // Not in API response
                driverCount: 0, // Not in API response
                image: franchise.storeImage || undefined,
                description: undefined,
                inchargeName: franchise.inchargeName || '',
                staff: [],
                drivers: [],
                status: franchise.isActive ? 'active' : 'blocked',
            }));

            dispatch(setFranchiseList(mappedFranchises));
            
            // Auto-select first franchise if none selected
            if (!selectedFranchise && mappedFranchises.length > 0) {
                dispatch(setSelectedFranchise(mappedFranchises[0]));
            }
        } catch (error) {
            console.error('Failed to fetch franchises:', error);
        } finally {
            setIsLoadingFranchises(false);
        }
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
                {(user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.MANAGER) && (
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => {
                                if (!isOpen && franchiseList.length === 0) {
                                    fetchFranchises();
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
                                        onClick={fetchFranchises}
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
                                                onClick={fetchFranchises}
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
                    </div>
                )}

                <button
                    onClick={() => dispatch(setActiveTab('notifications'))}
                    className={cn(
                        "relative p-2 transition-all rounded-full group",
                        activeTab === 'notifications'
                            ? "bg-[#0d59f2]/10 text-[#0d59f2]"
                            : "text-[#49659c] hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                >
                    <Bell size={20} className="group-hover:rotate-12 transition-transform" />
                    <span className="absolute top-1.5 right-1.5 size-2 bg-red-500 rounded-full border-2 border-white dark:border-[#101622]"></span>
                </button>

                <button
                    onClick={() => dispatch(setActiveTab('settings'))}
                    className={cn(
                        "p-2 transition-all rounded-full group",
                        activeTab === 'settings'
                            ? "bg-[#0d59f2]/10 text-[#0d59f2]"
                            : "text-[#49659c] hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                >
                    <Settings size={20} className="group-hover:rotate-90 transition-transform duration-500" />
                </button>
            </div>
        </header>
    );
}
