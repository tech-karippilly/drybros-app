'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { driverService } from '@/services/driverService';
import { franchiseService } from '@/services/franchiseService';
import type {
  Driver,
  DriverFilters,
  DriverStatus,
  EmploymentType,
} from '@/lib/types/driver';
import type { Franchise } from '@/lib/types/franchise';
import {
  DRIVER_STATUS_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
  TRANSMISSION_TYPE_OPTIONS,
  CAR_CATEGORY_OPTIONS,
} from '@/lib/types/driver';
import { useAppSelector } from '@/lib/hooks';
import { selectCurrentUser } from '@/lib/features/auth/authSlice';

// Icons
const PlusIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const FilterIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

const SearchIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const EyeIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const ChevronLeftIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRightIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const UserIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const StarIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const PhoneIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const BuildingIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const CarIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
);

// Status Badge Component
const StatusBadge = ({ status, isOnline }: { status: DriverStatus; isOnline?: boolean }) => {
  const styles = {
    ACTIVE: 'bg-green-500/10 text-green-400 border-green-500/30',
    INACTIVE: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
    BLOCKED: 'bg-red-500/10 text-red-400 border-red-500/30',
    TERMINATED: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  };

  const labels: Record<string, string> = {
    ACTIVE: 'Active',
    INACTIVE: 'Inactive',
    BLOCKED: 'Blocked',
    TERMINATED: 'Terminated',
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[status] || styles.INACTIVE}`}>
        {labels[status] || status}
      </span>
      {isOnline !== undefined && (
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${isOnline ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-gray-500/10 text-gray-400 border-gray-500/30'}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-green-400' : 'bg-gray-400'}`} />
          {isOnline ? 'Online' : 'Offline'}
        </span>
      )}
    </div>
  );
};

// Pagination Component
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}

