'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAppSelector } from '@/lib/hooks';
import { selectCurrentUser } from '@/lib/features/auth/authSlice';
import { franchiseService } from '@/services/franchiseService';
import Button from '@/components/ui/Button';

// Icons
const BuildingIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
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

const ArrowLeftIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

// Types
interface Franchise {
  id: string;
  code: string;
  name: string;
  city: string;
  region?: string;
  address?: string;
  phone?: string;
  email?: string;
  inchargeName?: string;
  managerEmail?: string;
  managerPhone?: string;
  storeImage?: string;
  legalDocumentsCollected?: boolean;
  status: 'ACTIVE' | 'BLOCKED' | 'TEMPORARILY_CLOSED';
  isActive: boolean;
  driverCount?: number;
  staffCount?: number;
  monthlyRevenue?: number;
  createdAt: string;
  updatedAt: string;
}

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

// Status Badge Component
const StatusBadge = ({ status }: { status: string }) => {
  const styles = {
    ACTIVE: 'bg-green-500/10 text-green-400 border-green-500/30',
    BLOCKED: 'bg-red-500/10 text-red-400 border-red-500/30',
    TEMPORARILY_CLOSED: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  };

  const labels: Record<string, string> = {
    ACTIVE: 'Active',
    BLOCKED: 'Blocked',
    TEMPORARILY_CLOSED: 'Temporarily Closed',
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${styles[status as keyof typeof styles] || styles.BLOCKED}`}>
      {labels[status] || status}
    </span>
  );
};

export default function ManagerFranchisePage() {
  const router = useRouter();
  const currentUser = useAppSelector(selectCurrentUser);
  
  const [franchise, setFranchise] = useState<Franchise | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMyFranchise();
  }, []);

  const fetchMyFranchise = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await franchiseService.getMyFranchise();
      // Handle both {success, data} wrapper and direct data response
      const responseData = response.data;
      if (responseData?.success && responseData.data) {
        setFranchise(responseData.data);
      } else if (responseData?.data) {
        // Direct data response
        setFranchise(responseData.data);
      } else if (responseData) {
        // Direct franchise object
        setFranchise(responseData);
      } else {
        setError('No franchise data received');
      }
    } catch (err: any) {
      console.error('Failed to fetch franchise:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load franchise details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout
        user={{ name: currentUser?.fullName || 'Manager', role: 'Franchise Manager' }}
        searchPlaceholder="Search..."
        liveStatus={true}
      >
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !franchise) {
    return (
      <DashboardLayout
        user={{ name: currentUser?.fullName || 'Manager', role: 'Franchise Manager' }}
        searchPlaceholder="Search..."
        liveStatus={true}
      >
        <div className="flex flex-col items-center justify-center h-96">
          <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
            <XCircleIcon className="h-8 w-8 text-red-400" />
          </div>
          <p className="text-gray-400 mb-4">{error || 'Franchise not found'}</p>
          <Button onClick={fetchMyFranchise} color="primary">
            Try Again
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      user={{ name: currentUser?.fullName || 'Manager', role: 'Franchise Manager' }}
      searchPlaceholder="Search..."
      liveStatus={true}
    >
      {/* Back Button */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/manager/dashboard')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          <span>Back to Dashboard</span>
        </button>
      </div>

      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">My Franchise</h1>
            <p className="mt-1 text-sm text-gray-400">View your franchise details and information</p>
          </div>
          <StatusBadge status={franchise.status} />
        </div>
      </div>

      {/* Franchise Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Franchise Info Card */}
        <div className="lg:col-span-2 rounded-xl border border-gray-800 bg-gray-900/50 p-6">
          <div className="flex items-start gap-6">
            {/* Franchise Image */}
            <div className="h-24 w-24 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {franchise.storeImage ? (
                <img 
                  src={franchise.storeImage} 
                  alt={franchise.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <BuildingIcon className="h-10 w-10 text-blue-400" />
              )}
            </div>
            
            {/* Franchise Details */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-bold text-white">{franchise.name}</h2>
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-800 text-gray-400">
                  {franchise.code}
                </span>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                {franchise.city}{franchise.region ? `, ${franchise.region}` : ''}
              </p>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4">
                <InfoCard icon={CarIcon} label="Drivers" value={franchise.driverCount || 0} color="blue" />
                <InfoCard icon={UsersIcon} label="Staff" value={franchise.staffCount || 0} color="purple" />
                <InfoCard 
                  icon={DollarIcon} 
                  label="Monthly Revenue" 
                  value={`$${(franchise.monthlyRevenue || 0).toLocaleString()}`} 
                  color="green" 
                />
              </div>
            </div>
          </div>

          {/* Address */}
          {franchise.address && (
            <div className="mt-6 pt-6 border-t border-gray-800">
              <div className="flex items-start gap-3">
                <MapPinIcon className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-white">Address</p>
                  <p className="text-sm text-gray-400">{franchise.address}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Contact & Documents */}
        <div className="space-y-6">
          {/* Contact Information */}
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Contact Information</h3>
            <div className="space-y-4">
              {franchise.phone && (
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <PhoneIcon className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Phone</p>
                    <p className="text-sm text-white">{franchise.phone}</p>
                  </div>
                </div>
              )}
              {franchise.email && (
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <MailIcon className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Email</p>
                    <p className="text-sm text-white">{franchise.email}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Legal Documents Status */}
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Legal Compliance</h3>
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                franchise.legalDocumentsCollected ? 'bg-green-500/10' : 'bg-orange-500/10'
              }`}>
                {franchise.legalDocumentsCollected ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-400" />
                ) : (
                  <XCircleIcon className="h-5 w-5 text-orange-400" />
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Documents</p>
                <p className={`text-sm font-medium ${
                  franchise.legalDocumentsCollected ? 'text-green-400' : 'text-orange-400'
                }`}>
                  {franchise.legalDocumentsCollected ? 'Complete' : 'Pending'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Manager Details */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Manager Information</h2>
        {franchise.inchargeName ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                {franchise.inchargeName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{franchise.inchargeName}</p>
                <p className="text-xs text-gray-500">Franchise Manager</p>
              </div>
            </div>
            
            {franchise.managerEmail && (
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <MailIcon className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Email</p>
                  <p className="text-sm text-white">{franchise.managerEmail}</p>
                </div>
              </div>
            )}
            
            {franchise.managerPhone && (
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <PhoneIcon className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Phone</p>
                  <p className="text-sm text-white">{franchise.managerPhone}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="h-16 w-16 rounded-full bg-gray-800 flex items-center justify-center mb-4">
              <UserIcon className="h-8 w-8 text-gray-600" />
            </div>
            <p className="text-gray-400">No manager information available</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
