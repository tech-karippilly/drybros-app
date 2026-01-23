"use client";

import React, { useState, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '@/lib/hooks';
import {
    setSelectedStaff,
    setStaffFilters,
    setStaffPage,
    updateStaffMemberStatus
} from '@/lib/features/staff/staffSlice';
import { useToast } from '@/components/ui/toast';
import {
    Plus,
    Search,
    Filter as FilterIcon,
    ChevronLeft,
    ChevronRight,
    X,
    Mail,
    Phone,
    User,
    AlertCircle,
    Edit2,
    Flame,
    Ban
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Staff } from '@/lib/types/staff';
import { FireModal, SuspendModal } from './ActionModals';
import { StatusBadge } from './StatusBadge';

interface StaffListProps {
    onCreateClick: () => void;
    onEditClick: (staff: Staff) => void;
}

export function StaffList({ onCreateClick, onEditClick }: StaffListProps) {
    const { list, filters, pagination } = useAppSelector((state) => state.staff);
    const { list: franchises } = useAppSelector((state) => state.franchise);
    const dispatch = useAppDispatch();
    const { toast } = useToast();
    const [showFilters, setShowFilters] = useState(false);

    // Modal state
    const [fireTarget, setFireTarget] = useState<Staff | null>(null);
    const [suspendTarget, setSuspendTarget] = useState<Staff | null>(null);

    // Create a map of franchiseId to franchise code for quick lookup
    const franchiseCodeMap = useMemo(() => {
        const map = new Map<string, string>();
        franchises.forEach(franchise => {
            map.set(franchise._id, franchise.code);
        });
        return map;
    }, [franchises]);

    // Filter Logic
    const filteredList = useMemo(() => {
        return list.filter(item => {
            const matchesName = item.name.toLowerCase().includes(filters.name.toLowerCase());
            const matchesEmail = item.email.toLowerCase().includes(filters.email.toLowerCase());
            const matchesPhone = item.phone.includes(filters.phone);
            const matchesStatus = filters.status === 'all' || item.status === filters.status;
            const matchesFranchise = filters.franchiseId === 'all' || item.franchiseId === filters.franchiseId;

            // Salary filter: simple numeric comparison (greater than or equal to)
            const matchesSalary = filters.salary === '' || item.salary >= parseInt(filters.salary);

            return matchesName && matchesEmail && matchesPhone && matchesStatus && matchesSalary && matchesFranchise;
        });
    }, [list, filters]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredList.length / pagination.itemsPerPage);
    const paginatedList = useMemo(() => {
        const start = (pagination.currentPage - 1) * pagination.itemsPerPage;
        return filteredList.slice(start, start + pagination.itemsPerPage);
    }, [filteredList, pagination]);

    const handleFilterChange = (key: keyof typeof filters, value: string) => {
        dispatch(setStaffFilters({ [key]: value }));
    };

    const clearFilters = () => {
        dispatch(setStaffFilters({
            name: '',
            salary: '',
            status: 'all',
            email: '',
            phone: '',
            franchiseId: 'all'
        }));
    };


    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white">Staff Directory</h2>
                    <p className="text-[#49659c] dark:text-gray-400">Manage your workforce, track salaries, and monitor employment status.</p>
                </div>
                <button
                    onClick={onCreateClick}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-[#0d59f2] text-white rounded-lg font-bold hover:bg-[#0d59f2]/90 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                >
                    <Plus size={18} />
                    <span>Create Staff</span>
                </button>
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-4 bg-white dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#49659c] size-4" />
                        <input
                            type="text"
                            value={filters.name}
                            onChange={(e) => handleFilterChange('name', e.target.value)}
                            placeholder="Search by name..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-all",
                                showFilters || filters.status !== 'all' || filters.salary !== '' || filters.email !== '' || filters.phone !== '' || filters.franchiseId !== 'all'
                                    ? "bg-[#0d59f2]/10 border-[#0d59f2] text-[#0d59f2]"
                                    : "border-gray-200 dark:border-gray-800 text-[#49659c] hover:bg-gray-50 dark:hover:bg-gray-800"
                            )}
                        >
                            <FilterIcon size={16} />
                            <span>Advanced Filters</span>
                        </button>
                        {(filters.name !== '' || filters.status !== 'all' || filters.salary !== '' || filters.email !== '' || filters.phone !== '' || filters.franchiseId !== 'all') && (
                            <button
                                onClick={clearFilters}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                title="Clear All Filters"
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Advanced Filters Panel */}
                {showFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800 animate-in slide-in-from-top-2 duration-300">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#49659c]">Franchise</label>
                            <select
                                value={filters.franchiseId}
                                onChange={(e) => handleFilterChange('franchiseId', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white"
                            >
                                <option value="all">All Franchises</option>
                                {franchises.map(franchise => (
                                    <option key={franchise._id} value={franchise._id}>
                                        {franchise.name} ({franchise.code})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#49659c]">Email</label>
                            <input
                                type="text"
                                value={filters.email}
                                onChange={(e) => handleFilterChange('email', e.target.value)}
                                placeholder="Search email..."
                                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#49659c]">Phone</label>
                            <input
                                type="text"
                                value={filters.phone}
                                onChange={(e) => handleFilterChange('phone', e.target.value)}
                                placeholder="Search phone..."
                                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#49659c]">Min Salary</label>
                            <input
                                type="number"
                                value={filters.salary}
                                onChange={(e) => handleFilterChange('salary', e.target.value)}
                                placeholder="Min salary..."
                                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#49659c]">Status</label>
                            <select
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="block">Blocked</option>
                                <option value="fired">Fired</option>
                                <option value="suspended">Suspended</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#49659c]">Staff</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#49659c]">Contact</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#49659c]">Franchise Code</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#49659c]">Salary</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#49659c]">Status</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#49659c]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {paginatedList.map((staff) => (
                                <tr key={staff._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded-full bg-[#0d59f2]/10 flex items-center justify-center text-[#0d59f2] font-bold">
                                                {staff.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-[#0d121c] dark:text-white">{staff.name}</p>
                                                <p className="text-[10px] text-[#49659c] font-black uppercase tracking-tighter">{staff._id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1.5 text-xs text-[#49659c]">
                                                <Mail size={12} />
                                                <span>{staff.email}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-[#49659c]">
                                                <Phone size={12} />
                                                <span>{staff.phone}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-[#49659c] dark:text-gray-300">
                                        {staff.franchises_code || franchiseCodeMap.get(staff.franchiseId) || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-bold text-[#0d121c] dark:text-white">
                                        <div className="flex items-center gap-1">
                                            <span className="text-green-600 font-bold">₹</span>
                                            <span>{staff.salary.toLocaleString()}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={staff.status} duration={staff.suspensionDuration} />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => dispatch(setSelectedStaff(staff))}
                                                className="p-2 text-[#49659c] hover:text-[#0d59f2] hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                                            >
                                                <User size={18} />
                                            </button>
                                            <button
                                                onClick={() => onEditClick(staff)}
                                                className="p-2 text-[#49659c] hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all"
                                                title="Edit"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            {staff.status !== 'suspended' && (
                                                <button
                                                    onClick={() => setSuspendTarget(staff)}
                                                    className="p-2 text-[#49659c] hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-all"
                                                    title="Suspend"
                                                >
                                                    <Ban size={18} />
                                                </button>
                                            )}
                                            {staff.status !== 'fired' && (
                                                <button
                                                    onClick={() => setFireTarget(staff)}
                                                    className="p-2 text-[#49659c] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                    title="Fire"
                                                >
                                                    <Flame size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredList.length === 0 && (
                    <div className="py-20 text-center">
                        <div className="size-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle size={32} className="text-[#49659c]" />
                        </div>
                        <h3 className="text-lg font-bold dark:text-white">No staff found</h3>
                        <p className="text-[#49659c] mt-1 max-w-xs mx-auto">Try adjusting your filters or search term to find what you&apos;re looking for.</p>
                        <button onClick={clearFilters} className="mt-6 text-[#0d59f2] font-bold text-sm hover:underline">
                            Reset all filters
                        </button>
                    </div>
                )}

                {/* Pagination */}
                {filteredList.length > 0 && (
                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <p className="text-xs text-[#49659c] font-medium">
                            Showing <span className="text-[#0d121c] dark:text-white font-bold">{Math.min(filteredList.length, (pagination.currentPage - 1) * pagination.itemsPerPage + 1)}</span> to <span className="text-[#0d121c] dark:text-white font-bold">{Math.min(filteredList.length, pagination.currentPage * pagination.itemsPerPage)}</span> of <span className="text-[#0d121c] dark:text-white font-bold">{filteredList.length}</span> employees
                        </p>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => dispatch(setStaffPage(Math.max(1, pagination.currentPage - 1)))}
                                disabled={pagination.currentPage === 1}
                                className="p-2 border border-gray-200 dark:border-gray-800 rounded-lg text-[#49659c] hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: totalPages }).map((_, i) => (
                                    <button
                                        key={i + 1}
                                        onClick={() => dispatch(setStaffPage(i + 1))}
                                        className={cn(
                                            "size-9 rounded-lg text-xs font-bold transition-all",
                                            pagination.currentPage === i + 1
                                                ? "bg-[#0d59f2] text-white shadow-lg shadow-blue-500/20"
                                                : "text-[#49659c] hover:bg-white dark:hover:bg-gray-800 border border-transparent hover:border-gray-200 dark:hover:border-gray-800"
                                        )}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => dispatch(setStaffPage(Math.min(totalPages, pagination.currentPage + 1)))}
                                disabled={pagination.currentPage === totalPages}
                                className="p-2 border border-gray-200 dark:border-gray-800 rounded-lg text-[#49659c] hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Action Modals */}
            <FireModal
                isOpen={!!fireTarget}
                staffName={fireTarget?.name || ""}
                onClose={() => setFireTarget(null)}
                onConfirm={async () => {
                    if (fireTarget) {
                        try {
                            const staffId = fireTarget.id || fireTarget._id || '';
                            await dispatch(updateStaffMemberStatus({
                                id: staffId,
                                data: { status: 'FIRED' }
                            })).unwrap();
                            toast({
                                title: 'Success',
                                description: `${fireTarget.name} has been fired`,
                                variant: 'success',
                            });
                            setFireTarget(null);
                        } catch (error: any) {
                            toast({
                                title: 'Error',
                                description: error?.message || 'Failed to fire staff member',
                                variant: 'error',
                            });
                        }
                    }
                }}
            />

            <SuspendModal
                isOpen={!!suspendTarget}
                staffName={suspendTarget?.name || ""}
                onClose={() => setSuspendTarget(null)}
                onConfirm={async (duration) => {
                    if (suspendTarget) {
                        try {
                            const staffId = suspendTarget.id || suspendTarget._id || '';
                            // Parse duration to Date (assuming format like "7 days", "1 month", etc.)
                            let suspendedUntil: Date | null = null;
                            if (duration) {
                                const days = parseInt(duration.split(' ')[0]) || 7;
                                suspendedUntil = new Date();
                                suspendedUntil.setDate(suspendedUntil.getDate() + days);
                            }
                            
                            await dispatch(updateStaffMemberStatus({
                                id: staffId,
                                data: { 
                                    status: 'SUSPENDED',
                                    suspendedUntil: suspendedUntil?.toISOString() || null
                                }
                            })).unwrap();
                            toast({
                                title: 'Success',
                                description: `${suspendTarget.name} has been suspended`,
                                variant: 'success',
                            });
                            setSuspendTarget(null);
                        } catch (error: any) {
                            toast({
                                title: 'Error',
                                description: error?.message || 'Failed to suspend staff member',
                                variant: 'error',
                            });
                        }
                    }
                }}
            />
        </div>
    );
}
