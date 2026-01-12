"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Settings, ChevronDown, Building2, Check } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/lib/hooks';
import { setSelectedFranchise, setActiveTab } from '@/lib/features/auth/authSlice';
import { cn } from '@/lib/utils';

export function Header() {
    const { franchiseList, selectedFranchise, activeTab, user } = useAppSelector((state) => state.auth);
    const dispatch = useAppDispatch();
    const [isOpen, setIsOpen] = useState(false);
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
                {user?.role === 'admin' && (
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="flex items-center gap-2 px-4 py-2 bg-[#f8f9fc] dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm font-medium text-[#0d121c] dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all active:scale-[0.98]"
                        >
                            <Building2 size={18} className="text-[#49659c]" />
                            <span className="max-w-[150px] truncate">{selectedFranchise?.name || 'Select Franchise'}</span>
                            <ChevronDown size={18} className={cn("text-[#49659c] transition-transform duration-200", isOpen && "rotate-180")} />
                        </button>

                        {isOpen && (
                            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#1a2234] border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl z-50 py-2 animate-in fade-in zoom-in duration-200">
                                <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
                                    <p className="text-[10px] uppercase font-bold text-[#49659c] tracking-wider">Select Franchise</p>
                                </div>
                                <div className="max-h-[300px] overflow-y-auto">
                                    {franchiseList.map((franchise) => (
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
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "size-2 rounded-full",
                                                    selectedFranchise?._id === franchise._id ? "bg-[#0d59f2]" : "bg-gray-300 dark:bg-gray-600"
                                                )} />
                                                <span className="truncate">{franchise.name}</span>
                                            </div>
                                            {selectedFranchise?._id === franchise._id && <Check size={16} />}
                                        </button>
                                    ))}
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
