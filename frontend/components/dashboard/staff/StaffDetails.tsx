"use client";

import React from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { setSelectedStaff } from '@/lib/features/staff/staffSlice';
import {
    ArrowLeft,
    Mail,
    Phone,
    MapPin,
    Clock,
    Calendar,
    Users,
    Briefcase,
    Shield,
    Heart,
    FileCheck,
    Edit2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function StaffDetails({ onEditClick }: { onEditClick: () => void }) {
    const dispatch = useAppDispatch();
    const { selectedStaff } = useAppSelector((state) => state.staff);

    if (!selectedStaff) return null;

    const stats = [
        { label: 'Customers Attended', value: selectedStaff.customersAttended, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Leaves Taken', value: selectedStaff.leaveTaken, icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Current Status', value: selectedStaff.attendanceStatus, icon: Clock, color: 'text-green-600', bg: 'bg-green-50' },
    ];

    return (
        <div className="flex flex-col gap-8 animate-in slide-in-from-right duration-500">
            {/* Top Navigation */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => dispatch(setSelectedStaff(null))}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-[#49659c] hover:text-[#0d121c] dark:hover:text-white transition-all shadow-sm group"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-bold">Back to Directory</span>
                </button>
                <div className="flex items-center gap-3">
                    <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                        selectedStaff.status === 'active' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    )}>
                        {selectedStaff.status}
                    </span>
                    <button
                        onClick={onEditClick}
                        className="p-2.5 bg-[#0d59f2] text-white rounded-xl hover:bg-[#0d59f2]/90 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                    >
                        <Edit2 size={18} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-8 shadow-sm">
                        <div className="flex flex-col items-center text-center">
                            <div className="size-32 rounded-3xl bg-[#0d59f2]/10 border-4 border-white dark:border-gray-800 shadow-xl flex items-center justify-center text-[#0d59f2] text-4xl font-black mb-6">
                                {selectedStaff.name.charAt(0)}
                            </div>
                            <h3 className="text-2xl font-black text-[#0d121c] dark:text-white">{selectedStaff.name}</h3>
                            <p className="text-[#49659c] font-bold uppercase tracking-widest text-[10px] mt-1">{selectedStaff.franchises_code}</p>

                            <div className="w-full mt-8 pt-8 border-t border-gray-50 dark:border-gray-800 space-y-4 text-left">
                                <div className="flex items-center gap-3">
                                    <div className="size-8 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-[#49659c]">
                                        <Mail size={16} />
                                    </div>
                                    <span className="text-sm font-bold text-[#0d121c] dark:text-white truncate">{selectedStaff.email}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="size-8 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-[#49659c]">
                                        <Phone size={16} />
                                    </div>
                                    <span className="text-sm font-bold text-[#0d121c] dark:text-white">{selectedStaff.phone}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="size-8 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-[#49659c]">
                                        <MapPin size={16} />
                                    </div>
                                    <span className="text-sm font-bold text-[#0d121c] dark:text-white leading-tight">{selectedStaff.address}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Salary Glance */}
                    <div className="bg-[#0d121c] dark:bg-black rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 transition-opacity group-hover:opacity-20 translate-x-4 -translate-y-4">
                            <Briefcase size={120} />
                        </div>
                        <h4 className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Compensation</h4>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black italic">₹</span>
                            <span className="text-4xl font-black">{selectedStaff.salary.toLocaleString()}</span>
                        </div>
                        <p className="text-[#49659c] text-xs font-bold mt-2">Monthly Net CTC</p>
                    </div>
                </div>

                {/* Dashboard & Metrics */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Performance Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {stats.map((stat, i) => (
                            <div key={i} className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col gap-4">
                                <div className={cn("size-12 rounded-2xl flex items-center justify-center", stat.bg, stat.color)}>
                                    <stat.icon size={24} />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-[#49659c] uppercase tracking-widest">{stat.label}</p>
                                    <p className="text-3xl font-black text-[#0d121c] dark:text-white mt-1 capitalize">{stat.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Information Grids */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Emergency & Relations */}
                        <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <Heart className="text-red-500" size={20} />
                                <h4 className="font-black text-[#0d121c] dark:text-white uppercase tracking-widest text-xs">Emergency Contact</h4>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <p className="text-[10px] font-black text-[#49659c] uppercase tracking-tight">Relation</p>
                                    <p className="font-bold text-[#0d121c] dark:text-white mt-1">{selectedStaff.relationship}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-[#49659c] uppercase tracking-tight">Phone Number</p>
                                    <p className="font-bold text-[#0d121c] dark:text-white mt-1 tracking-wider">{selectedStaff.emergencyContact}</p>
                                </div>
                            </div>
                        </div>

                        {/* Documents */}
                        <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <Shield className="text-[#0d59f2]" size={20} />
                                <h4 className="font-black text-[#0d121c] dark:text-white uppercase tracking-widest text-xs">Credential Status</h4>
                            </div>
                            <div className="space-y-3">
                                {selectedStaff.documentsCollected.map((doc, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                                        <FileCheck size={16} className="text-green-600" />
                                        <span className="text-sm font-bold text-[#49659c] dark:text-gray-300">{doc}</span>
                                    </div>
                                ))}
                                {selectedStaff.documentsCollected.length === 0 && (
                                    <p className="text-sm text-[#49659c] italic">No documents verified yet.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
