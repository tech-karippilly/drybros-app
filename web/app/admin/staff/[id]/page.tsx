'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { staffService } from '@/services/staffService';
import { Staff, StaffStatus, StaffHistoryItem } from '@/lib/types/staff';
import { useAppSelector } from '@/lib/hooks';
import { selectCurrentUser } from '@/lib/features/auth/authSlice';
import { adminRoutes } from '@/lib/constants/routes';

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

const MailIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const PhoneIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const MapPinIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const CalendarIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const DollarIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const BriefcaseIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const BuildingIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const UserIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const ClockIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const AlertIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const CheckIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const HistoryIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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

const BanIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
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
    [StaffStatus.ACTIVE]: 'Active',
    [StaffStatus.SUSPENDED]: 'Suspended',
    [StaffStatus.FIRED]: 'Fired',
    [StaffStatus.BLOCKED]: 'Blocked',
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${styles[status] || styles[StaffStatus.BLOCKED]}`}>
      <span className={`w-2 h-2 rounded-full mr-2 ${
        status === StaffStatus.ACTIVE ? 'bg-green-400' :
        status === StaffStatus.SUSPENDED ? 'bg-yellow-400' :
        'bg-red-400'
      }`} />
      {labels[status] || status}
    </span>
  );
};

// Role Badge Component
const RoleBadge = ({ role }: { role?: string }) => {
  if (!role) {
    return (
      <span className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium bg-gray-500/10 text-gray-400 border-gray-500/30">
        N/A
      </span>
    );
  }

  const styles: Record<string, string> = {
    'OFFICE_STAFF': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    'STAFF': 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  };

  const labels: Record<string, string> = {
    'OFFICE_STAFF': 'Office Staff',
    'STAFF': 'Staff',
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${styles[role] || styles['STAFF']}`}>
      {labels[role] || role}
    </span>
  );
};

