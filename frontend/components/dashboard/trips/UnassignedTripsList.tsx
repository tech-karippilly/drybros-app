"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { getTripList, TripResponse } from '@/lib/features/trip/tripApi';
import { TripDetailsModal } from './TripDetailsModal';
import {
    Search,
    ChevronLeft,
    ChevronRight,
    Eye,
    User,
    MapPin,
    Calendar,
    Clock,
    Loader2,
    AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function UnassignedTripsList() {
    const [trips, setTrips] = useState<TripResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchTrips();
    }, []);

    const fetchTrips = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const allTrips = await getTripList();
            // Filter for unassigned trips (no driverId or status is PENDING/REQUESTED/NOT_ASSIGNED)
            const unassigned = allTrips.filter(
                (trip) =>
                    !trip.driverId ||
                    trip.status === 'PENDING' ||
                    trip.status === 'REQUESTED' ||
                    trip.status === 'NOT_ASSIGNED'
            );
            setTrips(unassigned);
        } catch (err: any) {
            setError(
                err?.response?.data?.error ||
                    err?.message ||
                    'Failed to fetch unassigned trips'
            );
        } finally {
            setIsLoading(false);
        }
    };

    const filteredTrips = useMemo(() => {
        return trips.filter(
            (trip) =>
                trip.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                trip.customerPhone.includes(searchTerm) ||
                trip.pickupAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                trip.dropAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                trip.tripType.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [trips, searchTerm]);

    const totalPages = Math.ceil(filteredTrips.length / itemsPerPage);
    const paginatedTrips = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredTrips.slice(start, start + itemsPerPage);
    }, [filteredTrips, currentPage]);

    const formatPrice = (price: number) => {
        return `₹${price.toFixed(2)}`;
    };

    const formatDate = (date: Date | string | null) => {
        if (!date) return 'Not scheduled';
        const d = new Date(date);
        return d.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const formatTime = (date: Date | string | null) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING':
            case 'REQUESTED':
            case 'NOT_ASSIGNED':
                return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-500';
            default:
                return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-500';
        }
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white">
                        Unassigned Trips
                    </h2>
                    <p className="text-[#49659c] dark:text-gray-400">
                        View and manage trips that are waiting for driver assignment.
                    </p>
                </div>
                <button
                    onClick={fetchTrips}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-[#0d59f2] text-white rounded-lg font-bold hover:bg-[#0d59f2]/90 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                >
                    <Clock size={18} />
                    <span>Refresh</span>
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
                        placeholder="Search by customer name, phone, location, or trip type..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white"
                    />
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="text-red-600 dark:text-red-400" size={20} />
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="py-20 text-center">
                        <Loader2 className="size-8 animate-spin text-[#0d59f2] mx-auto mb-4" />
                        <p className="text-[#49659c]">Loading unassigned trips...</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#49659c]">
                                            Trip ID
                                        </th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#49659c]">
                                            Customer
                                        </th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#49659c]">
                                            Trip Type
                                        </th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#49659c]">
                                            Pickup
                                        </th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#49659c]">
                                            Destination
                                        </th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#49659c]">
                                            Scheduled
                                        </th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#49659c]">
                                            Amount
                                        </th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#49659c]">
                                            Status
                                        </th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#49659c]">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {paginatedTrips.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="px-6 py-20 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <AlertCircle
                                                        size={32}
                                                        className="text-[#49659c] opacity-50"
                                                    />
                                                    <h3 className="text-lg font-bold dark:text-white">
                                                        No unassigned trips found
                                                    </h3>
                                                    <p className="text-[#49659c] text-sm">
                                                        {searchTerm
                                                            ? 'Try adjusting your search.'
                                                            : 'All trips have been assigned to drivers.'}
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedTrips.map((trip) => (
                                            <tr
                                                key={trip.id}
                                                className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group"
                                            >
                                                <td className="px-6 py-4">
                                                    <span className="text-xs font-bold px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                                                        #{trip.id}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-[#0d121c] dark:text-white">
                                                            {trip.customerName}
                                                        </span>
                                                        <span className="text-xs text-[#49659c] dark:text-gray-400">
                                                            {trip.customerPhone}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-medium text-[#0d121c] dark:text-white">
                                                        {trip.tripType}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col max-w-[200px]">
                                                        <span className="text-sm text-[#0d121c] dark:text-white truncate">
                                                            {trip.pickupAddress || trip.pickupLocation}
                                                        </span>
                                                        {trip.pickupLocationNote && (
                                                            <span className="text-xs text-[#49659c] dark:text-gray-400 truncate">
                                                                {trip.pickupLocationNote}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col max-w-[200px]">
                                                        <span className="text-sm text-[#0d121c] dark:text-white truncate">
                                                            {trip.dropAddress || trip.dropLocation || 'N/A'}
                                                        </span>
                                                        {trip.dropLocationNote && (
                                                            <span className="text-xs text-[#49659c] dark:text-gray-400 truncate">
                                                                {trip.dropLocationNote}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {trip.scheduledAt ? (
                                                        <div className="flex flex-col">
                                                            <span className="text-sm text-[#0d121c] dark:text-white">
                                                                {formatDate(trip.scheduledAt)}
                                                            </span>
                                                            <span className="text-xs text-[#49659c] dark:text-gray-400">
                                                                {formatTime(trip.scheduledAt)}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-[#49659c] dark:text-gray-400">
                                                            Not scheduled
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-[#0d121c] dark:text-white">
                                                            {formatPrice(trip.totalAmount)}
                                                        </span>
                                                        {trip.extraAmount > 0 && (
                                                            <span className="text-xs text-[#49659c] dark:text-gray-400">
                                                                Base: {formatPrice(trip.baseAmount)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={cn(
                                                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold',
                                                            getStatusColor(trip.status)
                                                        )}
                                                    >
                                                        {trip.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => setSelectedTripId(trip.id)}
                                                            className="p-2 text-[#49659c] hover:text-[#0d59f2] hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                                                            title="View Details"
                                                        >
                                                            <Eye size={18} />
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
                        {filteredTrips.length > 0 && (
                            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <p className="text-sm text-[#49659c]">
                                    Showing{' '}
                                    <span className="font-bold text-[#0d121c] dark:text-white">
                                        {(currentPage - 1) * itemsPerPage + 1}
                                    </span>{' '}
                                    to{' '}
                                    <span className="font-bold text-[#0d121c] dark:text-white">
                                        {Math.min(currentPage * itemsPerPage, filteredTrips.length)}
                                    </span>{' '}
                                    of{' '}
                                    <span className="font-bold text-[#0d121c] dark:text-white">
                                        {filteredTrips.length}
                                    </span>{' '}
                                    unassigned trips
                                </p>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="p-2 border border-gray-200 dark:border-gray-800 rounded-lg text-[#49659c] hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>

                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: totalPages }).map((_, i) => {
                                            const pageNum = i + 1;
                                            if (
                                                pageNum === 1 ||
                                                pageNum === totalPages ||
                                                (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                            ) {
                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => setCurrentPage(pageNum)}
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
                                                    <span key={pageNum} className="text-[#49659c] px-2">
                                                        ...
                                                    </span>
                                                );
                                            }
                                            return null;
                                        })}
                                    </div>

                                    <button
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
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

            {/* Trip Details Modal */}
            {selectedTripId && (
                <TripDetailsModal
                    tripId={selectedTripId}
                    onClose={() => setSelectedTripId(null)}
                />
            )}
        </div>
    );
}
