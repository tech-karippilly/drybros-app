"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/lib/hooks';
import { fetchDrivers, deleteDriver, banDriver } from '@/lib/features/drivers/driverSlice';
import {
    Plus,
    Search,
    Filter as FilterIcon,
    ChevronLeft,
    ChevronRight,
    X,
    Phone,
    AlertCircle,
    Edit2,
    Trash2,
    Ban,
    Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { GetDriver, DriverStatus } from '@/lib/types/drivers';
import { DeleteDriverModal, BanDriverModal } from './ActionModals';

// Helper for status badge
const DriverStatusBadge = ({ status }: { status: DriverStatus }) => {
    let colorClass = "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    let label = "Unknown";

    switch (status) {
        case DriverStatus.ACTIVE:
            colorClass = "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
            label = "Active";
            break;
        case DriverStatus.INACTIVE:
            colorClass = "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
            label = "Inactive";
            break;
        case DriverStatus.BLOCKED:
            colorClass = "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
            label = "Blocked";
            break;
        case DriverStatus.TERMINATED:
             colorClass = "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
            label = "Terminated";
            break;
    }

    return (
        <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium border border-transparent", colorClass)}>
            {label}
        </span>
    );
};

interface DriversListProps {
    onCreateClick: () => void;
    onEditClick: (driver: GetDriver) => void;
    onViewClick: (driver: GetDriver) => void;
}

export function DriversList({ onCreateClick, onEditClick, onViewClick }: DriversListProps) {
    const dispatch = useAppDispatch();
    const { drivers } = useAppSelector(state => state.drivers);
    
    // Local filters state matching StaffList pattern
    const [filters, setFilters] = useState({
        search: '',
        phone: '',
        status: 'all',
        franchise: ''
    });
    const [showFilters, setShowFilters] = useState(false);
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Modal state for confirmations
    const [deleteTarget, setDeleteTarget] = useState<GetDriver | null>(null);
    const [banTarget, setBanTarget] = useState<GetDriver | null>(null);

    useEffect(() => {
        dispatch(fetchDrivers());
    }, [dispatch]);

    // Filter Logic
    const filteredList = useMemo(() => {
        return drivers.filter(item => {
            const fullName = `${item.firstName} ${item.lastName}`.toLowerCase();
            const matchesSearch = fullName.includes(filters.search.toLowerCase()) || 
                                  item.driverPhone.includes(filters.search);
            
            const matchesPhone = filters.phone === '' || item.driverPhone.includes(filters.phone);
            
            let matchesStatus = true;
            if (filters.status !== 'all') {
                 const statusMap: Record<string, DriverStatus> = {
                     'active': DriverStatus.ACTIVE,
                     'inactive': DriverStatus.INACTIVE,
                     'blocked': DriverStatus.BLOCKED,
                     'terminated': DriverStatus.TERMINATED
                 };
                 matchesStatus = item.status === statusMap[filters.status];
            }

            const matchesFranchise = filters.franchise === '' || 
                                     (item.franchiseName && item.franchiseName.toLowerCase().includes(filters.franchise.toLowerCase()));

            return matchesSearch && matchesPhone && matchesStatus && matchesFranchise;
        });
    }, [drivers, filters]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredList.length / itemsPerPage);
    const paginatedList = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredList.slice(start, start + itemsPerPage);
    }, [filteredList, currentPage]);

    const handleFilterChange = (key: keyof typeof filters, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setCurrentPage(1); // Reset to first page on filter change
    };

    const clearFilters = () => {
        setFilters({
            search: '',
            phone: '',
            status: 'all',
            franchise: ''
        });
        setCurrentPage(1);
    };



    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
             {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                     <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white">Drivers Directory</h2>
                    <p className="text-[#49659c] dark:text-gray-400">Manage your fleet drivers, track status, and employment.</p>
                </div>
                <button
                    onClick={onCreateClick}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-[#0d59f2] text-white rounded-lg font-bold hover:bg-[#0d59f2]/90 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                >
                    <Plus size={18} />
                    <span>Onboard Driver</span>
                </button>
            </div>

            {/* Controls */}
             <div className="flex flex-col gap-4 bg-white dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#49659c] size-4" />
                        <input
                            type="text"
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            placeholder="Search by name or phone..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white"
                        />
                    </div>
                     <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-all",
                                showFilters || filters.status !== 'all' || filters.phone !== '' || filters.franchise !== ''
                                    ? "bg-[#0d59f2]/10 border-[#0d59f2] text-[#0d59f2]"
                                    : "border-gray-200 dark:border-gray-800 text-[#49659c] hover:bg-gray-50 dark:hover:bg-gray-800"
                            )}
                        >
                            <FilterIcon size={16} />
                            <span>Filters</span>
                        </button>
                         {(filters.search !== '' || filters.status !== 'all' || filters.phone !== '' || filters.franchise !== '') && (
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800 animate-in slide-in-from-top-2 duration-300">
                         <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#49659c]">Phone Number</label>
                            <input
                                type="text"
                                value={filters.phone}
                                onChange={(e) => handleFilterChange('phone', e.target.value)}
                                placeholder="Filter by phone..."
                                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#49659c]">Franchise</label>
                            <input
                                type="text"
                                value={filters.franchise}
                                onChange={(e) => handleFilterChange('franchise', e.target.value)}
                                placeholder="Filter by franchise name..."
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
                                <option value="inactive">Inactive</option>
                                <option value="blocked">Blocked</option>
                                <option value="terminated">Terminated</option>
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
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#49659c]">Driver</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#49659c]">Contact</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#49659c]">Franchise</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#49659c]">Location</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#49659c]">Status</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#49659c] text-right">Actions</th>
                            </tr>
                        </thead>
                         <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                             {paginatedList.map((driver) => (
                                 <tr key={driver._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group">
                                     <td className="px-6 py-4">
                                        <div className="flex items-center gap-3" onClick={() => onViewClick(driver)}>
                                            <div className="size-10 rounded-full bg-[#0d59f2]/10 flex items-center justify-center text-[#0d59f2] font-bold cursor-pointer">
                                                {driver.firstName.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-[#0d121c] dark:text-white cursor-pointer hover:text-[#0d59f2] transition-colors">
                                                    {driver.firstName} {driver.lastName}
                                                </p>
                                                <p className="text-[10px] text-[#49659c] font-black uppercase tracking-tighter">ID: {driver._id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 text-xs text-[#49659c]">
                                            <Phone size={12} />
                                            <span>{driver.driverPhone}</span>
                                        </div>
                                         {driver.driverAltPhone && (
                                            <div className="flex items-center gap-1.5 text-xs text-[#49659c] mt-1">
                                                <span className="text-[10px] opacity-70">Alt:</span>
                                                <span>{driver.driverAltPhone}</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                         <span className="text-sm font-medium dark:text-gray-300">{driver.franchiseName || 'N/A'}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium dark:text-gray-300">{driver.city}</div>
                                        <div className="text-xs text-[#49659c]">{driver.assignedCity || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <DriverStatusBadge status={driver.status} />
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                         <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => onViewClick(driver)}
                                                className="p-2 text-[#49659c] hover:text-[#0d59f2] hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                                                title="View Details"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button
                                                onClick={() => onEditClick(driver)}
                                                className="p-2 text-[#49659c] hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all"
                                                title="Edit"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                 onClick={() => setBanTarget(driver)}
                                                 className="p-2 text-[#49659c] hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-all"
                                                 title="Ban Driver"
                                            >
                                                <Ban size={18} />
                                            </button>
                                            <button
                                                onClick={() => setDeleteTarget(driver)}
                                                className="p-2 text-[#49659c] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                title="Delete"
                                            >
                                                <Trash2 size={18} />
                                            </button>
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
                        <h3 className="text-lg font-bold dark:text-white">No drivers found</h3>
                        <p className="text-[#49659c] mt-1 max-w-xs mx-auto">Try adjusting your filters or search term.</p>
                        <button onClick={clearFilters} className="mt-6 text-[#0d59f2] font-bold text-sm hover:underline">
                            Reset all filters
                        </button>
                    </div>
                )}
                
                 {/* Pagination */}
                 {filteredList.length > 0 && (
                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <p className="text-xs text-[#49659c] font-medium">
                            Showing <span className="text-[#0d121c] dark:text-white font-bold">{Math.min(filteredList.length, (currentPage - 1) * itemsPerPage + 1)}</span> to <span className="text-[#0d121c] dark:text-white font-bold">{Math.min(filteredList.length, currentPage * itemsPerPage)}</span> of <span className="text-[#0d121c] dark:text-white font-bold">{filteredList.length}</span> drivers
                        </p>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="p-2 border border-gray-200 dark:border-gray-800 rounded-lg text-[#49659c] hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: totalPages }).map((_, i) => (
                                    <button
                                        key={i + 1}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={cn(
                                            "size-9 rounded-lg text-xs font-bold transition-all",
                                            currentPage === i + 1
                                                ? "bg-[#0d59f2] text-white shadow-lg shadow-blue-500/20"
                                                : "text-[#49659c] hover:bg-white dark:hover:bg-gray-800 border border-transparent hover:border-gray-200 dark:hover:border-gray-800"
                                        )}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 border border-gray-200 dark:border-gray-800 rounded-lg text-[#49659c] hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Action Modals */}
            <DeleteDriverModal
                isOpen={!!deleteTarget}
                driverName={deleteTarget ? `${deleteTarget.firstName} ${deleteTarget.lastName}` : ""}
                onClose={() => setDeleteTarget(null)}
                onConfirm={() => {
                    if (deleteTarget) {
                        dispatch(deleteDriver(deleteTarget._id));
                        setDeleteTarget(null);
                    }
                }}
            />

            <BanDriverModal
                isOpen={!!banTarget}
                driverName={banTarget ? `${banTarget.firstName} ${banTarget.lastName}` : ""}
                onClose={() => setBanTarget(null)}
                onConfirm={() => {
                    if (banTarget) {
                        dispatch(banDriver(banTarget._id));
                        setBanTarget(null);
                    }
                }}
            />
        </div>
    );
}