// History Item Component
const HistoryItem = ({ item }: { item: StaffHistoryItem }) => {
  const getActionIcon = (action: string) => {
    if (action.includes('CREATE')) return <CheckIcon className="h-4 w-4 text-green-400" />;
    if (action.includes('UPDATE')) return <EditIcon className="h-4 w-4 text-blue-400" />;
    if (action.includes('SUSPEND')) return <PauseIcon className="h-4 w-4 text-yellow-400" />;
    if (action.includes('FIRE')) return <FireIcon className="h-4 w-4 text-red-400" />;
    if (action.includes('BLOCK')) return <BanIcon className="h-4 w-4 text-red-400" />;
    if (action.includes('DELETE')) return <BanIcon className="h-4 w-4 text-red-400" />;
    return <HistoryIcon className="h-4 w-4 text-gray-400" />;
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATE')) return 'text-green-400';
    if (action.includes('UPDATE')) return 'text-blue-400';
    if (action.includes('SUSPEND')) return 'text-yellow-400';
    if (action.includes('FIRE') || action.includes('BLOCK') || action.includes('DELETE')) return 'text-red-400';
    return 'text-gray-400';
  };

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/30 border border-gray-800">
      <div className="flex-shrink-0 mt-0.5">
        {getActionIcon(item.action)}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${getActionColor(item.action)}`}>
          {item.action.replace(/_/g, ' ')}
        </p>
        {item.reason && (
          <p className="text-xs text-gray-400 mt-1">{item.reason}</p>
        )}
        {item.oldValue && item.newValue && (
          <p className="text-xs text-gray-500 mt-1">
            Changed from &quot;{item.oldValue}&quot; to &quot;{item.newValue}&quot;
          </p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          {new Date(item.createdAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default function StaffDetailPage() {
  const router = useRouter();
  const params = useParams();
  const currentUser = useAppSelector(selectCurrentUser);
  const staffId = params.id as string;

  const [staff, setStaff] = useState<Staff | null>(null);
  const [history, setHistory] = useState<StaffHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');

  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      const response = await staffService.getStaffById(staffId);
      if (response.data?.success) {
        setStaff(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch staff:', error);
    } finally {
      setLoading(false);
    }
  }, [staffId]);

  const fetchHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const response = await staffService.getStaffHistory(staffId);
      if (response.data?.success) {
        setHistory(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setHistoryLoading(false);
    }
  }, [staffId]);

  useEffect(() => {
    fetchStaff();
    fetchHistory();
  }, [fetchStaff, fetchHistory]);

  const handleBack = () => {
    router.push(adminRoutes.STAFF);
  };

  const handleEdit = () => {
    router.push(adminRoutes.STAFF + `/${staffId}/edit`);
  };

  if (loading) {
    return (
      <DashboardLayout
        user={{ name: currentUser?.fullName || 'Admin User', role: currentUser?.role || 'Administrator' }}
      >
        <div className="flex items-center justify-center h-96">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!staff) {
    return (
      <DashboardLayout
        user={{ name: currentUser?.fullName || 'Admin User', role: currentUser?.role || 'Administrator' }}
      >
        <div className="text-center py-12">
          <UserIcon className="mx-auto h-12 w-12 text-gray-600" />
          <p className="mt-4 text-lg text-gray-400">Staff member not found</p>
          <button
            onClick={handleBack}
            className="mt-4 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
          >
            Back to Staff List
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      user={{ name: currentUser?.fullName || 'Admin User', role: currentUser?.role || 'Administrator' }}
    >
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          <span className="text-sm">Back to Staff Directory</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-xl font-bold text-blue-400">
              {staff.profilePic ? (
                <img 
                  src={staff.profilePic} 
                  alt={staff.name}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                staff.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{staff.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={staff.status} suspendedUntil={staff.suspendedUntil} />
                <RoleBadge role={staff.role as string | undefined} />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
            >
              <EditIcon className="h-4 w-4" />
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-800 mb-6">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 text-sm font-medium transition-colors relative ${
              activeTab === 'overview' 
                ? 'text-blue-400' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Overview
            {activeTab === 'overview' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 text-sm font-medium transition-colors relative ${
              activeTab === 'history' 
                ? 'text-blue-400' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Activity History
            {activeTab === 'history' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t-full" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'overview' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Personal Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Personal Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-800">
                    <MailIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm text-white">{staff.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-800">
                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm text-white">{staff.phone}</p>
                  </div>
                </div>
                {staff.address && (
                  <div className="flex items-center gap-3 sm:col-span-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-800">
                      <MapPinIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Address</p>
                      <p className="text-sm text-white">{staff.address}</p>
                    </div>
                  </div>
                )}
                {staff.emergencyContact && (
                  <div className="flex items-center gap-3 sm:col-span-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-800">
                      <AlertIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Emergency Contact</p>
                      <p className="text-sm text-white">
                        {staff.emergencyContact} 
                        {staff.emergencyContactRelation && ` (${staff.emergencyContactRelation})`}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Employment Details */}
            <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Employment Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-800">
                    <BuildingIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Franchise</p>
                    <p className="text-sm text-white">{staff.Franchise?.name || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-800">
                    <BriefcaseIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Role</p>
                    <p className="text-sm text-white">{staff.role === 'OFFICE_STAFF' ? 'Office Staff' : 'Staff'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-800">
                    <DollarIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Monthly Salary</p>
                    <p className="text-sm text-white">${staff.monthlySalary.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-800">
                    <CalendarIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Joined</p>
                    <p className="text-sm text-white">
                      {new Date(staff.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Stats */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Quick Stats</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/30">
                  <span className="text-sm text-gray-400">Warnings</span>
                  <span className={`text-lg font-bold ${(staff.warningCount || 0) > 0 ? 'text-yellow-400' : 'text-gray-400'}`}>
                    {staff.warningCount || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/30">
                  <span className="text-sm text-gray-400">Complaints</span>
                  <span className={`text-lg font-bold ${(staff.complaintCount || 0) > 0 ? 'text-red-400' : 'text-gray-400'}`}>
                    {staff.complaintCount || 0}
                  </span>
                </div>
                {staff.attendanceSummary && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/30">
                    <span className="text-sm text-gray-400">Attendance</span>
                    <span className={`text-lg font-bold ${
                      (staff.attendanceSummary.attendancePercentage || 0) >= 90 ? 'text-green-400' :
                      (staff.attendanceSummary.attendancePercentage || 0) >= 75 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {staff.attendanceSummary.attendancePercentage?.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Status Info */}
            {staff.status !== StaffStatus.ACTIVE && (
              <div className={`rounded-xl border p-6 ${
                staff.status === StaffStatus.SUSPENDED 
                  ? 'border-yellow-500/30 bg-yellow-500/10' 
                  : 'border-red-500/30 bg-red-500/10'
              }`}>
                <h2 className="text-lg font-semibold text-white mb-2">Status Information</h2>
                <p className={`text-sm ${
                  staff.status === StaffStatus.SUSPENDED ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  This staff member is currently {staff.status.toLowerCase()}.
                </p>
                {staff.suspendedUntil && (
                  <p className="text-sm text-gray-400 mt-2">
                    Suspended until: {new Date(staff.suspendedUntil).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}

            {/* Staff ID */}
            <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
              <h2 className="text-sm font-medium text-gray-400 mb-2">Staff ID</h2>
              <p className="text-sm font-mono text-white">{staff.id}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Activity History</h2>
          {historyLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <HistoryIcon className="mx-auto h-12 w-12 text-gray-600" />
              <p className="mt-4 text-sm text-gray-500">No activity history found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <HistoryItem key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
