"use client";

import React from 'react';
import { useAppSelector, useAppDispatch } from '@/lib/hooks';
import { setSelectedFranchise, toggleFranchiseStatus, deleteFranchise } from '@/lib/features/franchise/franchiseSlice';
import {
    ArrowLeft,
    Edit2,
    Trash2,
    Ban,
    CheckCircle,
    Mail,
    Phone,
    MapPin,
    User,
    Users,
    Truck
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function FranchiseDetails() {
    const { selectedFranchise } = useAppSelector((state) => state.franchise);
    const dispatch = useAppDispatch();

    if (!selectedFranchise) return null;

    return (
        <div className="flex flex-col gap-8 animate-in slide-in-from-right duration-500">
            {/* Top Bar with back button and actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => dispatch(setSelectedFranchise(null))}
                        className="p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-[#49659c] hover:text-[#0d121c] dark:hover:text-white transition-all shadow-sm"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white">{selectedFranchise.name}</h2>
                            <span className={cn(
                                "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider",
                                selectedFranchise.status === 'active' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                            )}>
                                {selectedFranchise.status}
                            </span>
                        </div>
                        <p className="text-[#49659c] dark:text-gray-400 text-sm">{selectedFranchise.code}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => dispatch(toggleFranchiseStatus(selectedFranchise._id))}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                            selectedFranchise.status === 'active'
                                ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                                : "bg-green-100 text-green-700 hover:bg-green-200"
                        )}
                    >
                        {selectedFranchise.status === 'active' ? <Ban size={18} /> : <CheckCircle size={18} />}
                        <span>{selectedFranchise.status === 'active' ? 'Block' : 'Unblock'}</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
                        <Edit2 size={18} />
                        <span>Edit</span>
                    </button>
                    <button
                        onClick={() => {
                            if (confirm('Are you sure you want to delete this franchise?')) {
                                dispatch(deleteFranchise(selectedFranchise._id));
                                dispatch(setSelectedFranchise(null));
                            }
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm font-bold hover:bg-red-200 transition-all"
                    >
                        <Trash2 size={18} />
                        <span>Delete</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Basic Info and Images */}
                <div className="lg:col-span-2 flex flex-col gap-8">
                    {/* Main Image and Desc */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
                        <div className="h-64 w-full bg-gray-100 dark:bg-gray-800 relative">
                            {selectedFranchise.image ? (
                                <div className="absolute inset-0 bg-[#0d59f2]/10 flex items-center justify-center text-[#0d59f2] text-lg font-bold">
                                    [ Franchise Image Placeholder ]
                                </div>
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-[#49659c]">
                                    No Image Provided
                                </div>
                            )}
                        </div>
                        <div className="p-8">
                            <h3 className="text-xl font-bold text-[#0d121c] dark:text-white mb-4">About this Franchise</h3>
                            <p className="text-[#49659c] dark:text-gray-400 leading-relaxed">
                                {selectedFranchise.description || "No description provided for this franchise location."}
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-8 border-t border-gray-50 dark:border-gray-800">
                                <div className="flex gap-4">
                                    <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-[#0d59f2]">
                                        <MapPin size={24} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-[#49659c] uppercase tracking-wider">Address</p>
                                        <p className="text-sm font-semibold dark:text-gray-200 mt-1">{selectedFranchise.address}</p>
                                        <p className="text-sm text-[#49659c]">{selectedFranchise.location}</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600">
                                        <User size={24} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-[#49659c] uppercase tracking-wider">Incharge Name</p>
                                        <p className="text-sm font-semibold dark:text-gray-200 mt-1">{selectedFranchise.inchargeName}</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600">
                                        <Mail size={24} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-[#49659c] uppercase tracking-wider">Email Contact</p>
                                        <p className="text-sm font-semibold dark:text-gray-200 mt-1">{selectedFranchise.email}</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600">
                                        <Phone size={24} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-[#49659c] uppercase tracking-wider">Phone Number</p>
                                        <p className="text-sm font-semibold dark:text-gray-200 mt-1">{selectedFranchise.phone}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Team Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Staff List */}
                        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
                            <div className="px-6 py-4 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                                <div className="flex items-center gap-2">
                                    <Users size={18} className="text-[#0d59f2]" />
                                    <h4 className="font-bold text-[#0d121c] dark:text-white">Staff Team</h4>
                                </div>
                                <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{selectedFranchise.staff.length} Members</span>
                            </div>
                            <div className="p-6 flex flex-col gap-4 max-h-[300px] overflow-y-auto">
                                {selectedFranchise.staff.map(member => (
                                    <div key={member._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 transition-hover hover:scale-[1.02]">
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-full bg-[#0d59f2]/10 flex items-center justify-center text-[#0d59f2] font-bold text-xs">
                                                {member.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold dark:text-white">{member.name}</p>
                                                <p className="text-[10px] text-[#49659c] font-medium uppercase tracking-wider">{member.role}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {selectedFranchise.staff.length === 0 && <p className="text-center text-xs text-[#49659c] py-4">No staff assigned yet.</p>}
                            </div>
                        </div>

                        {/* Drivers List */}
                        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
                            <div className="px-6 py-4 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                                <div className="flex items-center gap-2">
                                    <Truck size={18} className="text-green-600" />
                                    <h4 className="font-bold text-[#0d121c] dark:text-white">Fleet Drivers</h4>
                                </div>
                                <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded">{selectedFranchise.drivers.length} Drivers</span>
                            </div>
                            <div className="p-6 flex flex-col gap-4 max-h-[300px] overflow-y-auto">
                                {selectedFranchise.drivers.map(driver => (
                                    <div key={driver._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 transition-hover hover:scale-[1.02]">
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-xs">
                                                {driver.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold dark:text-white">{driver.name}</p>
                                                <p className="text-[10px] text-[#49659c] font-medium uppercase tracking-wider">Driver</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {selectedFranchise.drivers.length === 0 && <p className="text-center text-xs text-[#49659c] py-4">No drivers assigned yet.</p>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Quick Stats/Activity */}
                <div className="flex flex-col gap-8">
                    <div className="bg-[#0d121c] dark:bg-black rounded-2xl p-8 text-white shadow-xl shadow-[#0d59f2]/10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 transition-opacity group-hover:opacity-20">
                            <Store size={120} />
                        </div>
                        <h4 className="text-blue-400 text-xs font-black uppercase tracking-[0.2em] mb-2">Performance Summary</h4>
                        <p className="text-2xl font-bold mb-8">Active Operations</p>

                        <div className="space-y-6">
                            <div className="flex justify-between items-center py-4 border-b border-white/10">
                                <span className="text-gray-400 text-sm">Total Orders</span>
                                <span className="text-xl font-bold">1,284</span>
                            </div>
                            <div className="flex justify-between items-center py-4 border-b border-white/10">
                                <span className="text-gray-400 text-sm">Revenue</span>
                                <span className="text-xl font-bold text-green-400">$12,450.00</span>
                            </div>
                            <div className="flex justify-between items-center py-4">
                                <span className="text-gray-400 text-sm">Reliability</span>
                                <span className="text-xl font-bold text-blue-400">98.2%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Store({ size, className }: { size: number, className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
            <path d="M2 7h20" />
            <path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 10V7" />
        </svg>
    )
}
