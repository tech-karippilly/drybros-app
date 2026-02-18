'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAppSelector } from '@/lib/hooks';
import { selectCurrentUser } from '@/lib/features/auth/authSlice';
import ClockButtons from '@/components/attendance/ClockButtons';
import OnlineMembersCount from '@/components/attendance/OnlineMembersCount';

// Icons
const UsersIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const CheckCircleIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CalendarIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ClipboardIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const AlertIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const ClockIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CarIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
);

const TruckIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0h4" />
  </svg>
);

const UserPlusIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
  </svg>
);

const LogoutIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const LinkIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

// Types
interface DashboardStats {
  activeStaff: number;
  staffChange: number;
  todayAttendance: {
    present: number;
    total: number;
  };
  todayBookings: number;
  bookingsChange: number;
  pendingApprovals: number;
}

interface StaffMember {
  id: string;
  name: string;
  status: 'PRESENT' | 'ABSENT' | 'ON_BREAK';
  clockInTime?: string;
  profilePic?: string;
}

interface FleetVehicle {
  id: string;
  driver: string;
  vehicle: string;
  currentTask: string;
  status: 'ON_DUTY' | 'IN_TRIP' | 'IDLE';
}

interface WeeklyData {
  day: string;
  bookings: number;
}

// Stat Card Component
interface StatCardProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  value: string | React.ReactNode;
  subtitle?: string;
  badge?: React.ReactNode;
}

const StatCard = ({ icon, iconBg, title, value, subtitle, badge }: StatCardProps) => (
  <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
    <div className="flex items-start justify-between mb-4">
      <div className={`rounded-lg p-3 ${iconBg}`}>
        {icon}
      </div>
      {badge}
    </div>
    <div>
      <p className="text-sm text-gray-400 mb-1">{title}</p>
      <div className="text-2xl font-bold text-white">{value}</div>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  </div>
);