const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }: PaginationProps) => {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between border-t border-gray-800 bg-gray-900/30 px-4 py-3 gap-3">
      <div className="text-sm text-gray-400">
        Showing {startItem} to {endItem} of {totalItems} drivers
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        {getPageNumbers().map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === 'number' && onPageChange(page)}
            disabled={page === '...'}
            className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-colors ${
              page === currentPage
                ? 'bg-blue-500 text-white'
                : page === '...'
                ? 'text-gray-500 cursor-default'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// Main Page Component
export default function DriversPage() {
  const router = useRouter();
  const currentUser = useAppSelector(selectCurrentUser);

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<DriverFilters>({
    page: 1,
    limit: 10,
    search: '',
    status: undefined,
    employmentType: undefined,
    franchiseId: undefined,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch franchises for admin dropdown
  const fetchFranchises = useCallback(async () => {
    try {
      const response = await franchiseService.getFranchises({ limit: 100 });
      if (response.data?.success) {
        setFranchises(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch franchises:', error);
    }
  }, []);

  const fetchDrivers = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = {
        page: filters.page,
        limit: filters.limit,
        includePerformance: true,
      };

      if (filters.search) {
        params.search = filters.search;
      }

      if (filters.status) {
        params.status = filters.status;
      }

      if (filters.employmentType) {
        params.employmentType = filters.employmentType;
      }

      if (filters.franchiseId) {
        params.franchiseId = filters.franchiseId;
      }

      const response = await driverService.getDrivers(params);

      if (response.data?.success) {
        setDrivers(response.data.data || []);
        setPagination(
          response.data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 }
        );
      }
    } catch (error) {
      console.error('Failed to fetch drivers:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchFranchises();
  }, [fetchFranchises]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }));
  };

  const handleStatusChange = (status: DriverStatus | '') => {
    setFilters((prev) => ({
      ...prev,
      status: status === prev.status ? undefined : (status as DriverStatus) || undefined,
      page: 1,
    }));
  };

  const handleEmploymentTypeChange = (type: EmploymentType | '') => {
    setFilters((prev) => ({
      ...prev,
      employmentType: type === prev.employmentType ? undefined : (type as EmploymentType) || undefined,
      page: 1,
    }));
  };

  const handleFranchiseChange = (franchiseId: string | '') => {
    setFilters((prev) => ({
      ...prev,
      franchiseId: franchiseId || undefined,
      page: 1,
    }));
  };

  const handleViewDriver = (id: string) => {
    router.push(`/admin/drivers/${id}`);
  };

  const handleCreateDriver = () => {
    router.push('/admin/drivers/create');
  };

  const getFranchiseName = (franchiseId: string) => {
    const franchise = franchises.find((f) => f.id === franchiseId);
    return franchise?.name || franchiseId.substring(0, 8);
  };

  const formatEmploymentType = (type: string | null) => {
    if (!type) return 'N/A';
    return type.replace('_', ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <DashboardLayout
      user={{ name: currentUser?.fullName || 'Admin User', role: currentUser?.role || 'Administrator' }}
      searchPlaceholder="Search drivers..."
      liveStatus={true}
      notificationCount={0}
    >
      {/* Page Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Driver Directory</h1>
          <p className="mt-1 text-sm text-gray-400">
            Manage and monitor driver performance across all franchises.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Filters Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-900/50 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
          >
            <FilterIcon className="h-4 w-4 text-gray-400" />
            <span>Filters</span>
          </button>

          {/* Register New Driver Button */}
          <button
            onClick={handleCreateDriver}
            className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Register New Driver
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="mb-6 rounded-xl border border-gray-800 bg-gray-900/50 p-4">
          <div className="flex flex-col gap-4">
            {/* Search */}
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={filters.search || ''}
                onChange={handleSearchChange}
                placeholder="Search by name, phone, or driver code..."
                className="w-full rounded-lg border border-gray-700 bg-gray-900/50 py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Franchise Filter */}
              <select
                value={filters.franchiseId || ''}
                onChange={(e) => handleFranchiseChange(e.target.value)}
                className="rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="">All Franchises</option>
                {franchises.map((franchise) => (
                  <option key={franchise.id} value={franchise.id}>
                    {franchise.name}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={filters.status || ''}
                onChange={(e) => handleStatusChange(e.target.value as DriverStatus | '')}
                className="rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="">All Status</option>
                {DRIVER_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* Employment Type Filter */}
              <select
                value={filters.employmentType || ''}
                onChange={(e) => handleEmploymentTypeChange(e.target.value as EmploymentType | '')}
                className="rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="">All Employment Types</option>
                {EMPLOYMENT_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Drivers Table */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/80">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Driver Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Phone
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Franchise
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Employment
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Expertise
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Rating
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                    </div>
                  </td>
                </tr>
              ) : drivers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <UserIcon className="mx-auto h-12 w-12 text-gray-600" />
                    <p className="mt-4 text-sm text-gray-500">No drivers found</p>
                  </td>
                </tr>
              ) : (
                drivers.map((driver) => (
                  <tr key={driver.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-xs font-bold text-blue-400">
                          {driver.firstName[0]}{driver.lastName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {driver.firstName} {driver.lastName}
                          </p>
                          <p className="text-xs text-gray-400">{driver.driverCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <PhoneIcon className="h-4 w-4 text-gray-500" />
                        {driver.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-gray-800 px-2.5 py-1 text-xs font-medium text-gray-300">
                        <BuildingIcon className="h-3 w-3" />
                        {getFranchiseName(driver.franchiseId)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-300">
                        {formatEmploymentType(driver.employmentType)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {driver.transmissionTypes && driver.transmissionTypes.length > 0 ? (
                          driver.transmissionTypes.map((type) => (
                            <span
                              key={type}
                              className="inline-flex items-center gap-1 rounded-lg bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-400"
                            >
                              <CarIcon className="h-3 w-3" />
                              {type === 'MANUAL' ? 'Manual' : type === 'AUTOMATIC' ? 'Auto' : type}
                            </span>
                          ))
                        ) : driver.carTypes && driver.carTypes.length > 0 ? (
                          driver.carTypes.map((type) => (
                            <span
                              key={type}
                              className="inline-flex items-center gap-1 rounded-lg bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-400"
                            >
                              <CarIcon className="h-3 w-3" />
                              {type === 'MANUAL' ? 'Manual' : type === 'AUTOMATIC' ? 'Auto' : type}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-500">N/A</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <StarIcon className="h-4 w-4 text-yellow-400" />
                        <span className="text-sm font-medium text-white">
                          {driver.currentRating?.toFixed(1) || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={driver.status} isOnline={driver.onlineStatus} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleViewDriver(driver.id)}
                          className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600 transition-colors flex items-center gap-1"
                        >
                          <EyeIcon className="h-3.5 w-3.5" />
                          View Profile
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
          totalItems={pagination.total}
          itemsPerPage={pagination.limit}
        />
      </div>
    </DashboardLayout>
  );
}
