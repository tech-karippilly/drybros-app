'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { driverService } from '@/services/driverService';
import type { Driver } from '@/lib/types/driver';
import { useAppSelector } from '@/lib/hooks';
import { selectCurrentUser } from '@/lib/features/auth/authSlice';

// Icons
const ArrowLeftIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const UserIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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

const LocationIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const StarIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const CarIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
);

export default function StaffDriverDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const currentUser = useAppSelector(selectCurrentUser);
  const driverId = params.id as string;

  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState<{
    action: 'INACTIVE' | 'BLOCKED' | 'TERMINATED' | 'ACTIVE' | 'DELETE';
    title: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    const fetchDriver = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await driverService.getDriverById(driverId);
        
        if (response.data?.data) {
          setDriver(response.data.data);
        } else {
          setError('Driver not found');
        }
      } catch (err: any) {
        console.error('Failed to fetch driver:', err);
        setError(err.response?.data?.message || 'Failed to load driver details');
      } finally {
        setLoading(false);
      }
    };

    if (driverId) {
      fetchDriver();
    }
  }, [driverId]);

  const formatEmploymentType = (type: string | null) => {
    if (!type) return 'N/A';
    return type.replace('_', ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleStatusAction = async (status: 'INACTIVE' | 'BLOCKED' | 'TERMINATED' | 'ACTIVE') => {
    try {
      setActionLoading(true);
      setError(null);
      
      await driverService.updateDriverStatus(driverId, { status });
      
      // Refresh driver data
      const response = await driverService.getDriverById(driverId);
      if (response.data?.data) {
        setDriver(response.data.data);
      }
      
      setShowConfirmDialog(null);
    } catch (err: any) {
      console.error('Failed to update driver status:', err);
      setError(err.response?.data?.message || 'Failed to update driver status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setActionLoading(true);
      setError(null);
      
      await driverService.deleteDriver(driverId);
      
      // Redirect to drivers list
      router.push('/staff/drivers');
    } catch (err: any) {
      console.error('Failed to delete driver:', err);
      setError(err.response?.data?.message || 'Failed to delete driver');
      setShowConfirmDialog(null);
      setActionLoading(false);
    }
  };

  const openConfirmDialog = (action: 'INACTIVE' | 'BLOCKED' | 'TERMINATED' | 'ACTIVE' | 'DELETE') => {
    const configs = {
      INACTIVE: {
        title: 'Suspend Driver',
        message: `Are you sure you want to suspend ${driver?.firstName} ${driver?.lastName}? They will be temporarily disabled.`,
      },
      BLOCKED: {
        title: 'Block Driver',
        message: `Are you sure you want to block ${driver?.firstName} ${driver?.lastName}? They will be prevented from accessing the system.`,
      },
      TERMINATED: {
        title: 'Fire Driver',
        message: `Are you sure you want to fire ${driver?.firstName} ${driver?.lastName}? This is a permanent action and they will be blacklisted.`,
      },
      ACTIVE: {
        title: 'Reactivate Driver',
        message: `Are you sure you want to reactivate ${driver?.firstName} ${driver?.lastName}? They will be able to access the system again.`,
      },
      DELETE: {
        title: 'Delete Driver',
        message: `Are you sure you want to delete ${driver?.firstName} ${driver?.lastName}? This action cannot be undone.`,
      },
    };
    
    setShowConfirmDialog({ action, ...configs[action] });
  };

  if (loading) {
    return (
      <DashboardLayout
        user={{ name: currentUser?.fullName || 'Staff User', role: currentUser?.role || 'Staff' }}
        searchPlaceholder="Search drivers..."
        liveStatus={true}
        notificationCount={0}
      >
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !driver) {
    return (
      <DashboardLayout
        user={{ name: currentUser?.fullName || 'Staff User', role: currentUser?.role || 'Staff' }}
        searchPlaceholder="Search drivers..."
        liveStatus={true}
        notificationCount={0}
      >
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="text-6xl">❌</div>
          <h2 className="text-2xl font-bold text-white">{error || 'Driver not found'}</h2>
          <button
            onClick={() => router.push('/staff/drivers')}
            className="mt-4 flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Drivers
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      user={{ name: currentUser?.fullName || 'Staff User', role: currentUser?.role || 'Staff' }}
      searchPlaceholder="Search drivers..."
      liveStatus={true}
      notificationCount={0}
    >
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => router.push('/staff/drivers')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          <span className="text-sm font-medium">Back to Drivers</span>
        </button>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {driver.status === 'ACTIVE' && (
            <>
              <button
                onClick={() => openConfirmDialog('INACTIVE')}
                disabled={actionLoading}
                className="flex items-center gap-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 px-4 py-2 text-sm font-medium text-yellow-400 hover:bg-yellow-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suspend
              </button>
              <button
                onClick={() => openConfirmDialog('BLOCKED')}
                disabled={actionLoading}
                className="flex items-center gap-2 rounded-lg bg-orange-500/10 border border-orange-500/30 px-4 py-2 text-sm font-medium text-orange-400 hover:bg-orange-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Block
              </button>
              <button
                onClick={() => openConfirmDialog('TERMINATED')}
                disabled={actionLoading}
                className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Fire
              </button>
            </>
          )}
          {driver.status !== 'ACTIVE' && driver.status !== 'TERMINATED' && (
            <button
              onClick={() => openConfirmDialog('ACTIVE')}
              disabled={actionLoading}
              className="flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/30 px-4 py-2 text-sm font-medium text-green-400 hover:bg-green-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reactivate
            </button>
          )}
          <button
            onClick={() => openConfirmDialog('DELETE')}
            disabled={actionLoading}
            className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-2">{showConfirmDialog.title}</h3>
            <p className="text-sm text-gray-400 mb-6">{showConfirmDialog.message}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmDialog(null)}
                disabled={actionLoading}
                className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-400 hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (showConfirmDialog.action === 'DELETE') {
                    handleDelete();
                  } else {
                    handleStatusAction(showConfirmDialog.action);
                  }
                }}
                disabled={actionLoading}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Driver Profile Header */}
      <div className="mb-8 rounded-xl border border-gray-800 bg-gradient-to-br from-gray-900/80 to-gray-900/40 p-6">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20">
            <UserIcon className="h-12 w-12 text-blue-400" />
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">
                  {driver.firstName} {driver.lastName}
                </h1>
                <p className="mt-1 text-sm text-gray-400">Driver Code: {driver.driverCode}</p>
              </div>
              
              {/* Status & Rating */}
              <div className="flex flex-col items-end gap-2">
                <div className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${
                  driver.status === 'ACTIVE' 
                    ? 'bg-green-500/10 text-green-400 border-green-500/30'
                    : driver.status === 'BLOCKED'
                    ? 'bg-red-500/10 text-red-400 border-red-500/30'
                    : 'bg-gray-500/10 text-gray-400 border-gray-500/30'
                }`}>
                  {driver.status}
                </div>
                <div className="flex items-center gap-1">
                  <StarIcon className="h-5 w-5 text-yellow-400" />
                  <span className="text-lg font-bold text-white">
                    {driver.currentRating?.toFixed(1) || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-gray-800/50 p-3">
                <p className="text-xs text-gray-400">Employment</p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {formatEmploymentType(driver.employmentType)}
                </p>
              </div>
              <div className="rounded-lg bg-gray-800/50 p-3">
                <p className="text-xs text-gray-400">Complaint Count</p>
                <p className="mt-1 text-sm font-semibold text-white">{driver.complaintCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Information */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Contact Information</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <PhoneIcon className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-400">Phone</p>
                <p className="text-sm text-white">{driver.phone}</p>
                {driver.altPhone && (
                  <p className="text-sm text-gray-400">{driver.altPhone}</p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MailIcon className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-400">Email</p>
                <p className="text-sm text-white">{driver.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <LocationIcon className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-400">Address</p>
                <p className="text-sm text-white">{driver.address}</p>
                <p className="text-sm text-gray-400">
                  {driver.city}, {driver.state} - {driver.pincode}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Emergency Contact</h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-400">Name</p>
              <p className="text-sm text-white">{driver.emergencyContactName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Relation</p>
              <p className="text-sm text-white">{driver.emergencyContactRelation}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Phone</p>
              <p className="text-sm text-white">{driver.emergencyContactPhone}</p>
            </div>
          </div>
        </div>

        {/* License Details */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">License Details</h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-400">License Number</p>
              <p className="text-sm text-white">{driver.licenseNumber}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">License Type</p>
              <p className="text-sm text-white">{driver.licenseType || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Expiry Date</p>
              <p className="text-sm text-white">{formatDate(driver.licenseExpDate)}</p>
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Bank Details</h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-400">Account Name</p>
              <p className="text-sm text-white">{driver.bankAccountName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Account Number</p>
              <p className="text-sm text-white">{driver.bankAccountNumber}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">IFSC Code</p>
              <p className="text-sm text-white">{driver.bankIfscCode}</p>
            </div>
          </div>
        </div>

        {/* Documents */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Documents</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className={`rounded-lg p-3 ${driver.aadharCard ? 'bg-green-500/10 border border-green-500/30' : 'bg-gray-800/50'}`}>
              <p className="text-xs text-gray-400">Aadhar Card</p>
              <p className={`text-sm font-medium ${driver.aadharCard ? 'text-green-400' : 'text-gray-400'}`}>
                {driver.aadharCard ? 'Collected' : 'Pending'}
              </p>
            </div>
            <div className={`rounded-lg p-3 ${driver.license ? 'bg-green-500/10 border border-green-500/30' : 'bg-gray-800/50'}`}>
              <p className="text-xs text-gray-400">License</p>
              <p className={`text-sm font-medium ${driver.license ? 'text-green-400' : 'text-gray-400'}`}>
                {driver.license ? 'Collected' : 'Pending'}
              </p>
            </div>
            <div className={`rounded-lg p-3 ${driver.educationCert ? 'bg-green-500/10 border border-green-500/30' : 'bg-gray-800/50'}`}>
              <p className="text-xs text-gray-400">Education Cert</p>
              <p className={`text-sm font-medium ${driver.educationCert ? 'text-green-400' : 'text-gray-400'}`}>
                {driver.educationCert ? 'Collected' : 'Pending'}
              </p>
            </div>
            <div className={`rounded-lg p-3 ${driver.previousExp ? 'bg-green-500/10 border border-green-500/30' : 'bg-gray-800/50'}`}>
              <p className="text-xs text-gray-400">Previous Exp</p>
              <p className={`text-sm font-medium ${driver.previousExp ? 'text-green-400' : 'text-gray-400'}`}>
                {driver.previousExp ? 'Collected' : 'Pending'}
              </p>
            </div>
          </div>
        </div>

        {/* Performance Metrics (if available) */}
        {(driver as any).performance && (
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Performance Metrics</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Category</span>
                <span className={`text-sm font-medium ${
                  (driver as any).performance.category === 'GREEN' ? 'text-green-400' :
                  (driver as any).performance.category === 'YELLOW' ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {(driver as any).performance.category}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Total Trips</span>
                <span className="text-sm font-medium text-white">{(driver as any).performance.totalTrips}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Completed Trips</span>
                <span className="text-sm font-medium text-white">{(driver as any).performance.completedTrips}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Completion Rate</span>
                <span className="text-sm font-medium text-white">
                  {(driver as any).performance.completionRate}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
