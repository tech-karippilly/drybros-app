'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { logout, selectCurrentUser } from '@/lib/features/auth/authSlice';
import { authService } from '@/services/authService';
import { useAppSelector } from '@/lib/hooks';

// Icon Components
const SearchIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const BellIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const ChevronDownIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const ChevronRightIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const MenuIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const DashboardIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
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

const CarIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
);

const ReportIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const SettingsIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const LogoutIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

export interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export interface DashboardUser {
  name: string;
  role: string;
  avatar?: string;
}

interface DashboardLayoutComponentProps extends DashboardLayoutProps {
  user?: DashboardUser;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
  liveStatus?: boolean;
  notificationCount?: number;
}

const ClockIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CalendarCheckIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
);

const DriverIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const ConfigIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31 2.37 2.37a1.724 1.724 0 002.572 1.065c.426 1.756 2.924 1.756 3.35 0a1.724 1.724 0 002.573-1.066c1.543-.94 3.31-.826 2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const WalletIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const AlertIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

interface MenuItem {
  icon: ({ className }: { className?: string }) => React.ReactElement;
  label: string;
  href: string;
  children?: MenuItem[];
}

const CalendarIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const TimeIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const adminMenuItems: MenuItem[] = [
  { icon: DashboardIcon, label: 'Dashboard', href: '/admin/dashboard' },
  { icon: BuildingIcon, label: 'Franchises', href: '/admin/franchises' },
  { icon: UsersIcon, label: 'Staff', href: '/admin/staff' },
  { 
    icon: ConfigIcon, 
    label: 'Driver Config', 
    href: '/admin/driver-config',
    children: [
      { icon: WalletIcon, label: 'Daily Earnings', href: '/admin/driver-config/daily-earnings' },
      { icon: ReportIcon, label: 'Monthly Bonus', href: '/admin/driver-config/monthly-bonus' },
      { icon: AlertIcon, label: 'Penalties', href: '/admin/driver-config/penalties' },
      { icon: SettingsIcon, label: 'Deduction Policy', href: '/admin/driver-config/deduction-policy' },
    ]
  },
  { icon: CarIcon, label: 'Drivers', href: '/admin/drivers' },
  { 
    icon: ClockIcon, 
    label: 'Attendance', 
    href: '/admin/attendance',
    children: [
      { icon: CalendarCheckIcon, label: 'Calendar', href: '/admin/attendance' },
      { icon: CalendarIcon, label: 'Holidays', href: '/admin/holidays' },
      { icon: TimeIcon, label: 'Work Time Config', href: '/admin/working-time-config' },
    ]
  },
  { icon: ReportIcon, label: 'Reports', href: '/admin/reports' },
  { icon: SettingsIcon, label: 'Settings', href: '/admin/settings' },
];

const managerMenuItems: MenuItem[] = [
  { icon: DashboardIcon, label: 'Dashboard', href: '/manager/dashboard' },
  { icon: BuildingIcon, label: 'My Franchise', href: '/manager/franchise' },
  { icon: UsersIcon, label: 'Staff Management', href: '/manager/staff' },
  { 
    icon: ConfigIcon, 
    label: 'Driver Config', 
    href: '/manager/driver-config',
    children: [
      { icon: WalletIcon, label: 'Daily Earnings', href: '/manager/driver-config/daily-earnings' },
      { icon: ReportIcon, label: 'Monthly Bonus', href: '/manager/driver-config/monthly-bonus' },
      { icon: AlertIcon, label: 'Penalties', href: '/manager/driver-config/penalties' },
      { icon: SettingsIcon, label: 'Deduction Policy', href: '/manager/driver-config/deduction-policy' },
    ]
  },
  { icon: DriverIcon, label: 'Drivers', href: '/manager/drivers' },
  { 
    icon: ClockIcon, 
    label: 'Attendance', 
    href: '/manager/attendance',
    children: [
      { icon: CalendarCheckIcon, label: 'Calendar', href: '/manager/attendance' },
      { icon: CalendarIcon, label: 'Holidays', href: '/manager/holidays' },
      { icon: TimeIcon, label: 'Work Time Config', href: '/manager/working-time-config' },
    ]
  },
  { icon: CalendarCheckIcon, label: 'Bookings', href: '/manager/bookings' },
  { icon: ReportIcon, label: 'Reports', href: '/manager/reports' },
];

const TripIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
  </svg>
);

const CustomerIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const staffMenuItems: MenuItem[] = [
  { icon: DashboardIcon, label: 'Dashboard', href: '/staff/dashboard' },
  { icon: BuildingIcon, label: 'My Franchise', href: '/staff/franchise' },
  { icon: TripIcon, label: 'Trips', href: '/staff/trips' },
  { icon: DriverIcon, label: 'Drivers', href: '/staff/drivers' },
  { icon: CustomerIcon, label: 'Customers', href: '/staff/customers' },
  { 
    icon: ClockIcon, 
    label: 'Attendance', 
    href: '/staff/attendance',
    children: [
      { icon: CalendarCheckIcon, label: 'Calendar', href: '/staff/attendance' },
      { icon: CalendarIcon, label: 'Holidays', href: '/staff/holidays' },
    ]
  },
  { icon: ReportIcon, label: 'Complaints', href: '/staff/complaints' },
];

