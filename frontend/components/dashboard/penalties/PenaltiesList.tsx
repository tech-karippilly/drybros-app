"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '@/lib/hooks';
import { fetchPenalties, deletePenalty, setSelectedPenalty } from '@/lib/features/penalties/penaltiesSlice';
import { Search, Plus, Edit2, Trash2, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Penalty } from '@/lib/types/penalties';
import { PENALTIES_STRINGS, PENALTY_TYPES } from '@/lib/constants/penalties';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

interface PenaltiesListProps {
    onCreateClick: () => void;
    onEditClick: (penalty: Penalty) => void;
    onApplyClick: (penalty: Penalty) => void;
}

export function PenaltiesList({ onCreateClick, onEditClick, onApplyClick }: PenaltiesListProps) {
    const { penalties, isLoading } = useAppSelector((state) => state.penalties);
    const dispatch = useAppDispatch();
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | 'PENALTY' | 'DEDUCTION'>('all');
    const [deleteTarget, setDeleteTarget] = useState<Penalty | null>(null);

    useEffect(() => {
        dispatch(fetchPenalties());
    }, [dispatch]);

    const filteredPenalties = useMemo(() => {
        return penalties.filter((penalty) => {
            const matchesSearch = penalty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                penalty.description?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = typeFilter === 'all' || penalty.type === typeFilter;
            return matchesSearch && matchesType;
        });
    }, [penalties, searchTerm, typeFilter]);

    const handleDelete = useCallback(() => {
        if (deleteTarget) {
            dispatch(deletePenalty(deleteTarget.id));
            setDeleteTarget(null);
        }
    }, [deleteTarget, dispatch]);

    return (
        <div className="flex flex-col gap-4 sm:gap-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-[#0d121c] dark:text-white">{PENALTIES_STRINGS.LIST_TITLE}</h2>
                    <p className="text-sm sm:text-base text-[#49659c] dark:text-gray-400">Manage penalties and deductions with fixed amounts.</p>
                </div>
                <Button onClick={onCreateClick} variant="primary" className="w-full sm:w-auto">
                    <Plus size={18} className="mr-2" />
                    <span className="hidden sm:inline">{PENALTIES_STRINGS.CREATE_NEW}</span>
                    <span className="sm:hidden">Create</span>
                </Button>
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-3 sm:gap-4 bg-white dark:bg-gray-900/50 p-3 sm:p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
                    <div className="relative flex-1 min-w-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#49659c] size-4 pointer-events-none" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={PENALTIES_STRINGS.SEARCH_PLACEHOLDER}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white"
                        />
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
                            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white"
                        >
                            <option value="all">All Types</option>
                            <option value={PENALTY_TYPES.PENALTY}>Penalties</option>
                            <option value={PENALTY_TYPES.DEDUCTION}>Deductions</option>
                        </select>
                        {(searchTerm !== '' || typeFilter !== 'all') && (
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setTypeFilter('all');
                                }}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all shrink-0"
                                title="Clear Filters"
                                aria-label="Clear Filters"
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <div className="inline-block min-w-full align-middle">
                        <table className="min-w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-bold uppercase tracking-wider text-[#49659c]">Name</th>
                                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-bold uppercase tracking-wider text-[#49659c] hidden sm:table-cell">Type</th>
                                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-bold uppercase tracking-wider text-[#49659c]">Amount</th>
                                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-bold uppercase tracking-wider text-[#49659c] hidden lg:table-cell">Description</th>
                                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-bold uppercase tracking-wider text-[#49659c] hidden md:table-cell">Status</th>
                                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-bold uppercase tracking-wider text-[#49659c]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-3 sm:px-6 py-8 sm:py-12 text-center text-[#49659c]">
                                        {PENALTIES_STRINGS.LOADING}
                                    </td>
                                </tr>
                            ) : filteredPenalties.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-3 sm:px-6 py-12 sm:py-20 text-center">
                                        <div className="size-12 sm:size-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                                            <AlertCircle size={24} className="sm:w-8 sm:h-8 text-[#49659c]" />
                                        </div>
                                        <h3 className="text-base sm:text-lg font-bold dark:text-white">{PENALTIES_STRINGS.NO_PENALTIES}</h3>
                                    </td>
                                </tr>
                            ) : (
                                filteredPenalties.map((penalty) => (
                                    <tr key={penalty.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                                            <p className="text-sm font-bold text-[#0d121c] dark:text-white">{penalty.name}</p>
                                            <span className={cn(
                                                "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 sm:hidden",
                                                penalty.type === PENALTY_TYPES.PENALTY
                                                    ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                                    : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                            )}>
                                                {penalty.type === PENALTY_TYPES.PENALTY ? PENALTIES_STRINGS.TYPE_PENALTY : PENALTIES_STRINGS.TYPE_DEDUCTION}
                                            </span>
                                        </td>
                                        <td className="px-3 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">
                                            <span className={cn(
                                                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                                                penalty.type === PENALTY_TYPES.PENALTY
                                                    ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                                    : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                            )}>
                                                {penalty.type === PENALTY_TYPES.PENALTY ? PENALTIES_STRINGS.TYPE_PENALTY : PENALTIES_STRINGS.TYPE_DEDUCTION}
                                            </span>
                                        </td>
                                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                                            <div className="flex items-center gap-1">
                                                <span className="text-green-600 font-bold text-xs sm:text-sm">₹</span>
                                                <span className="text-sm font-bold text-[#0d121c] dark:text-white">
                                                    {penalty.amount.toLocaleString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-3 sm:px-6 py-3 sm:py-4 hidden lg:table-cell">
                                            <p className="text-sm text-[#49659c] dark:text-gray-300 max-w-xs truncate">
                                                {penalty.description || '-'}
                                            </p>
                                        </td>
                                        <td className="px-3 sm:px-6 py-3 sm:py-4 hidden md:table-cell">
                                            <span className={cn(
                                                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                                                penalty.isActive
                                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                                    : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                                            )}>
                                                {penalty.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                                            <div className="flex items-center gap-1 sm:gap-2">
                                                <button
                                                    onClick={() => onApplyClick(penalty)}
                                                    className="p-1.5 sm:p-2 text-[#49659c] hover:text-[#0d59f2] hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                                                    title={PENALTIES_STRINGS.APPLY}
                                                    aria-label={PENALTIES_STRINGS.APPLY}
                                                >
                                                    <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
                                                </button>
                                                <button
                                                    onClick={() => onEditClick(penalty)}
                                                    className="p-1.5 sm:p-2 text-[#49659c] hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all"
                                                    title={PENALTIES_STRINGS.EDIT}
                                                    aria-label={PENALTIES_STRINGS.EDIT}
                                                >
                                                    <Edit2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteTarget(penalty)}
                                                    className="p-1.5 sm:p-2 text-[#49659c] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                    title={PENALTIES_STRINGS.DELETE}
                                                    aria-label={PENALTIES_STRINGS.DELETE}
                                                >
                                                    <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                title="Confirm Delete"
            >
                <div className="space-y-4">
                    <p className="text-sm text-[#49659c] dark:text-gray-300">
                        {PENALTIES_STRINGS.DELETE_CONFIRM}
                    </p>
                    {deleteTarget && (
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <p className="font-medium text-[#0d121c] dark:text-white">{deleteTarget.name}</p>
                            <p className="text-sm text-[#49659c] dark:text-gray-400">₹{deleteTarget.amount.toLocaleString()}</p>
                        </div>
                    )}
                    <div className="flex flex-col sm:flex-row justify-end gap-2">
                        <Button variant="outline" onClick={() => setDeleteTarget(null)} className="w-full sm:w-auto">
                            {PENALTIES_STRINGS.CANCEL}
                        </Button>
                        <Button variant="danger" onClick={handleDelete} className="w-full sm:w-auto">
                            {PENALTIES_STRINGS.DELETE}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
