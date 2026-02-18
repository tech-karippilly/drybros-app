'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/lib/hooks';
import { selectCurrentUser } from '@/lib/features/auth/authSlice';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import DatePicker from '@/components/ui/DatePicker';
import { adminRoutes } from '@/lib/constants/routes';
import ClockButtons from '@/components/attendance/ClockButtons';

// Icon Components
const CalendarIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const PlusIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const TrendingUpIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const TrendingDownIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
  </svg>
);

const MinusIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
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

const DollarIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const UsersIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const StarIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const ClockIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// Types
interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  icon: React.ReactNode;
  iconBg: string;
}

interface Franchise {
  id: string;
  code: string;
  name: string;
  activeTrips: number;
  revenue: string;
  csat: number;
  status: 'excellent' | 'high' | 'medium' | 'low';
}

interface CriticalEvent {
  id: string;
  type: 'franchise' | 'alert' | 'payout' | 'update';
  title: string;
  description: string;
  timestamp: string;
}

// Components
const StatCard = ({ title, value, change, icon, iconBg }: StatCardProps) => {
  const getChangeIcon = () => {
    if (change === undefined) return <MinusIcon className="h-3 w-3" />;
    if (change > 0) return <TrendingUpIcon className="h-3 w-3" />;
    if (change < 0) return <TrendingDownIcon className="h-3 w-3" />;
    return <MinusIcon className="h-3 w-3" />;
  };

  const getChangeColor = () => {
    if (change === undefined) return 'text-gray-400';
    if (change > 0) return 'text-green-400';
    if (change < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const getChangeText = () => {
    if (change === undefined) return 'Flat';
    if (change === 0) return 'Flat';
    return `${change > 0 ? '+' : ''}${change}%`;
  };

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
      <div className="flex items-start justify-between">
        <div className={`rounded-lg p-2.5 ${iconBg}`}>
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium ${getChangeColor()}`}>
          {getChangeIcon()}
          <span>{getChangeText()}</span>
        </div>
      </div>
      <div className="mt-4">
        <p className="text-sm text-gray-400">{title}</p>
        <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }: { status: Franchise['status'] }) => {
  const styles = {
    excellent: 'bg-green-500/10 text-green-400 border-green-500/30',
    high: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    low: 'bg-red-500/10 text-red-400 border-red-500/30',
  };

  const labels = {
    excellent: 'EXCELLENT',
    high: 'HIGH',
    medium: 'MEDIUM',
    low: 'LOW',
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

// Main Page Component
export default function AdminDashboardPage() {
  const router = useRouter();
  const currentUser = useAppSelector(selectCurrentUser);
  
  // Get user display info from Redux state
  const userName = currentUser?.fullName || 'Admin User';
  const userRole = currentUser?.role || 'Administrator';

  // Date range state
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [dateRange, setDateRange] = React.useState({
    startDate: '',
    endDate: '',
  });
  const [dateLabel, setDateLabel] = React.useState('Last 30 Days');
  const datePickerRef = React.useRef<HTMLDivElement>(null);

  // Close date picker when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    };

    if (showDatePicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDatePicker]);

  // Handle date range selection
  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    const newDateRange = { ...dateRange, [field]: value };
    setDateRange(newDateRange);

    // Update label if both dates are selected
    if (newDateRange.startDate && newDateRange.endDate) {
      const start = new Date(newDateRange.startDate);
      const end = new Date(newDateRange.endDate);
      const formattedStart = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const formattedEnd = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      setDateLabel(`${formattedStart} - ${formattedEnd}`);
    }
  };

  // Quick date range presets
  const handleQuickRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);

    const endStr = end.toISOString().split('T')[0];
    const startStr = start.toISOString().split('T')[0];

    setDateRange({ startDate: startStr, endDate: endStr });
    setDateLabel(`Last ${days} Days`);
    setShowDatePicker(false);
  };

  // Stats data
  const stats: StatCardProps[] = [
    {
      title: 'Total Franchises',
      value: '-',
      change: undefined,
      icon: <BuildingIcon className="h-5 w-5 text-blue-400" />,
      iconBg: 'bg-blue-500/10',
    },
    {
      title: 'Active Trips',
      value: '-',
      change: undefined,
      icon: <CarIcon className="h-5 w-5 text-orange-400" />,
      iconBg: 'bg-orange-500/10',
    },
    {
      title: 'Daily Revenue',
      value: '-',
      change: undefined,
      icon: <DollarIcon className="h-5 w-5 text-green-400" />,
      iconBg: 'bg-green-500/10',
    },
    {
      title: 'Active Drivers',
      value: '-',
      change: undefined,
      icon: <UsersIcon className="h-5 w-5 text-purple-400" />,
      iconBg: 'bg-purple-500/10',
    },
  ];

  // Franchises table data
  const franchises: Franchise[] = [];

  // Critical events data
  const events: CriticalEvent[] = [];

  return (
    <DashboardLayout
      user={{ name: userName, role: userRole }}
      searchPlaceholder="Search across all franchises..."
      liveStatus={true}
      notificationCount={0}
    >
      {/* Page Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-gray-400">Real-time performance metrics across all global branches.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <ClockButtons
            userId={currentUser?.id || ''}
            userName={currentUser?.fullName || 'Admin'}
            userRole={currentUser?.role}
            staffId={currentUser?.staffId}
            onStatusChange={() => {
              // Refresh dashboard data if needed
            }}
          />
          {/* Date Range Picker */}
          <div className="relative" ref={datePickerRef}>
            <button 
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-900/50 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
            >
              <CalendarIcon className="h-4 w-4 text-gray-400" />
              <span>{dateLabel}</span>
            </button>

            {/* Date Picker Dropdown */}
            {showDatePicker && (
              <div className="absolute right-0 top-full mt-2 z-50 w-80 sm:w-96 rounded-xl border border-gray-800 bg-gray-900 shadow-2xl">
                {/* Quick Presets */}
                <div className="border-b border-gray-800 p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Quick Select</p>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleQuickRange(7)}
                      className="rounded-lg bg-gray-800 px-3 py-2 text-xs font-medium text-white hover:bg-gray-700 transition-colors"
                    >
                      Last 7 Days
                    </button>
                    <button
                      onClick={() => handleQuickRange(30)}
                      className="rounded-lg bg-gray-800 px-3 py-2 text-xs font-medium text-white hover:bg-gray-700 transition-colors"
                    >
                      Last 30 Days
                    </button>
                    <button
                      onClick={() => handleQuickRange(90)}
                      className="rounded-lg bg-gray-800 px-3 py-2 text-xs font-medium text-white hover:bg-gray-700 transition-colors"
                    >
                      Last 90 Days
                    </button>
                  </div>
                </div>

                {/* Custom Date Range */}
                <div className="p-4 space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Custom Range</p>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-400">Start Date</label>
                      <input
                        type="date"
                        value={dateRange.startDate}
                        onChange={(e) => handleDateChange('startDate', e.target.value)}
                        className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-400">End Date</label>
                      <input
                        type="date"
                        value={dateRange.endDate}
                        onChange={(e) => handleDateChange('endDate', e.target.value)}
                        className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setShowDatePicker(false)}
                      className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => setShowDatePicker(false)}
                      disabled={!dateRange.startDate || !dateRange.endDate}
                      className="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* New Franchise Button */}
          <Button 
            color="primary" 
            startIcon={<PlusIcon className="h-4 w-4" />}
            onClick={() => router.push(adminRoutes.FRANCHISE_CREATE)}
          >
            New Franchise
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - Charts & Tables */}
        <div className="lg:col-span-2 space-y-6">
          {/* Revenue Analytics */}
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Global Revenue Analytics</h2>
                <p className="mt-1 text-sm text-gray-400">Consolidated monthly gross merchant value</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">-</p>
                <p className="text-sm text-green-400">-</p>
              </div>
            </div>
            {/* Chart Placeholder */}
            <div className="h-64 rounded-lg border border-dashed border-gray-700 bg-gray-900/30 flex items-center justify-center">
              <p className="text-sm text-gray-500">Revenue chart will be rendered here</p>
            </div>
          </div>

          {/* Top Performing Franchises */}
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Top Performing Franchises</h2>
              <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                View All
              </button>
            </div>

            {franchises.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-700 bg-gray-900/30 py-12 text-center">
                <BuildingIcon className="mx-auto h-12 w-12 text-gray-600" />
                <p className="mt-4 text-sm text-gray-500">No franchise data available</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Franchise</th>
                      <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Active Trips</th>
                      <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Revenue</th>
                      <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">CSAT</th>
                      <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {franchises.map((franchise) => (
                      <tr key={franchise.id} className="hover:bg-gray-800/50 transition-colors">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-800 text-xs font-medium text-gray-300">
                              {franchise.code}
                            </div>
                            <span className="text-sm text-white">{franchise.name}</span>
                          </div>
                        </td>
                        <td className="py-4 text-sm text-gray-300">{franchise.activeTrips}</td>
                        <td className="py-4 text-sm text-white font-medium">{franchise.revenue}</td>
                        <td className="py-4">
                          <div className="flex items-center gap-1">
                            <StarIcon className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm text-white">{franchise.csat}</span>
                          </div>
                        </td>
                        <td className="py-4">
                          <StatusBadge status={franchise.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Critical Events */}
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
            <h2 className="mb-6 text-sm font-semibold uppercase tracking-wider text-gray-400">Critical Events</h2>

            {events.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-700 bg-gray-900/30 py-8 text-center">
                <ClockIcon className="mx-auto h-10 w-10 text-gray-600" />
                <p className="mt-3 text-sm text-gray-500">No recent events</p>
              </div>
            ) : (
              <div className="space-y-4">
                {events.map((event) => (
                  <div key={event.id} className="flex gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800">
                      <ClockIcon className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{event.title}</p>
                      <p className="mt-0.5 text-xs text-gray-400 line-clamp-2">{event.description}</p>
                      <p className="mt-1 text-xs text-gray-500">{event.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
