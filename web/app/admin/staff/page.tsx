'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { staffService } from '@/services/staffService';
import { franchiseService } from '@/services/franchiseService';
import { Staff, StaffFilters, StaffStatus, StaffRole } from '@/lib/types/staff';
import { Franchise } from '@/lib/types/franchise';
import { useAppSelector } from '@/lib/hooks';
import { selectCurrentUser } from '@/lib/features/auth/authSlice';
import { adminRoutes } from '@/lib/constants/routes';

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

const TrashIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const XIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const BuildingIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const UsersIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
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

const PauseIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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

  const startItem = ((currentPage - 1) * itemsPerPage) + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex items-center justify-between border-t border-gray-800 bg-gray-900/30 px-4 py-3">
      <div className="text-sm text-gray-400">
        Showing {startItem} to {endItem} of {totalItems} staff members
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

// Action Confirmation Modal
interface ActionModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmVariant: 'danger' | 'warning' | 'primary';
  staffName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing: boolean;
  extraContent?: React.ReactNode;
}

const ActionConfirmationModal = ({ 
  isOpen, 
  title, 
  message, 
  confirmLabel, 
  confirmVariant, 
  staffName,
  onConfirm, 
  onCancel, 
  isProcessing,
  extraContent
}: ActionModalProps) => {
  if (!isOpen) return null;

  const variantStyles = {
    danger: 'bg-red-500 hover:bg-red-600',
    warning: 'bg-yellow-500 hover:bg-yellow-600',
    primary: 'bg-blue-500 hover:bg-blue-600',
  };

  const iconStyles = {
    danger: 'bg-red-500/10 text-red-500',
    warning: 'bg-yellow-500/10 text-yellow-500',
    primary: 'bg-blue-500/10 text-blue-500',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconStyles[confirmVariant]}`}>
              {confirmVariant === 'danger' ? <TrashIcon className="h-5 w-5" /> :
               confirmVariant === 'warning' ? <BanIcon className="h-5 w-5" /> :
               <CheckIcon className="h-5 w-5" />}
            </div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-300 mb-3">
            {message} <span className="font-semibold text-white">{staffName}</span>?
          </p>
          {extraContent}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isProcessing}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${variantStyles[confirmVariant]}`}
          >
            {isProcessing ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Processing...
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Suspend Modal with Date Picker
interface SuspendModalProps {
  isOpen: boolean;
  staffName: string;
  onConfirm: (suspendedUntil: string | null) => void;
  onCancel: () => void;
  isProcessing: boolean;
}

const SuspendModal = ({ isOpen, staffName, onConfirm, onCancel, isProcessing }: SuspendModalProps) => {
  const [suspendedUntil, setSuspendedUntil] = useState<string>('');
  const [isIndefinite, setIsIndefinite] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(isIndefinite ? null : suspendedUntil || null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10 text-yellow-500">
              <PauseIcon className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-white">Suspend Staff</h3>
          </div>
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-300 mb-4">
            Suspend <span className="font-semibold text-white">{staffName}</span>? They will not be able to access the system during suspension.
          </p>
          
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isIndefinite}
                onChange={(e) => setIsIndefinite(e.target.checked)}
                className="rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500"
              />
              Indefinite suspension
            </label>
            
            {!isIndefinite && (
              <div>
                <label className="block text-sm text-gray-400 mb-1">Suspension End Date</label>
                <input
                  type="date"
                  value={suspendedUntil}
                  onChange={(e) => setSuspendedUntil(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isProcessing || (!isIndefinite && !suspendedUntil)}
            className="flex-1 rounded-lg bg-yellow-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Suspending...
              </>
            ) : (
              <>
                <PauseIcon className="h-4 w-4" />
                Suspend
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Page Component
export default function StaffPage() {
  const router = useRouter();
  const currentUser = useAppSelector(selectCurrentUser);
  
  const [staff, setStaff] = useState<Staff[]>([]);
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<StaffFilters>({
    page: 1,
    limit: 10,
    search: '',
    status: '',
    franchiseId: '',
    role: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Action modals state
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    type: 'suspend' | 'fire' | 'block' | 'delete' | 'activate' | null;
    staff: Staff | null;
  }>({ isOpen: false, type: null, staff: null });
  const [isProcessing, setIsProcessing] = useState(false);

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

  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = {
        page: filters.page,
        limit: filters.limit,
      };
      
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.franchiseId) params.franchiseId = filters.franchiseId;
      if (filters.role) params.role = filters.role;
      
      const response = await staffService.getStaffList(params);
      
      if (response.data?.success) {
        setStaff(response.data.data || []);
        setPagination(response.data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
      }
    } catch (error) {
      console.error('Failed to fetch staff:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchFranchises();
  }, [fetchFranchises]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }));
  };

  const handleStatusChange = (status: string) => {
    setFilters(prev => ({ ...prev, status: prev.status === status ? '' : status, page: 1 }));
  };

  const handleFranchiseChange = (franchiseId: string) => {
    setFilters(prev => ({ ...prev, franchiseId: prev.franchiseId === franchiseId ? '' : franchiseId, page: 1 }));
  };

  const handleRoleChange = (role: string) => {
    setFilters(prev => ({ ...prev, role: prev.role === role ? '' : role, page: 1 }));
  };

  const handleViewStaff = (id: string) => {
    router.push(adminRoutes.STAFF + `/${id}`);
  };

  const handleEditStaff = (id: string) => {
    router.push(adminRoutes.STAFF + `/${id}/edit`);
  };

  const handleCreateStaff = () => {
    router.push(adminRoutes.STAFF + '/create');
  };

  const handleActionClick = (staff: Staff, type: 'suspend' | 'fire' | 'block' | 'delete' | 'activate') => {
    setActionModal({ isOpen: true, type, staff });
  };

  const handleActionConfirm = async (suspendedUntil?: string | null) => {
    if (!actionModal.staff || !actionModal.type) return;

    setIsProcessing(true);
    try {
      const staffId = actionModal.staff.id;
      
      switch (actionModal.type) {
        case 'suspend':
          await staffService.updateStaffStatus(staffId, { 
            status: StaffStatus.SUSPENDED,
            suspendedUntil: suspendedUntil || undefined
          });
          break;
        case 'fire':
          await staffService.updateStaffStatus(staffId, { status: StaffStatus.FIRED });
          break;
        case 'block':
          await staffService.updateStaffStatus(staffId, { status: StaffStatus.BLOCKED });
          break;
        case 'activate':
          await staffService.updateStaffStatus(staffId, { status: StaffStatus.ACTIVE });
          break;
        case 'delete':
          await staffService.deleteStaff(staffId);
          break;
      }
      
      setActionModal({ isOpen: false, type: null, staff: null });
      fetchStaff();
    } catch (error) {
      console.error('Failed to perform action:', error);
      alert('Failed to perform action. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleActionCancel = () => {
    if (!isProcessing) {
      setActionModal({ isOpen: false, type: null, staff: null });
    }
  };

  // Calculate stats
  const activeCount = staff.filter(s => s.status === StaffStatus.ACTIVE).length;
  const suspendedCount = staff.filter(s => s.status === StaffStatus.SUSPENDED).length;
  const totalFranchises = new Set(staff.map(s => s.franchiseId)).size;

  return (
    <DashboardLayout
      user={{ name: currentUser?.fullName || 'Admin User', role: currentUser?.role || 'Administrator' }}
      searchPlaceholder="Search staff or ID..."
      liveStatus={true}
      notificationCount={0}
    >
      {/* Suspend Modal */}
      <SuspendModal
        isOpen={actionModal.isOpen && actionModal.type === 'suspend'}
        staffName={actionModal.staff?.name || ''}
        onConfirm={(date) => handleActionConfirm(date)}
        onCancel={handleActionCancel}
        isProcessing={isProcessing}
      />

      {/* Fire Modal */}
      <ActionConfirmationModal
        isOpen={actionModal.isOpen && actionModal.type === 'fire'}
        title="Fire Staff"
        message="Are you sure you want to fire"
        confirmLabel="Fire Staff"
        confirmVariant="danger"
        staffName={actionModal.staff?.name || ''}
        onConfirm={() => handleActionConfirm()}
        onCancel={handleActionCancel}
        isProcessing={isProcessing}
        extraContent={
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <p className="text-sm text-red-400">
              This action will terminate their employment. They will no longer be able to access the system.
            </p>
          </div>
        }
      />

      {/* Block Modal */}
      <ActionConfirmationModal
        isOpen={actionModal.isOpen && actionModal.type === 'block'}
        title="Block Staff"
        message="Are you sure you want to block"
        confirmLabel="Block"
        confirmVariant="danger"
        staffName={actionModal.staff?.name || ''}
        onConfirm={() => handleActionConfirm()}
        onCancel={handleActionCancel}
        isProcessing={isProcessing}
        extraContent={
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <p className="text-sm text-red-400">
              This will block the staff member from accessing the system permanently.
            </p>
          </div>
        }
      />

      {/* Delete Modal */}
      <ActionConfirmationModal
        isOpen={actionModal.isOpen && actionModal.type === 'delete'}
        title="Delete Staff"
        message="Are you sure you want to permanently delete"
        confirmLabel="Delete Forever"
        confirmVariant="danger"
        staffName={actionModal.staff?.name || ''}
        onConfirm={() => handleActionConfirm()}
        onCancel={handleActionCancel}
        isProcessing={isProcessing}
        extraContent={
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <p className="text-sm text-red-400 font-medium mb-2">⚠️ This action cannot be undone!</p>
            <p className="text-xs text-red-300">
              This will permanently delete all staff records, attendance history, and associated data.
            </p>
          </div>
        }
      />

      {/* Activate Modal */}
      <ActionConfirmationModal
        isOpen={actionModal.isOpen && actionModal.type === 'activate'}
        title="Activate Staff"
        message="Are you sure you want to reactivate"
        confirmLabel="Activate"
        confirmVariant="primary"
        staffName={actionModal.staff?.name || ''}
        onConfirm={() => handleActionConfirm()}
        onCancel={handleActionCancel}
        isProcessing={isProcessing}
      />

      {/* Page Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Staff Directory</h1>
          <p className="mt-1 text-sm text-gray-400">Manage and monitor personnel across all franchise branches.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-900/50 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
          >
            <FilterIcon className="h-4 w-4 text-gray-400" />
            <span>Filters</span>
          </button>

          <button 
            onClick={handleCreateStaff}
            className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Add New Staff
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="mb-6 rounded-xl border border-gray-800 bg-gray-900/50 p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={handleSearchChange}
                  placeholder="Search by name, email, or phone..."
                  className="w-full rounded-lg border border-gray-700 bg-gray-900/50 py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {/* Status Filters */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 uppercase font-medium">Status:</span>
              {Object.values(StaffStatus).map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filters.status === status
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Role Filters */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 uppercase font-medium">Role:</span>
              {Object.values(StaffRole).map((role) => (
                <button
                  key={role}
                  onClick={() => handleRoleChange(role)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filters.role === role
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {role === StaffRole.OFFICE_STAFF ? 'Office Staff' : 'Staff'}
                </button>
              ))}
            </div>

            {/* Franchise Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 uppercase font-medium">Franchise:</span>
              <select
                value={filters.franchiseId}
                onChange={(e) => handleFranchiseChange(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 text-gray-400 border border-gray-700 focus:border-blue-500 focus:outline-none"
              >
                <option value="">All Franchises</option>
                {franchises.map((franchise) => (
                  <option key={franchise.id} value={franchise.id}>
                    {franchise.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <UsersIcon className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase">Total Active</p>
              <p className="text-2xl font-bold text-white">{activeCount}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10">
              <PauseIcon className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase">Suspended</p>
              <p className="text-2xl font-bold text-white">{suspendedCount}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <BuildingIcon className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase">Total Branches</p>
              <p className="text-2xl font-bold text-white">{totalFranchises || franchises.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/80">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Staff Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Franchise</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Role</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Contact</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                    </div>
                  </td>
                </tr>
              ) : staff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <UsersIcon className="mx-auto h-12 w-12 text-gray-600" />
                    <p className="mt-4 text-sm text-gray-500">No staff members found</p>
                  </td>
                </tr>
              ) : (
                staff.map((staffMember) => (
                  <tr key={staffMember.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-sm font-medium text-blue-400">
                          {staffMember.profilePic ? (
                            <img 
                              src={staffMember.profilePic} 
                              alt={staffMember.name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            staffMember.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{staffMember.name}</p>
                          <p className="text-xs text-gray-400">{staffMember.id.slice(0, 8).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm text-gray-300">{staffMember.Franchise?.name || staffMember.franchise?.name || 'N/A'}</p>
                        <p className="text-xs text-gray-500">{staffMember.Franchise?.code || staffMember.franchise?.code || ''}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <RoleBadge role={staffMember.role} />
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm text-gray-300">{staffMember.email}</p>
                        <p className="text-xs text-gray-500">{staffMember.phone}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge 
                        status={staffMember.status} 
                        suspendedUntil={staffMember.suspendedUntil}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleViewStaff(staffMember.id)}
                          className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700 transition-colors"
                          title="View Details"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditStaff(staffMember.id)}
                          className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600 transition-colors"
                          title="Edit"
                        >
                          <EditIcon className="h-4 w-4" />
                        </button>
                        
                        {/* Action Dropdown */}
                        {staffMember.status === StaffStatus.ACTIVE ? (
                          <>
                            <button
                              onClick={() => handleActionClick(staffMember, 'suspend')}
                              className="rounded-lg bg-yellow-500/20 px-3 py-1.5 text-xs font-medium text-yellow-400 hover:bg-yellow-500/30 transition-colors"
                              title="Suspend"
                            >
                              <PauseIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleActionClick(staffMember, 'fire')}
                              className="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/30 transition-colors"
                              title="Fire"
                            >
                              <FireIcon className="h-4 w-4" />
                            </button>
                          </>
                        ) : staffMember.status === StaffStatus.SUSPENDED || staffMember.status === StaffStatus.BLOCKED ? (
                          <button
                            onClick={() => handleActionClick(staffMember, 'activate')}
                            className="rounded-lg bg-green-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600 transition-colors"
                            title="Activate"
                          >
                            <CheckIcon className="h-4 w-4" />
                          </button>
                        ) : null}
                        
                        <button
                          onClick={() => handleActionClick(staffMember, 'delete')}
                          className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 transition-colors"
                          title="Delete"
                        >
                          <TrashIcon className="h-4 w-4" />
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
        {!loading && staff.length > 0 && (
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