// Staff Availability Item
const StaffAvailabilityItem = ({ staff }: { staff: StaffMember }) => {
  const statusColors = {
    PRESENT: 'bg-green-500',
    ABSENT: 'bg-red-500',
    ON_BREAK: 'bg-yellow-500',
  };

  const statusLabels = {
    PRESENT: 'PRESENT',
    ABSENT: 'ABSENT',
    ON_BREAK: 'ON BREAK',
  };

  const statusTextColors = {
    PRESENT: 'text-green-400',
    ABSENT: 'text-red-400',
    ON_BREAK: 'text-yellow-400',
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-sm font-medium text-blue-400">
            {staff.profilePic ? (
              <img src={staff.profilePic} alt={staff.name} className="h-10 w-10 rounded-full object-cover" />
            ) : (
              staff.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
            )}
          </div>
          <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-gray-900 ${statusColors[staff.status]}`} />
        </div>
        <div>
          <p className="text-sm font-medium text-white">{staff.name}</p>
          <p className={`text-xs font-medium ${statusTextColors[staff.status]}`}>
            {statusLabels[staff.status]}
            {staff.clockInTime && staff.status === 'PRESENT' && ` • IN AT ${staff.clockInTime}`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default function ManagerDashboardPage() {
  const router = useRouter();
  const currentUser = useAppSelector(selectCurrentUser);
  const franchiseId = currentUser?.franchiseId;
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState<DashboardStats>({
    activeStaff: 12,
    staffChange: 2,
    todayAttendance: {
      present: 8,
      total: 12,
    },
    todayBookings: 156,
    bookingsChange: -3,
    pendingApprovals: 7,
  });

  const [weeklyData] = useState<WeeklyData[]>([
    { day: 'MON', bookings: 180 },
    { day: 'TUE', bookings: 210 },
    { day: 'WED', bookings: 195 },
    { day: 'THU', bookings: 245 },
    { day: 'FRI', bookings: 280 },
    { day: 'SAT', bookings: 310 },
    { day: 'SUN', bookings: 290 },
  ]);

  const [staffList] = useState<StaffMember[]>([
    { id: '1', name: 'Mark Stevens', status: 'PRESENT', clockInTime: '08:30', profilePic: '' },
    { id: '2', name: 'Elena Rossi', status: 'PRESENT', clockInTime: '09:02', profilePic: '' },
    { id: '3', name: 'David Cho', status: 'ABSENT', profilePic: '' },
  ]);

  const [fleetData] = useState<FleetVehicle[]>([
    { id: '1', driver: 'John Smith', vehicle: 'DRY-001', currentTask: 'Pickup at Central Station', status: 'IN_TRIP' },
    { id: '2', driver: 'Sarah Wilson', vehicle: 'DRY-002', currentTask: 'Delivery to North Avenue', status: 'IN_TRIP' },
  ]);

  const [lateArrivals] = useState(3);
  const [shiftDuration, setShiftDuration] = useState('06:12:44');

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate max bookings for chart scaling
  const maxBookings = Math.max(...weeklyData.map(d => d.bookings));

  return (
    <DashboardLayout
      user={{ name: currentUser?.fullName || 'Manager', role: 'Franchise Manager' }}
      searchPlaceholder="Search bookings, drivers..."
      liveStatus={true}
      notificationCount={3}
    >
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-white">Manager Dashboard</h1>
          <div className="flex items-center gap-3">
            <ClockButtons
              userId={currentUser?.id || ''}
              userName={currentUser?.fullName || 'Manager'}
              userRole={currentUser?.role}
              staffId={currentUser?.staffId}
              onStatusChange={() => {
                // Refresh dashboard data if needed
              }}
            />
          </div>
        </div>
        <p className="text-sm text-gray-400">Dybros Franchise - London North Branch</p>
      </div>

      {/* Current Time & Shift Status */}
      <div className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border border-gray-800 bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-400 uppercase tracking-wider mb-2">Current Time</p>
              <p className="text-4xl font-bold text-white mb-1">
                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
              </p>
              <p className="text-sm text-gray-400">
                {currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-2 rounded-full bg-green-500/10 border border-green-500/30 px-3 py-1.5 mb-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium text-green-400">ON SHIFT</span>
              </div>
              <p className="text-2xl font-bold text-blue-400">{shiftDuration}</p>
              <p className="text-xs text-gray-500">Shift Duration</p>
            </div>
          </div>
        </div>
                
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
          <p className="text-sm text-gray-400 mb-4">Branch Overview</p>
          <p className="text-3xl font-bold text-white mb-1">North London</p>
          <p className="text-sm text-gray-500">Real-time performance and driver logistics</p>
        </div>
      </div>
              
      {/* Staff/Driver Counts */}
      <div className="mb-8">
        <OnlineMembersCount franchiseId={franchiseId} />
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<UsersIcon className="h-6 w-6 text-blue-400" />}
          iconBg="bg-blue-500/10"
          title="Active Staff"
          value={stats.activeStaff}
          badge={
            <span className="text-xs font-medium text-green-400">
              +{stats.staffChange}%
            </span>
          }
        />

        <StatCard
          icon={<CheckCircleIcon className="h-6 w-6 text-green-400" />}
          iconBg="bg-green-500/10"
          title="Today's Attendance"
          value={
            <div className="flex items-baseline gap-2">
              <span>{stats.todayAttendance.present}/{stats.todayAttendance.total}</span>
            </div>
          }
          subtitle="Staff Present"
        />

        <StatCard
          icon={<CalendarIcon className="h-6 w-6 text-purple-400" />}
          iconBg="bg-purple-500/10"
          title="Today's Bookings"
          value={stats.todayBookings}
          badge={
            <span className="text-xs font-medium text-red-400">
              {stats.bookingsChange}%
            </span>
          }
        />

        <StatCard
          icon={<ClipboardIcon className="h-6 w-6 text-orange-400" />}
          iconBg="bg-orange-500/10"
          title="Pending Approvals"
          value={stats.pendingApprovals}
          subtitle="Action Required"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Weekly Booking Performance */}
        <div className="lg:col-span-2 rounded-xl border border-gray-800 bg-gray-900/50 p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">Weekly Booking Performance</h2>
              <p className="text-sm text-gray-400">Total volume aggregated per day</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-blue-400">1,240</p>
              <p className="text-xs text-green-400">↑ 5% VS PREV.</p>
            </div>
          </div>

          {/* Chart */}
          <div className="h-64 flex items-end justify-between gap-2">
            {weeklyData.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div className="relative w-full flex items-end justify-center" style={{ height: '200px' }}>
                  <div 
                    className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg hover:from-blue-400 hover:to-blue-300 transition-all cursor-pointer relative group"
                    style={{ height: `${(data.bookings / maxBookings) * 100}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white whitespace-nowrap">
                      {data.bookings} bookings
                    </div>
                  </div>
                </div>
                <span className="text-xs font-medium text-gray-400">{data.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Staff Availability */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Staff Availability</h2>
            <button className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors">
              Manage Rosters
            </button>
          </div>

          <div className="space-y-3 mb-6">
            {staffList.map((staff) => (
              <StaffAvailabilityItem key={staff.id} staff={staff} />
            ))}
          </div>

          {/* Late Arrivals Alert */}
          {lateArrivals > 0 && (
            <div className="rounded-lg bg-orange-500/10 border border-orange-500/30 p-4">
              <div className="flex items-start gap-3">
                <AlertIcon className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-orange-400">Late Arrivals</p>
                  <p className="text-xs text-orange-300 mt-1">
                    {lateArrivals} staff members clocked in after 09:15 today.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active Fleet Status */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Active Fleet Status</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-xs text-gray-400">32 ON DUTY</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="text-xs text-gray-400">12 IN TRIP</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-gray-500" />
              <span className="text-xs text-gray-400">4 IDLE</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Driver</th>
                <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Vehicle</th>
                <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Current Task</th>
                <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Status</th>
                <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-gray-400">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {fleetData.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-xs font-medium text-blue-400">
                        {vehicle.driver.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-sm text-white">{vehicle.driver}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <TruckIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-300">{vehicle.vehicle}</span>
                    </div>
                  </td>
                  <td className="py-4 text-sm text-gray-300">{vehicle.currentTask}</td>
                  <td className="py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      vehicle.status === 'ON_DUTY' ? 'bg-green-500/10 text-green-400 border border-green-500/30' :
                      vehicle.status === 'IN_TRIP' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' :
                      'bg-gray-500/10 text-gray-400 border border-gray-500/30'
                    }`}>
                      {vehicle.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 ml-auto">
                      <LinkIcon className="h-4 w-4" />
                      Track
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
