'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { franchiseService } from '@/services/franchiseService';
import { Franchise } from '@/lib/types/franchise';
import { useAppSelector } from '@/lib/hooks';
import { selectCurrentUser } from '@/lib/features/auth/authSlice';
import { adminRoutes } from '@/lib/constants/routes';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

// Icons
const ArrowLeftIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const EditIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const MapPinIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const PhoneIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const MailIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const UserIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const CarIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
);

const UsersIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const DollarIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const DocumentIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const CheckCircleIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XCircleIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const RefreshIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const BanIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
  </svg>
);

const PlayIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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

// Status Badge Component
const StatusBadge = ({ status }: { status: string }) => {
  const styles = {
    ACTIVE: 'bg-green-500/10 text-green-400 border-green-500/30',
    BLOCKED: 'bg-red-500/10 text-red-400 border-red-500/30',
    TEMPORARILY_CLOSED: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  };

  const labels = {
    ACTIVE: 'Active',
    BLOCKED: 'Blocked',
    TEMPORARILY_CLOSED: 'Temporarily Closed',
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${styles[status as keyof typeof styles] || styles.TEMPORARILY_CLOSED}`}>
      {labels[status as keyof typeof labels] || status}
    </span>
  );
};

// Info Card Component
const InfoCard = ({ icon: Icon, label, value, color = 'blue' }: { icon: any, label: string, value: string | number, color?: string }) => {
  const colorStyles = {
    blue: 'bg-blue-500/10 text-blue-400',
    green: 'bg-green-500/10 text-green-400',
    purple: 'bg-purple-500/10 text-purple-400',
    orange: 'bg-orange-500/10 text-orange-400',
  };

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2 ${colorStyles[color as keyof typeof colorStyles]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
          <p className="text-lg font-semibold text-white">{value}</p>
        </div>
      </div>
    </div>
  );
};

// Change Manager Modal
interface ChangeManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (managerData: { name: string; email: string; phone: string }) => void;
  currentManager: { name: string; email: string; phone: string };
}

const ChangeManagerModal = ({ isOpen, onClose, onSubmit, currentManager }: ChangeManagerModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: currentManager.name,
        email: currentManager.email,
        phone: currentManager.phone,
      });
    }
  }, [isOpen, currentManager]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Change Manager"
      size="medium"
      footer={
        <div className="flex gap-3">
          <Button variant="outlined" color="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="contained" color="primary" onClick={handleSubmit}>
            Update Manager
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Manager Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Enter manager name"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Enter email address"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Enter phone number"
            required
          />
        </div>
      </form>
    </Modal>
  );
};

// Update Status Modal
interface UpdateStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (status: 'ACTIVE' | 'BLOCKED' | 'TEMPORARILY_CLOSED') => void;
  currentStatus: string;
}

const UpdateStatusModal = ({ isOpen, onClose, onSubmit, currentStatus }: UpdateStatusModalProps) => {
  const [selectedStatus, setSelectedStatus] = useState<'ACTIVE' | 'BLOCKED' | 'TEMPORARILY_CLOSED'>(currentStatus as any);

  useEffect(() => {
    setSelectedStatus(currentStatus as any);
  }, [currentStatus, isOpen]);

  const handleSubmit = () => {
    onSubmit(selectedStatus);
    onClose();
  };

  const statusOptions = [
    { value: 'ACTIVE', label: 'Active', description: 'Franchise is fully operational', color: 'green' },
    { value: 'BLOCKED', label: 'Blocked', description: 'Franchise is blocked due to issues', color: 'red' },
    { value: 'TEMPORARILY_CLOSED', label: 'Temporarily Closed', description: 'Franchise is temporarily closed', color: 'yellow' },
  ];

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Update Franchise Status"
      size="small"
      footer={
        <div className="flex gap-3">
          <Button variant="outlined" color="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="contained" color="primary" onClick={handleSubmit}>
            Update Status
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        {statusOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setSelectedStatus(option.value as any)}
            className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all text-left ${
              selectedStatus === option.value
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-700 bg-gray-800/50 hover:bg-gray-800'
            }`}
          >
            <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
              selectedStatus === option.value ? 'border-blue-500' : 'border-gray-500'
            }`}>
              {selectedStatus === option.value && <div className="h-2 w-2 rounded-full bg-blue-500" />}
            </div>
            <div className="flex-1">
              <p className="font-medium text-white">{option.label}</p>
              <p className="text-sm text-gray-400">{option.description}</p>
            </div>
          </button>
        ))}
      </div>
    </Modal>
  );
};

// Delete Confirmation Modal Component
interface DeleteModalProps {
  isOpen: boolean;
  franchiseName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

const DeleteConfirmationModal = ({ isOpen, franchiseName, onConfirm, onCancel, isDeleting }: DeleteModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
              <TrashIcon className="h-5 w-5 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-white">Delete Franchise</h3>
          </div>
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-gray-300 mb-3">
            Are you sure you want to delete <span className="font-semibold text-white">{franchiseName}</span>?
          </p>
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <p className="text-sm text-red-400 font-medium mb-2">⚠️ This action cannot be undone!</p>
            <p className="text-xs text-red-300">
              This will permanently delete:
            </p>
            <ul className="text-xs text-red-300 mt-2 ml-4 space-y-1 list-disc">
              <li>All drivers and their records</li>
              <li>All staff members and their records</li>
              <li>All managers associated with this franchise</li>
              <li>All trips and trip history</li>
              <li>All customers</li>
              <li>All performance and payroll data</li>
              <li>All activity logs</li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Deleting...
              </>
            ) : (
              <>
                <TrashIcon className="h-4 w-4" />
                Delete Forever
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Page Component
export default function FranchiseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const franchiseId = params.id as string;
  const currentUser = useAppSelector(selectCurrentUser);
  
  const [franchise, setFranchise] = useState<Franchise | null>(null);
  const [loading, setLoading] = useState(true);
  const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; franchise: Franchise | null }>({
    isOpen: false,
    franchise: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchFranchise = async () => {
    try {
      setLoading(true);
      const response = await franchiseService.getFranchiseById(franchiseId);
      if (response.data?.success) {
        setFranchise(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch franchise:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFranchise();
  }, [franchiseId]);

  const handleChangeManager = async (managerData: { name: string; email: string; phone: string }) => {
    try {
      await franchiseService.updateFranchise(franchiseId, {
        inchargeName: managerData.name,
        managerEmail: managerData.email,
        managerPhone: managerData.phone,
      });
      fetchFranchise();
    } catch (error) {
      console.error('Failed to update manager:', error);
    }
  };

  const handleUpdateStatus = async (status: 'ACTIVE' | 'BLOCKED' | 'TEMPORARILY_CLOSED') => {
    try {
      await franchiseService.updateFranchiseStatus(franchiseId, { status });
      fetchFranchise();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleDeleteClick = () => {
    if (franchise) {
      setDeleteModal({ isOpen: true, franchise });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.franchise) return;

    setIsDeleting(true);
    try {
      await franchiseService.deleteFranchise(deleteModal.franchise.id);
      // Redirect to franchises list after successful deletion
      router.push(adminRoutes.FRANCHISES);
    } catch (error) {
      console.error('Failed to delete franchise:', error);
      alert('Failed to delete franchise. Please try again.');
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    if (!isDeleting) {
      setDeleteModal({ isOpen: false, franchise: null });
    }
  };

  if (loading && !franchise) {
    return (
      <DashboardLayout
        user={{ name: currentUser?.fullName || 'Admin User', role: currentUser?.role || 'Administrator' }}
        searchPlaceholder="Search franchises..."
        liveStatus={true}
        notificationCount={0}
      >
        <div className="flex items-center justify-center h-96">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!franchise) {
    return (
      <DashboardLayout
        user={{ name: currentUser?.fullName || 'Admin User', role: currentUser?.role || 'Administrator' }}
        searchPlaceholder="Search franchises..."
        liveStatus={true}
        notificationCount={0}
      >
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-400">Franchise not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      user={{ name: currentUser?.fullName || 'Admin User', role: currentUser?.role || 'Administrator' }}
      searchPlaceholder="Search franchises..."
      liveStatus={true}
      notificationCount={0}
    >
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        franchiseName={deleteModal.franchise?.name || ''}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isDeleting={isDeleting}
      />

      {/* Back Button & Actions */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button
          onClick={() => router.push(adminRoutes.FRANCHISES)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          <span>Back to Franchises</span>
        </button>
        <div className="flex gap-3">
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<RefreshIcon className="h-4 w-4" />}
            onClick={() => setIsStatusModalOpen(true)}
          >
            Update Status
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<EditIcon className="h-4 w-4" />}
            onClick={() => router.push(adminRoutes.FRANCHISE_EDIT(franchiseId))}
          >
            Edit Franchise
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<TrashIcon className="h-4 w-4" />}
            onClick={handleDeleteClick}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Header Section */}
      <div className="mb-8 flex flex-col lg:flex-row gap-6">
        {/* Franchise Image */}
        <div className="lg:w-1/3">
          <div className="rounded-xl overflow-hidden border border-gray-800 bg-gray-900/50">
            {franchise.storeImage ? (
              <img
                src={franchise.storeImage}
                alt={franchise.name}
                className="w-full h-64 object-cover"
              />
            ) : (
              <div className="w-full h-64 bg-gray-800 flex items-center justify-center">
                <MapPinIcon className="h-16 w-16 text-gray-600" />
              </div>
            )}
          </div>
        </div>

        {/* Franchise Info */}
        <div className="lg:w-2/3">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">{franchise.name}</h1>
                <StatusBadge status={franchise.status} />
              </div>
              <p className="text-gray-400">{franchise.code}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <InfoCard icon={CarIcon} label="Drivers" value={franchise.driverCount || 0} color="blue" />
            <InfoCard icon={UsersIcon} label="Staff" value={franchise.staffCount || 0} color="purple" />
            <InfoCard icon={DollarIcon} label="Monthly Revenue" value={`$${(franchise.monthlyRevenue || 0).toLocaleString()}`} color="green" />
            <InfoCard 
              icon={franchise.legalDocumentsCollected ? CheckCircleIcon : XCircleIcon} 
              label="Documents" 
              value={franchise.legalDocumentsCollected ? 'Complete' : 'Pending'} 
              color={franchise.legalDocumentsCollected ? 'green' : 'orange'} 
            />
          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
            <div className="flex items-start gap-3">
              <MapPinIcon className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-white">Address</p>
                <p className="text-sm text-gray-400">{franchise.address}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information & Manager Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Contact Information */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Contact Information</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <PhoneIcon className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Phone</p>
                <p className="text-sm text-white">{franchise.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <MailIcon className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Email</p>
                <p className="text-sm text-white">{franchise.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <MapPinIcon className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Region</p>
                <p className="text-sm text-white">{franchise.region}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Manager Details */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Manager Details</h2>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              onClick={() => setIsManagerModalOpen(true)}
            >
              {franchise.inchargeName ? 'Change Manager' : 'Add Manager'}
            </Button>
          </div>
          {franchise.inchargeName ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                  {franchise.inchargeName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{franchise.inchargeName}</p>
                  <p className="text-xs text-gray-500">Franchise Manager</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <MailIcon className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Manager Email</p>
                  <p className="text-sm text-white">{franchise.managerEmail || <span className="text-gray-500 italic">Not provided</span>}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <PhoneIcon className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Manager Phone</p>
                  <p className="text-sm text-white">{franchise.managerPhone || <span className="text-gray-500 italic">Not provided</span>}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="h-16 w-16 rounded-full bg-gray-800 flex items-center justify-center mb-4">
                <UserIcon className="h-8 w-8 text-gray-600" />
              </div>
              <p className="text-gray-400 mb-2">No manager assigned</p>
              <p className="text-sm text-gray-500">Click "Add Manager" to assign a manager to this franchise</p>
            </div>
          )}
        </div>
      </div>

      {/* Additional Information */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Additional Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <p className="text-xs text-gray-500 uppercase mb-1">Legal Documents</p>
            <div className="flex items-center gap-2">
              {franchise.legalDocumentsCollected ? (
                <>
                  <CheckCircleIcon className="h-5 w-5 text-green-400" />
                  <span className="text-sm text-white">Collected</span>
                </>
              ) : (
                <>
                  <XCircleIcon className="h-5 w-5 text-red-400" />
                  <span className="text-sm text-white">Pending</span>
                </>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase mb-1">Created Date</p>
            <p className="text-sm text-white">
              {franchise.createdAt 
                ? new Date(franchise.createdAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })
                : 'N/A'
              }
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase mb-1">Franchise ID</p>
            <p className="text-sm text-gray-400 font-mono">{franchise.id}</p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ChangeManagerModal
        isOpen={isManagerModalOpen}
        onClose={() => setIsManagerModalOpen(false)}
        onSubmit={handleChangeManager}
        currentManager={{
          name: franchise.inchargeName || '',
          email: franchise.managerEmail || '',
          phone: franchise.managerPhone || '',
        }}
      />

      <UpdateStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        onSubmit={handleUpdateStatus}
        currentStatus={franchise.status}
      />
    </DashboardLayout>
  );
}
