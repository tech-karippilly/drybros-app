import React, { useState, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '@/lib/hooks';
import { setSelectedFranchise } from '@/lib/features/franchise/franchiseSlice';
import {
    Eye,
    Edit2,
    MoreVertical,
    Plus,
    Search,
    Filter as FilterIcon,
    ChevronLeft,
    ChevronRight,
    X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FranchiseListProps {
    onCreateClick: () => void;
}

export function FranchiseList({ onCreateClick }: FranchiseListProps) {
    const { list } = useAppSelector((state) => state.franchise);
    const dispatch = useAppDispatch();

    // Filtering State
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [minStaffFilter, setMinStaffFilter] = useState('');
    const [locationFilter, setLocationFilter] = useState('all');
    const [codeFilter, setCodeFilter] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // Derived Data: Unique Locations for filter
    const locations = useMemo(() => {
        const locs = Array.from(new Set(list.map(f => f.location)));
        return locs.sort();
    }, [list]);

    // Filtering Logic
    const filteredList = useMemo(() => {
        return list.filter(item => {
            const matchesSearch =
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.location.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
            const matchesStaff = minStaffFilter === '' || item.staffCount >= parseInt(minStaffFilter);
            const matchesLocation = locationFilter === 'all' || item.location === locationFilter;
            const matchesCode = codeFilter === '' || item.code.toLowerCase().includes(codeFilter.toLowerCase());

            return matchesSearch && matchesStatus && matchesStaff && matchesLocation && matchesCode;
        });
    }, [list, searchTerm, statusFilter, minStaffFilter, locationFilter, codeFilter]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredList.length / itemsPerPage);
    const paginatedList = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredList.slice(start, start + itemsPerPage);
    }, [filteredList, currentPage]);

    // Reset page if filters change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, minStaffFilter, locationFilter, codeFilter]);

    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setMinStaffFilter('');
        setLocationFilter('all');
        setCodeFilter('');
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
            {/* Header section with actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white">Franchise Management</h2>
                    <p className="text-[#49659c] dark:text-gray-400">View and manage all your franchise locations and their performance.</p>
                </div>
                <button
                    onClick={onCreateClick}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-[#0d59f2] text-white rounded-lg font-bold hover:bg-[#0d59f2]/90 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                >
                    <Plus size={18} />
                    <span>Create Franchise</span>
                </button>
            </div>

            {/* Filters and Search Bar */}
            <div className="flex flex-col gap-4 bg-white dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#49659c] size-4" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by name, code or location..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-all",
                                showFilters || statusFilter !== 'all' || minStaffFilter !== '' || locationFilter !== 'all' || codeFilter !== ''
                                    ? "bg-[#0d59f2]/10 border-[#0d59f2] text-[#0d59f2]"
                                    : "border-gray-200 dark:border-gray-800 text-[#49659c] hover:bg-gray-50 dark:hover:bg-gray-800"
                            )}
                        >
                            <FilterIcon size={16} />
                            <span>Filters</span>
                        </button>
                        {(searchTerm !== '' || statusFilter !== 'all' || minStaffFilter !== '' || locationFilter !== 'all' || codeFilter !== '') && (
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
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800 animate-in slide-in-from-top-2 duration-300">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#49659c]">Status</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="blocked">Blocked</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#49659c]">Min Staff</label>
                            <input
                                type="number"
                                value={minStaffFilter}
                                onChange={(e) => setMinStaffFilter(e.target.value)}
                                placeholder="Min staff count"
                                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#49659c]">Location</label>
                            <select
                                value={locationFilter}
                                onChange={(e) => setLocationFilter(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white"
                            >
                                <option value="all">All Locations</option>
                                {locations.map(loc => (
                                    <option key={loc} value={loc}>{loc}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#49659c]">Code Search</label>
                            <input
                                type="text"
                                value={codeFilter}
                                onChange={(e) => setCodeFilter(e.target.value)}
                                placeholder="Exact or partial code"
                                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white"
                            />
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
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#49659c]">Code</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#49659c]">Franchise Name</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#49659c]">Location</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#49659c]">Staff/Drivers</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#49659c]">Contact</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#49659c]">Status</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#49659c]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {paginatedList.map((franchise) => (
                                <tr key={franchise._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-bold px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                                            {franchise.code}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-[#0d121c] dark:text-white">{franchise.name}</span>
                                            <span className="text-xs text-[#49659c] dark:text-gray-400 truncate max-w-[200px]">{franchise.address}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-[#49659c] dark:text-gray-300">
                                        {franchise.location}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs text-[#49659c]">Staff</span>
                                                <span className="text-sm font-bold dark:text-gray-200">{franchise.staffCount}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs text-[#49659c]">Drivers</span>
                                                <span className="text-sm font-bold dark:text-gray-200">{franchise.driverCount}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm text-[#0d121c] dark:text-gray-300">{franchise.email}</span>
                                            <span className="text-xs text-[#49659c]">{franchise.phone}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold",
                                            franchise.status === 'active'
                                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-500"
                                                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-500"
                                        )}>
                                            {franchise.status === 'active' ? 'Active' : 'Blocked'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => dispatch(setSelectedFranchise(franchise))}
                                                className="p-2 text-[#49659c] hover:text-[#0d59f2] hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                                                title="View Details"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button
                                                className="p-2 text-[#49659c] hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all"
                                                title="Edit"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button className="p-2 text-[#49659c] hover:text-gray-900 dark:hover:text-white rounded-lg transition-all">
                                                <MoreVertical size={18} />
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
                            <Search size={32} className="text-[#49659c]" />
                        </div>
                        <h3 className="text-lg font-bold dark:text-white">No franchises found</h3>
                        <p className="text-[#49659c] mt-1 max-w-xs mx-auto">We couldn&apos;t find any franchises matching your current filters. Try adjusting your search.</p>
                        <button
                            onClick={clearFilters}
                            className="mt-6 text-[#0d59f2] font-bold text-sm hover:underline"
                        >
                            Reset all filters
                        </button>
                    </div>
                )}

                {/* Pagination Footer */}
                {filteredList.length > 0 && (
                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <p className="text-sm text-[#49659c]">
                            Showing <span className="font-bold text-[#0d121c] dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-[#0d121c] dark:text-white">{Math.min(currentPage * itemsPerPage, filteredList.length)}</span> of <span className="font-bold text-[#0d121c] dark:text-white">{filteredList.length}</span> franchises
                        </p>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
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
                                            "size-9 rounded-lg text-sm font-bold transition-all",
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
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 border border-gray-200 dark:border-gray-800 rounded-lg text-[#49659c] hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
