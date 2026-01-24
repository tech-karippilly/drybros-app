"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { getTripList, TripResponse } from '@/lib/features/trip/tripApi';
import { useAppSelector } from '@/lib/hooks';
import {
    Search,
    ChevronLeft,
    ChevronRight,
    Eye,
    Filter,
    Calendar,
    MapPin,
    User,
    Truck,
    Building2,
    Loader2,
    X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TripListProps {
    onViewTrip?: (tripId: string) => void;
}

export function TripList({ onViewTrip }: TripListProps) {
    const { list: franchises } = useAppSelector((state) => state.franchise);
    const [trips, setTrips] = useState<TripResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [franchiseFilter, setFranchiseFilter] = useState<string>('all');
    const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchTrips();
    }, []);

    const fetchTrips = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const allTrips = await getTripList();
            setTrips(allTrips);
        } catch (err: any) {
            setError(
                err?.response?.data?.error ||
                    err?.message ||
                    'Failed to fetch trips'
            );
        } finally {
            setIsLoading(false);
        }
    };

    // Filter trips based on search and filters
    const filteredTrips = useMemo(() => {
        let filtered = [...trips];

        // Search filter
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter(trip =>
                trip.customerName.toLowerCase().includes(searchLower) ||
                trip.customerPhone.includes(searchTerm) ||
                trip.pickupLocation.toLowerCase().includes(searchLower) ||
                (trip.dropLocation && trip.dropLocation.toLowerCase().includes(searchLower)) ||
                trip.id.toLowerCase().includes(searchLower) ||
                (trip.Driver && `${trip.Driver.firstName} ${trip.Driver.lastName}`.toLowerCase().includes(searchLower))
            );
        }

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(trip => trip.status === statusFilter);
        }

        // Franchise filter
        if (franchiseFilter !== 'all') {
            filtered = filtered.filter(trip => trip.franchiseId === franchiseFilter);
        }

        // Payment status filter
        if (paymentStatusFilter !== 'all') {
            filtered = filtered.filter(trip => trip.paymentStatus === paymentStatusFilter);
        }

        // Date range filter
        if (dateFrom) {
            const fromDate = new Date(dateFrom);
            filtered = filtered.filter(trip => {
                const tripDate = new Date(trip.createdAt);
                return tripDate >= fromDate;
            });
        }

        if (dateTo) {
            const toDate = new Date(dateTo);
            toDate.setHours(23, 59, 59, 999); // Include entire day
            filtered = filtered.filter(trip => {
                const tripDate = new Date(trip.createdAt);
                return tripDate <= toDate;
            });
        }

        return filtered;
    }, [trips, searchTerm, statusFilter, franchiseFilter, paymentStatusFilter, dateFrom, dateTo]);

    // Pagination
    const totalPages = Math.ceil(filteredTrips.length / itemsPerPage);
    const paginatedTrips = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredTrips.slice(start, start + itemsPerPage);
    }, [filteredTrips, currentPage, itemsPerPage]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setFranchiseFilter('all');
        setPaymentStatusFilter('all');
        setDateFrom('');
        setDateTo('');
        setCurrentPage(1);
    };

    const getStatusColor = (status: string) => {
        const statusColors: Record<string, string> = {
            'REQUESTED': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-500',
            'ASSIGNED': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-500',
            'DRIVER_ON_THE_WAY': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-500',
            'IN_PROGRESS': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-500',
            'COMPLETED': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-500',
            'CANCELLED_BY_CUSTOMER': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-500',
            'CANCELLED_BY_OFFICE': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-500',
            'REJECTED_BY_DRIVER': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-500',
        };
        return statusColors[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-500';
    };

    const getPaymentStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            'PENDING': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-500',
            'PAID': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-500',
            'PARTIALLY_PAID': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-500',
        };
        return colors[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-500';
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white">All Trips</h2>
                    <p className="text-[#49659c] dark:text-gray-400">View and manage all trips</p>
                </div>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm font-bold text-[#49659c] hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                >
                    <Filter size={18} />
                    <span>Filters</span>
                </button>
            </div>

            {/* Search Bar */}
            <div className="bg-white dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#49659c] size-4" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        placeholder="Search by customer name, phone, location, driver..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white"
                    />
                </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-[#0d121c] dark:text-white uppercase tracking-wider">Filters</h3>
                        <button
                            onClick={clearFilters}
                            className="text-xs text-[#0d59f2] hover:underline"
                        >
                            Clear All
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Status Filter */}
                        <div>
                            <label className="text-xs font-bold text-[#49659c] uppercase tracking-wider mb-2 block">
                                Status
                            </label>
                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white"
                            >
                                <option value="all">All Status</option>
                                <option value="REQUESTED">Requested</option>
                                <option value="ASSIGNED">Assigned</option>
                                <option value="DRIVER_ON_THE_WAY">Driver On The Way</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="CANCELLED_BY_CUSTOMER">Cancelled by Customer</option>
                                <option value="CANCELLED_BY_OFFICE">Cancelled by Office</option>
                                <option value="REJECTED_BY_DRIVER">Rejected by Driver</option>
                            </select>
                        </div>

                        {/* Franchise Filter */}
                        <div>
                            <label className="text-xs font-bold text-[#49659c] uppercase tracking-wider mb-2 block">
                                Franchise
                            </label>
                            <select
                                value={franchiseFilter}
                                onChange={(e) => {
                                    setFranchiseFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
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

                        {/* Payment Status Filter */}
                        <div>
                            <label className="text-xs font-bold text-[#49659c] uppercase tracking-wider mb-2 block">
                                Payment Status
                            </label>
                            <select
                                value={paymentStatusFilter}
                                onChange={(e) => {
                                    setPaymentStatusFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white"
                            >
                                <option value="all">All Payment Status</option>
                                <option value="PENDING">Pending</option>
                                <option value="PAID">Paid</option>
                                <option value="PARTIALLY_PAID">Partially Paid</option>
                            </select>
                        </div>

                        {/* Date From */}
                        <div>
                            <label className="text-xs font-bold text-[#49659c] uppercase tracking-wider mb-2 block">
                                Date From
                            </label>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => {
                                    setDateFrom(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white"
                            />
                        </div>

                        {/* Date To */}
                        <div>
                            <label className="text-xs font-bold text-[#49659c] uppercase tracking-wider mb-2 block">
                                Date To
                            </label>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => {
                                    setDateTo(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Trips Table */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="py-20 text-center">
                        <Loader2 className="size-8 animate-spin text-[#0d59f2] mx-auto mb-4" />
                        <p className="text-[#49659c]">Loading trips...</p>
                    </div>
                ) : error ? (
                    <div className="py-20 text-center">
                        <p className="text-red-600 dark:text-red-400">{error}</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#49659c]">Trip ID</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#49659c]">Customer</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#49659c]">Pickup</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#49659c]">Drop</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#49659c]">Driver</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#49659c]">Status</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#49659c]">Payment</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#49659c]">Amount</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#49659c]">Date</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#49659c]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {paginatedTrips.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} className="px-6 py-20 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Search
                                                        size={32}
                                                        className="text-[#49659c] opacity-50"
                                                    />
                                                    <h3 className="text-lg font-bold dark:text-white">
                                                        No trips found
                                                    </h3>
                                                    <p className="text-[#49659c] text-sm">
                                                        {searchTerm || statusFilter !== 'all' || franchiseFilter !== 'all'
                                                            ? 'Try adjusting your filters.'
                                                            : 'No trips available.'}
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
                                                    <span className="text-xs font-mono text-[#49659c] dark:text-gray-400">
                                                        {trip.id.substring(0, 8)}...
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
                                                    <div className="flex items-start gap-2 max-w-[200px]">
                                                        <MapPin size={14} className="text-[#49659c] mt-0.5 flex-shrink-0" />
                                                        <span className="text-xs text-[#49659c] dark:text-gray-400 truncate">
                                                            {trip.pickupLocation}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {trip.dropLocation ? (
                                                        <div className="flex items-start gap-2 max-w-[200px]">
                                                            <MapPin size={14} className="text-[#49659c] mt-0.5 flex-shrink-0" />
                                                            <span className="text-xs text-[#49659c] dark:text-gray-400 truncate">
                                                                {trip.dropLocation}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {trip.Driver ? (
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-[#0d121c] dark:text-white">
                                                                {trip.Driver.firstName} {trip.Driver.lastName}
                                                            </span>
                                                            <span className="text-xs text-[#49659c] dark:text-gray-400">
                                                                {trip.Driver.driverCode}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">Unassigned</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={cn(
                                                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold',
                                                            getStatusColor(trip.status)
                                                        )}
                                                    >
                                                        {trip.status.replace(/_/g, ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={cn(
                                                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold',
                                                            getPaymentStatusColor(trip.paymentStatus)
                                                        )}
                                                    >
                                                        {trip.paymentStatus.replace(/_/g, ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-bold text-[#0d121c] dark:text-white">
                                                        ₹{trip.finalAmount.toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs text-[#49659c] dark:text-gray-400">
                                                        {new Date(trip.createdAt).toLocaleDateString()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {onViewTrip && (
                                                        <button
                                                            onClick={() => onViewTrip(trip.id)}
                                                            className="p-2 text-[#49659c] hover:text-[#0d59f2] hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                                                            title="View Details"
                                                        >
                                                            <Eye size={18} />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
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
                                    trips
                                </p>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
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
                                                        onClick={() => handlePageChange(pageNum)}
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
                                            } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
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
                                        onClick={() => handlePageChange(currentPage + 1)}
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
        </div>
    );
}
