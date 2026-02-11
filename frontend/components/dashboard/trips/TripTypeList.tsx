"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/lib/hooks';
import {
    fetchTripTypesPaginated,
    deleteTripType,
} from '@/lib/features/tripType/tripTypeSlice';
import {
    Plus,
    Search,
    ChevronLeft,
    ChevronRight,
    Edit2,
    Trash2,
    Loader2,
    Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TripTypeResponse } from '@/lib/features/tripType/tripTypeApi';

interface TripTypeListProps {
    onCreateClick?: () => void;
    onEditClick?: (tripType: TripTypeResponse) => void;
}

export function TripTypeList({ onCreateClick, onEditClick }: TripTypeListProps) {
    const { list, pagination, isLoading } = useAppSelector((state) => state.tripType);
    const router = useRouter();
    const dispatch = useAppDispatch();
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        dispatch(fetchTripTypesPaginated({ page: currentPage, limit: itemsPerPage }));
    }, [dispatch, currentPage]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this trip type?')) {
            await dispatch(deleteTripType(id));
            // Refresh current page if needed
            if (pagination && list.length === 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            } else {
                dispatch(fetchTripTypesPaginated({ page: currentPage, limit: itemsPerPage }));
            }
        }
    };

    const filteredList = list.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatPrice = (price: number | null | undefined) => {
        if (price === null || price === undefined) {
            return '-';
        }
        return `₹${price.toFixed(2)}`;
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
            {/* Header section with actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white">
                        Trip Types
                    </h2>
                    <p className="text-[#49659c] dark:text-gray-400">
                        Manage trip type configurations and pricing.
                    </p>
                </div>
                <button
                    onClick={() => onCreateClick ? onCreateClick() : router.push('/dashboard/trip-types/create')}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-[#0d59f2] text-white rounded-lg font-bold hover:bg-[#0d59f2]/90 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                >
                    <Plus size={18} />
                    <span>Create Trip Type</span>
                </button>
            </div>

            {/* Search Bar */}
            <div className="bg-white dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#49659c] size-4" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by trip type name..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                {isLoading && list.length === 0 ? (
                    <div className="py-20 text-center">
                        <Loader2 className="size-8 animate-spin text-[#0d59f2] mx-auto mb-4" />
                        <p className="text-[#49659c]">Loading trip types...</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#49659c]">
                                            Type Name
                                        </th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#49659c]">
                                            Car Category
                                        </th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#49659c]">
                                            Pricing Type
                                        </th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#49659c]">
                                            Base Amount (₹)
                                        </th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#49659c]">
                                            Base Hour
                                        </th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#49659c]">
                                            Extra / Hour (₹)
                                        </th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#49659c]">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {filteredList.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-20 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Search
                                                        size={32}
                                                        className="text-[#49659c] opacity-50"
                                                    />
                                                    <h3 className="text-lg font-bold dark:text-white">
                                                        No trip types found
                                                    </h3>
                                                    <p className="text-[#49659c] text-sm">
                                                        {searchTerm
                                                            ? 'Try adjusting your search.'
                                                            : 'Create your first trip type to get started.'}
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredList.map((tripType) => (
                                            <tr
                                                key={tripType.id}
                                                className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-[#0d121c] dark:text-white">
                                                            {tripType.name}
                                                        </span>
                                                        {tripType.description && (
                                                            <span className="text-xs text-[#49659c] dark:text-gray-400 truncate max-w-[200px]">
                                                                {tripType.description}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-[#0d121c] dark:text-white">
                                                    {tripType.carCategory}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-[#49659c] dark:text-gray-300">
                                                    {tripType.type}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold text-[#0d121c] dark:text-white">
                                                    {formatPrice(tripType.baseAmount)}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-[#49659c] dark:text-gray-300">
                                                    {tripType.baseHour ?? '-'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-[#49659c] dark:text-gray-300">
                                                    {formatPrice(tripType.extraPerHour)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => router.push(`/dashboard/trip-types/${tripType.id}`)}
                                                            className="p-2 text-[#49659c] hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                                                            title="View Details"
                                                        >
                                                            <Eye size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => onEditClick(tripType)}
                                                            className="p-2 text-[#49659c] hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all"
                                                            title="Edit"
                                                        >
                                                            <Edit2 size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(tripType.id)}
                                                            className="p-2 text-[#49659c] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Footer */}
                        {pagination && pagination.total > 0 && (
                            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <p className="text-sm text-[#49659c]">
                                    Showing{' '}
                                    <span className="font-bold text-[#0d121c] dark:text-white">
                                        {(pagination.page - 1) * pagination.limit + 1}
                                    </span>{' '}
                                    to{' '}
                                    <span className="font-bold text-[#0d121c] dark:text-white">
                                        {Math.min(
                                            pagination.page * pagination.limit,
                                            pagination.total
                                        )}
                                    </span>{' '}
                                    of{' '}
                                    <span className="font-bold text-[#0d121c] dark:text-white">
                                        {pagination.total}
                                    </span>{' '}
                                    trip types
                                </p>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={!pagination.hasPrev || isLoading}
                                        className="p-2 border border-gray-200 dark:border-gray-800 rounded-lg text-[#49659c] hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>

                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: pagination.totalPages }).map(
                                            (_, i) => {
                                                const pageNum = i + 1;
                                                // Show first page, last page, current page, and pages around current
                                                if (
                                                    pageNum === 1 ||
                                                    pageNum === pagination.totalPages ||
                                                    (pageNum >= currentPage - 1 &&
                                                        pageNum <= currentPage + 1)
                                                ) {
                                                    return (
                                                        <button
                                                            key={pageNum}
                                                            onClick={() => handlePageChange(pageNum)}
                                                            disabled={isLoading}
                                                            className={cn(
                                                                'size-9 rounded-lg text-sm font-bold transition-all',
                                                                currentPage === pageNum
                                                                    ? 'bg-[#0d59f2] text-white shadow-lg shadow-blue-500/20'
                                                                    : 'text-[#49659c] hover:bg-white dark:hover:bg-gray-800 border border-transparent hover:border-gray-200 dark:hover:border-gray-800'
                                                            )}
                                                        >
                                                            {pageNum}
                                                        </button>
                                                    );
                                                } else if (
                                                    pageNum === currentPage - 2 ||
                                                    pageNum === currentPage + 2
                                                ) {
                                                    return (
                                                        <span
                                                            key={pageNum}
                                                            className="text-[#49659c] px-2"
                                                        >
                                                            ...
                                                        </span>
                                                    );
                                                }
                                                return null;
                                            }
                                        )}
                                    </div>

                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={!pagination.hasNext || isLoading}
                                        className="p-2 border border-gray-200 dark:border-gray-800 rounded-lg text-[#49659c] hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
