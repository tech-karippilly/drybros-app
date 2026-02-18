'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { staffService } from '@/services/staffService';
import { Staff, StaffStatus, StaffRole } from '@/lib/types/staff';
import { useAppSelector } from '@/lib/hooks';
import { selectCurrentUser } from '@/lib/features/auth/authSlice';

// Icons
const PlusIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
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

const EditIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const BanIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
  </svg>
);

const CheckIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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

const BriefcaseIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const FireIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
  </svg>
);

const FilterIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

// Status Badge Component
const StatusBadge = ({ status, suspendedUntil }: { status: StaffStatus; suspendedUntil?: string | null }) => {
  const styles = {
    [StaffStatus.ACTIVE]: 'bg-green-500/10 text-green-400 border-green-500/30',
    [StaffStatus.SUSPENDED]: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    [StaffStatus.FIRED]: 'bg-red-500/10 text-red-400 border-red-500/30',
    [StaffStatus.BLOCKED]: 'bg-red-500/10 text-red-400 border-red-500/30',
  };

  const labels: Record<StaffStatus, string> = {
    [StaffStatus.ACTIVE]: 'ACTIVE',
    [StaffStatus.SUSPENDED]: suspendedUntil ? 'SUSPENDED' : 'SUSPENDED',
    [StaffStatus.FIRED]: 'FIRED',
    [StaffStatus.BLOCKED]: 'BLOCKED',
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[status] || styles[StaffStatus.BLOCKED]}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
        status === StaffStatus.ACTIVE ? 'bg-green-400' :
        status === StaffStatus.SUSPENDED ? 'bg-yellow-400' :
        'bg-red-400'
      }`} />
      {labels[status] || status}
    </span>
  );
};

// Role Badge Component
const RoleBadge = ({ role }: { role?: StaffRole }) => {
  if (!role) {
    return (
      <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium bg-gray-500/10 text-gray-400 border-gray-500/30">
        N/A
      </span>
    );
  }

  const styles = {
    [StaffRole.OFFICE_STAFF]: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    [StaffRole.STAFF]: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  };

  const labels: Record<StaffRole, string> = {
    [StaffRole.OFFICE_STAFF]: 'Office Staff',
    [StaffRole.STAFF]: 'Staff',
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[role] || styles[StaffRole.STAFF]}`}>
      {labels[role] || role}
    </span>
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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-gray-800">
      <p className="text-sm text-gray-400">
        Showing <span className="font-medium text-white">{startItem}</span> to <span className="font-medium text-white">{endItem}</span> of <span className="font-medium text-white">{totalItems}</span> staff
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        {getPageNumbers().map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <span className="px-2 text-gray-500">...</span>
            ) : (
              <button
                onClick={() => onPageChange(page as number)}
                className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === page
                    ? 'bg-blue-500 text-white'
                    : 'border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600'
                }`}
              >
                {page}
              </button>
            )}
          </React.Fragment>
        ))}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// Confirmation Modal
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;
  confirmVariant?: 'danger' | 'warning' | 'success';
}

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText, confirmVariant = 'danger' }: ConfirmModalProps) => {
  if (!isOpen) return null;

  const variantStyles = {
    danger: 'bg-red-500 hover:bg-red-600',
    warning: 'bg-yellow-500 hover:bg-yellow-600',
    success: 'bg-green-500 hover:bg-green-600',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-md rounded-xl border border-gray-700 bg-gray-900 p-6">
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-gray-400 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-white transition-colors ${variantStyles[confirmVariant]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function ManagerStaffPage() {
  const router = useRouter();
  const currentUser = useAppSelector(selectCurrentUser);
  
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(10);
  
  // Modal states
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    staffId: string;
    action: 'suspend' | 'activate' | 'fire';
    staffName: string;
  }>({ isOpen: false, staffId: '', action: 'suspend', staffName: '' });

  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {
        page: currentPage,
        limit: itemsPerPage,
      };
      
      if (searchQuery) params.search = searchQuery;
      if (statusFilter) params.status = statusFilter;
      if (roleFilter) params.role = roleFilter;
      
      const response = await staffService.getStaffList(params);
      
      if (response.data.success) {
        setStaff(response.data.data);
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.totalPages);
          setTotalItems(response.data.pagination.total);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch staff');
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchQuery, statusFilter, roleFilter]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleStatusChange = async () => {
    try {
      const { staffId, action } = confirmModal;
      let newStatus: StaffStatus;
      
      switch (action) {
        case 'suspend':
          newStatus = StaffStatus.SUSPENDED;
          break;
        case 'activate':
          newStatus = StaffStatus.ACTIVE;
          break;
        case 'fire':
          newStatus = StaffStatus.FIRED;
          break;
        default:
          return;
      }
      
      await staffService.updateStaffStatus(staffId, { status: newStatus });
      fetchStaff();
      setConfirmModal({ isOpen: false, staffId: '', action: 'suspend', staffName: '' });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update staff status');
    }
  };

  const openConfirmModal = (staffId: string, action: 'suspend' | 'activate' | 'fire', staffName: string) => {
    setConfirmModal({ isOpen: true, staffId, action, staffName });
  };

  const getModalConfig = () => {
    switch (confirmModal.action) {
      case 'suspend':
        return {
          title: 'Suspend Staff',
          message: `Are you sure you want to suspend ${confirmModal.staffName}?`,
          confirmText: 'Suspend',
          confirmVariant: 'warning' as const,
        };
      case 'activate':
        return {
          title: 'Activate Staff',
          message: `Are you sure you want to activate ${confirmModal.staffName}?`,
          confirmText: 'Activate',
          confirmVariant: 'success' as const,
        };
      case 'fire':
        return {
          title: 'Fire Staff',
          message: `Are you sure you want to fire ${confirmModal.staffName}? This action cannot be undone.`,
          confirmText: 'Fire',
          confirmVariant: 'danger' as const,
        };
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Staff Management</h1>
            <p className="text-gray-400 mt-1">Manage your franchise staff members</p>
          </div>
          <button
            onClick={() => router.push('/manager/staff/create')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            Add Staff
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-400">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-lg border border-gray-700 bg-gray-900 py-2.5 pl-10 pr-4 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <FilterIcon className="h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="rounded-lg border border-gray-700 bg-gray-900 py-2.5 px-4 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value={StaffStatus.ACTIVE}>Active</option>
                <option value={StaffStatus.SUSPENDED}>Suspended</option>
                <option value={StaffStatus.FIRED}>Fired</option>
              </select>
            </div>
            
            {/* Role Filter */}
            <div className="flex items-center gap-2">
              <BriefcaseIcon className="h-5 w-5 text-gray-400" />
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="rounded-lg border border-gray-700 bg-gray-900 py-2.5 px-4 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Roles</option>
                <option value={StaffRole.OFFICE_STAFF}>Office Staff</option>
                <option value={StaffRole.STAFF}>Staff</option>
              </select>
            </div>
          </div>
        </div>

        {/* Staff Table */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : staff.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <UserIcon className="h-12 w-12 text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-white mb-1">No staff found</h3>
              <p className="text-gray-400">Try adjusting your filters or add new staff</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Staff</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Salary</th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {staff.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-sm font-medium text-blue-400">
                              {member.profilePic ? (
                                <img src={member.profilePic} alt={member.name} className="h-10 w-10 rounded-full object-cover" />
                              ) : (
                                member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{member.name}</p>
                              <p className="text-xs text-gray-400">Joined {new Date(member.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-white">{member.email}</p>
                          <p className="text-xs text-gray-400">{member.phone}</p>
                        </td>
                        <td className="px-6 py-4">
                          <RoleBadge role={member.role} />
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={member.status} suspendedUntil={member.suspendedUntil} />
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-white">₹{member.monthlySalary.toLocaleString()}</p>
                          <p className="text-xs text-gray-400">per month</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => router.push(`/manager/staff/${member.id}`)}
                              className="p-2 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                              title="View Details"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => router.push(`/manager/staff/${member.id}/edit`)}
                              className="p-2 rounded-lg text-gray-400 hover:text-green-400 hover:bg-green-500/10 transition-colors"
                              title="Edit"
                            >
                              <EditIcon className="h-4 w-4" />
                            </button>
                            {member.status === StaffStatus.ACTIVE && (
                              <button
                                onClick={() => openConfirmModal(member.id, 'suspend', member.name)}
                                className="p-2 rounded-lg text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 transition-colors"
                                title="Suspend"
                              >
                                <BanIcon className="h-4 w-4" />
                              </button>
                            )}
                            {member.status === StaffStatus.SUSPENDED && (
                              <button
                                onClick={() => openConfirmModal(member.id, 'activate', member.name)}
                                className="p-2 rounded-lg text-gray-400 hover:text-green-400 hover:bg-green-500/10 transition-colors"
                                title="Activate"
                              >
                                <CheckIcon className="h-4 w-4" />
                              </button>
                            )}
                            {member.status !== StaffStatus.FIRED && (
                              <button
                                onClick={() => openConfirmModal(member.id, 'fire', member.name)}
                                className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                title="Fire"
                              >
                                <FireIcon className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, staffId: '', action: 'suspend', staffName: '' })}
        onConfirm={handleStatusChange}
        {...getModalConfig()}
      />
    </DashboardLayout>
  );
}