const driverMenuItems: MenuItem[] = [
  { icon: DashboardIcon, label: 'Dashboard', href: '/driver/dashboard' },
  { icon: BuildingIcon, label: 'My Franchise', href: '/driver/franchise' },
  { 
    icon: ClockIcon, 
    label: 'Attendance', 
    href: '/driver/attendance',
    children: [
      { icon: CalendarCheckIcon, label: 'Calendar', href: '/driver/attendance' },
    ]
  },
  { icon: CarIcon, label: 'My Cars', href: '/driver/my-cars' },
  { icon: ReportIcon, label: 'Earnings', href: '/driver/earnings' },
];

const DashboardLayout = ({
  children,
  className = '',
  user: userProp,
  onSearch,
  searchPlaceholder = 'Search across all franchises...',
  liveStatus = true,
  notificationCount = 0,
}: DashboardLayoutComponentProps) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const [expandedMenus, setExpandedMenus] = React.useState<string[]>([]);
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const currentUser = useAppSelector(selectCurrentUser);

  // Prevent hydration mismatch by waiting for client mount
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Use Redux user if no user prop provided, fallback to default
  const user = userProp || (currentUser ? {
    name: currentUser.fullName,
    role: currentUser.role,
  } : { name: 'Admin User', role: 'Administrator' });

  // Use default values during SSR to avoid hydration mismatch
  const displayUser = mounted ? user : { name: 'Admin User', role: 'Administrator' };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearch?.(e.target.value);
  };

  // Determine which menu items to show based on current route
  const getMenuItems = () => {
    if (pathname?.startsWith('/manager')) return managerMenuItems;
    if (pathname?.startsWith('/staff')) return staffMenuItems;
    if (pathname?.startsWith('/driver')) return driverMenuItems;
    return adminMenuItems;
  };
  const menuItems = getMenuItems();

  // Toggle menu expansion
  const toggleMenu = (href: string) => {
    setExpandedMenus(prev => 
      prev.includes(href) 
        ? prev.filter(h => h !== href)
        : [...prev, href]
    );
  };

  // Auto-expand parent menu if child is active
  React.useEffect(() => {
    menuItems.forEach(item => {
      if (item.children && pathname?.startsWith(item.href)) {
        if (!expandedMenus.includes(item.href)) {
          setExpandedMenus(prev => [...prev, item.href]);
        }
      }
    });
  }, [pathname, menuItems]);

  // Handle logout
  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      // Call backend logout endpoint (optional - clears tokens server-side if implemented)
      await authService.logout();
    } catch (error) {
      // Continue with local logout even if backend fails
      console.error('Backend logout failed:', error);
    } finally {
      // Clear Redux state and localStorage
      dispatch(logout());
      // Close sidebar on mobile
      setSidebarOpen(false);
      // Redirect to login page
      router.push('/login');
    }
  };

  return (
    <div className={`min-h-screen bg-[#0a0f1c] text-white ${className}`}>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed left-0 top-0 z-50 h-full w-64 bg-[#0d1424] border-r border-gray-800
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex h-16 items-center px-6 border-b border-gray-800">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            DYBROS
          </h1>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-8rem)]">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            const isExpanded = expandedMenus.includes(item.href);
            const Icon = item.icon;
            const hasChildren = item.children && item.children.length > 0;
            
            return (
              <div key={item.href}>
                {hasChildren ? (
                  <>
                    <button
                      onClick={() => toggleMenu(item.href)}
                      className={`
                        w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                        ${isActive 
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                          : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5" />
                        {item.label}
                      </div>
                      <ChevronRightIcon className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>
                    {isExpanded && (
                      <div className="ml-4 mt-1 space-y-1">
                        {item.children?.map((child) => {
                          const isChildActive = pathname === child.href;
                          const ChildIcon = child.icon;
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={() => setSidebarOpen(false)}
                              className={`
                                flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                                ${isChildActive 
                                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'}
                              `}
                            >
                              <ChildIcon className="h-4 w-4" />
                              {child.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                      ${isActive 
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                        : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'}
                    `}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                )}
              </div>
            );
          })}
        </nav>

        {/* Logout at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
          <button 
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800/50 hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogoutIcon className="h-5 w-5" />
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:ml-64">
        {/* Top Header */}
        <header className="sticky top-0 z-30 border-b border-gray-800 bg-[#0a0f1c]/95 backdrop-blur-sm">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6">
            {/* Left: Menu Button + Search */}
            <div className="flex items-center gap-4 flex-1">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
              >
                <MenuIcon className="h-5 w-5" />
              </button>

              <div className="flex-1 max-w-xl">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder={searchPlaceholder}
                    className="w-full rounded-lg border border-gray-700 bg-gray-900/50 py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2 sm:gap-4 ml-4">
              {/* Live System Badge - Hidden on small screens */}
              {liveStatus && (
                <div className="hidden sm:flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className="text-xs font-medium text-green-400">LIVE</span>
                </div>
              )}

              {/* Notifications */}
              <button className="relative rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
                <BellIcon className="h-5 w-5" />
                {notificationCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </button>

              {/* User Profile */}
              <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-gray-800">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-white">{displayUser.name}</p>
                  <p className="text-xs text-gray-400">{displayUser.role}</p>
                </div>
                <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-800 rounded-lg p-1.5 transition-colors">
                  <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs sm:text-sm font-medium">
                    {displayUser.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <ChevronDownIcon className="h-4 w-4 text-gray-400 hidden sm:block" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
