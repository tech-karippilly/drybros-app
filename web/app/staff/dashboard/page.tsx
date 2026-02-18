'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { attendanceService } from '@/services/attendanceService';
import { useAppSelector } from '@/lib/hooks';
import { selectCurrentUser } from '@/lib/features/auth/authSlice';

// Icons
const ClockIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CalendarIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const TripIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
  </svg>
);

const AlertIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const UserGroupIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const TruckIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const LogoutIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

interface DashboardStats {
  tripsBooked: number;
  tripsChange: number;
  complaintsHandled: number;
  complaintsChange: number;
  avgResolutionTime: string;
  resolutionChange: number;
}

interface ActiveTrip {
  id: string;
  driver: {
    name: string;
    profilePic?: string;
  };
  destination: string;
  status: 'IN_ROUTE' | 'PICKUP' | 'WAIT_LIST';
}

export default function StaffDashboardPage() {
  const router = useRouter();
  const currentUser = useAppSelector(selectCurrentUser);
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [stats, setStats] = useState<DashboardStats>({
    tripsBooked: 24,
    tripsChange: 12,
    complaintsHandled: 2,
    complaintsChange: 0,
    avgResolutionTime: '18m',
    resolutionChange: -5,
  });

  const [activeTrips] = useState<ActiveTrip[]>([
    { 
      id: 'DB-4902', 
      driver: { name: 'Alex Rivera', profilePic: '' },
      destination: 'Downtown Central',
      status: 'IN_ROUTE'
    },
    { 
      id: 'DB-4899', 
      driver: { name: 'James Wilson', profilePic: '' },
      destination: 'West Terminal',
      status: 'PICKUP'
    },
    { 
      id: 'DB-4895', 
      driver: { name: 'Sarah Lane', profilePic: '' },
      destination: 'East District',
      status: 'WAIT_LIST'
    },
  ]);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch attendance status
  useEffect(() => {
    if (currentUser?.id) {
      fetchAttendanceStatus();
    }
  }, [currentUser]);

  const fetchAttendanceStatus = async () => {
    try {
      const response = await attendanceService.getAttendanceStatus(currentUser?.id || '');
      if (response.data) {
        setIsClockedIn(response.data.isClockedIn || false);
        if (response.data.clockInTime) {
          setClockInTime(new Date(response.data.clockInTime));
        }
      }
    } catch (error) {
      console.error('Failed to fetch attendance status:', error);
    }
  };

  const handleClockIn = async () => {
    try {
      setLoading(true);
      const response = await attendanceService.clockIn({ id: currentUser?.id || '' });
      if (response.data?.message) {
        setIsClockedIn(true);
        setClockInTime(new Date());
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to clock in');
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    try {
      setLoading(true);
      const response = await attendanceService.clockOut({ id: currentUser?.id || '' });
      if (response.data?.message) {
        setIsClockedIn(false);
        setClockInTime(null);
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to clock out');
    } finally {
      setLoading(false);
    }
  };

  // Calculate elapsed time since clock in
  const getElapsedTime = () => {
    if (!clockInTime) return { hours: '00', mins: '00', secs: '00' };
    
    const diff = new Date().getTime() - clockInTime.getTime();
    const hours = Math.floor(diff / 3600000).toString().padStart(2, '0');
    const mins = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
    const secs = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
    
    return { hours, mins, secs };
  };

  const elapsed = getElapsedTime();

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      'IN_ROUTE': { label: 'IN ROUTE', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
      'PICKUP': { label: 'PICKUP', color: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
      'WAIT_LIST': { label: 'WAIT-LIST', color: 'bg-gray-500/10 text-gray-400 border-gray-500/30' },
    };
    const badge = badges[status as keyof typeof badges] || badges['WAIT_LIST'];
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <DashboardLayout
      user={{ name: currentUser?.fullName || 'Staff User', role: 'Office Staff' }}
      searchPlaceholder="Search trips, drivers..."
      liveStatus={true}
      notificationCount={3}
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              Staff Portal
              {isClockedIn && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/30">
                  ACTIVE SHIFT
                </span>
              )}
            </h1>
            <p className="mt-1 text-sm text-gray-400">{formatDate(currentTime)}</p>
          </div>
        </div>
      </div>

      {/* Clock In/Out Section */}
      <div className="mb-6 rounded-xl border border-gray-800 bg-gradient-to-br from-gray-900/80 to-gray-800/50 p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Current Time */}
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium mb-2">CURRENT TIME</p>
            <div className="flex items-baseline gap-2">
              <p className="text-5xl font-bold text-white">{formatTime(currentTime).split(' ')[0]}</p>
              <p className="text-2xl font-medium text-gray-400">{formatTime(currentTime).split(' ')[1]}</p>
            </div>
          </div>

          {/* Elapsed Time */}
          {isClockedIn && (
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="w-20 h-20 rounded-xl border border-blue-500/30 bg-blue-500/5 flex items-center justify-center">
                  <p className="text-3xl font-bold text-blue-400">{elapsed.hours}</p>
                </div>
                <p className="text-xs text-gray-500 mt-1 uppercase">HOURS</p>
              </div>
              <p className="text-3xl text-gray-600">:</p>
              <div className="text-center">
                <div className="w-20 h-20 rounded-xl border border-blue-500/30 bg-blue-500/5 flex items-center justify-center">
                  <p className="text-3xl font-bold text-blue-400">{elapsed.mins}</p>
                </div>
                <p className="text-xs text-gray-500 mt-1 uppercase">MINS</p>
              </div>
              <p className="text-3xl text-gray-600">:</p>
              <div className="text-center">
                <div className="w-20 h-20 rounded-xl border border-blue-500/30 bg-blue-500/5 flex items-center justify-center">
                  <p className="text-3xl font-bold text-blue-400">{elapsed.secs}</p>
                </div>
                <p className="text-xs text-gray-500 mt-1 uppercase">SECS</p>
              </div>
            </div>
          )}

          {/* Clock Button */}
          <button
            onClick={isClockedIn ? handleClockOut : handleClockIn}
            disabled={loading}
            className={`flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-medium transition-all disabled:opacity-50 ${
              isClockedIn
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : isClockedIn ? (
              <>
                <LogoutIcon className="h-5 w-5" />
                Clock Out
              </>
            ) : (
              <>
                <ClockIcon className="h-5 w-5" />
                Clock In
              </>
            )}
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
          </svg>
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => router.push('/staff/trips/create')}
            className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 hover:bg-gray-800/50 transition-all text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                <TripIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white group-hover:text-blue-400 transition-colors">New Trip Booking</h3>
                <p className="text-xs text-gray-500 mt-0.5">Register a new passenger request</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => router.push('/staff/complaints/create')}
            className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 hover:bg-gray-800/50 transition-all text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors">
                <AlertIcon className="h-6 w-6 text-orange-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white group-hover:text-orange-400 transition-colors">Report Complaint</h3>
                <p className="text-xs text-gray-500 mt-0.5">Log customer or driver feedback</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => router.push('/staff/drivers/assign')}
            className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 hover:bg-gray-800/50 transition-all text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                <UserGroupIcon className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white group-hover:text-green-400 transition-colors">Assign Drivers</h3>
                <p className="text-xs text-gray-500 mt-0.5">Match idle drivers to pending trips</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Stats and Assignments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Stats Today */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            My Stats Today
          </h2>
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-800 bg-gray-800/30 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">Trips Booked</p>
                <span className={`text-xs font-medium ${stats.tripsChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {stats.tripsChange >= 0 ? '↗' : '↘'} {Math.abs(stats.tripsChange)}%
                </span>
              </div>
              <p className="text-3xl font-bold text-white mt-1">{stats.tripsBooked}</p>
            </div>

            <div className="rounded-lg border border-gray-800 bg-gray-800/30 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">Complaints Filed</p>
                <span className={`text-xs font-medium ${stats.complaintsChange >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {stats.complaintsChange >= 0 ? '↗' : '↘'} {Math.abs(stats.complaintsChange)}%
                </span>
              </div>
              <p className="text-3xl font-bold text-white mt-1">{String(stats.complaintsHandled).padStart(2, '0')}</p>
            </div>

            <div className="rounded-lg border border-gray-800 bg-gray-800/30 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">Avg Resolution Time</p>
                <span className={`text-xs font-medium ${stats.resolutionChange <= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {stats.resolutionChange <= 0 ? '↘' : '↗'} {Math.abs(stats.resolutionChange)}m
                </span>
              </div>
              <p className="text-3xl font-bold text-white mt-1">{stats.avgResolutionTime}</p>
            </div>
          </div>
        </div>

        {/* My Active Assignments */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              My Active Assignments
            </h2>
          </div>
          <div className="space-y-3">
            {activeTrips.map((trip) => (
              <div key={trip.id} className="rounded-lg border border-gray-800 bg-gray-800/30 p-4 hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-white">#{trip.id}</p>
                  {getStatusBadge(trip.status)}
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-xs font-medium text-blue-400">
                    {trip.driver.profilePic ? (
                      <img src={trip.driver.profilePic} alt={trip.driver.name} className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      trip.driver.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <p className="text-sm text-gray-300">{trip.driver.name}</p>
                </div>
                <p className="text-xs text-gray-500">{trip.destination}</p>
                <button
                  onClick={() => router.push(`/staff/trips/${trip.id}`)}
                  className="mt-3 w-full rounded-lg bg-blue-500/10 px-3 py-2 text-xs font-medium text-blue-400 hover:bg-blue-500/20 transition-colors"
                >
                  Details
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => router.push('/staff/trips')}
            className="mt-4 w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-300 hover:bg-gray-700 transition-colors"
          >
            VIEW ALL ASSIGNMENTS
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
