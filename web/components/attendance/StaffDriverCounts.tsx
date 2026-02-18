'use client';

import { useState, useEffect } from 'react';
import { socketService } from '@/services/socketService';
import { useSocketEventDebounce } from '@/hooks/useDebounce';
import { useAppSelector } from '@/lib/hooks';
import { selectCurrentUser } from '@/lib/features/auth/authSlice';

interface StaffDriverCountsProps {
  className?: string;
}

interface Counts {
  staff: number;
  drivers: number;
  total: number;
}

const StaffDriverCounts = ({ className = '' }: StaffDriverCountsProps) => {
  const [counts, setCounts] = useState<Counts>({
    staff: 0,
    drivers: 0,
    total: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [initialCounts, setInitialCounts] = useState<Counts | null>(null);
  const currentUser = useAppSelector(selectCurrentUser);

  // Set initial state for hydration
  useEffect(() => {
    setMounted(true);
    if (!initialCounts) {
      setInitialCounts({
        staff: 0,
        drivers: 0,
        total: 0
      });
    }
  }, [initialCounts]);

  // Use initial counts during SSR to prevent hydration mismatch
  const displayCounts = mounted ? counts : (initialCounts || {
    staff: 0,
    drivers: 0,
    total: 0
  });

  // Debounced handler for updating counts
  const debouncedUpdateCounts = useSocketEventDebounce((data: any) => {
    updateCounts(data);
  }, 500);

  // Update counts based on socket data
  const updateCounts = (data: any) => {
    try {
      let staff = 0;
      let drivers = 0;

      // Handle different data formats
      if (data?.staff) {
        // Online staff list payload - filter by franchise if applicable
        staff = data.staff.filter((s: any) => {
          // If user has a franchise, only include staff from that franchise
          if (currentUser?.franchiseId) {
            return s.onlineStatus && s.franchiseId === currentUser.franchiseId;
          }
          return s.onlineStatus;
        }).length;
      }
      
      if (data?.drivers) {
        // Online drivers list payload - filter by franchise if applicable
        drivers = data.drivers.filter((d: any) => {
          // If user has a franchise, only include drivers from that franchise
          if (currentUser?.franchiseId) {
            return d.onlineStatus && d.franchiseId === currentUser.franchiseId;
          }
          return d.onlineStatus;
        }).length;
      }
      
      if (data?.onlineStatus !== undefined) {
        // Individual status change payload
        if (data.staffId) {
          // This is a staff member
          if (currentUser?.franchiseId && data.franchiseId !== currentUser.franchiseId) {
            // If this is franchise-specific and the staff member doesn't belong to this franchise, ignore
            return;
          }
          if (data.onlineStatus) {
            staff = displayCounts.staff + 1;
          } else {
            staff = Math.max(0, displayCounts.staff - 1);
          }
        } else if (data.driverId) {
          // This is a driver
          if (currentUser?.franchiseId && data.franchiseId !== currentUser.franchiseId) {
            // If this is franchise-specific and the driver doesn't belong to this franchise, ignore
            return;
          }
          if (data.onlineStatus) {
            drivers = displayCounts.drivers + 1;
          } else {
            drivers = Math.max(0, displayCounts.drivers - 1);
          }
        }
      }

      const total = staff + drivers;
      
      setCounts({
        staff,
        drivers,
        total
      });
    } catch (err) {
      console.error('Error updating counts:', err);
    }
  };

  // Fetch initial data
  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check if user is authenticated before connecting
      if (!socketService.isAuthenticated()) {
        setError('User not authenticated. Please log in again.');
        setIsLoading(false);
        return;
      }
      
      // Connect to socket
      await socketService.connect();
      
      // Only request data if socket is successfully connected
      if (socketService.isConnected()) {
        // Request data for user's franchise only
        const franchiseId = currentUser?.franchiseId;
        socketService.requestOnlineStaff(franchiseId);
        socketService.requestOnlineDrivers(franchiseId);
      } else {
        throw new Error('Socket connection established but not connected');
      }
      
    } catch (err: any) {
      console.error('Error connecting to socket:', err);
      
      // Handle specific error cases
      if (err.message === 'Invalid authentication token') {
        setError('Authentication failed. Please refresh the page and log in again.');
        return;
      }
      
      setError('Failed to connect to real-time updates');
    } finally {
      setIsLoading(false);
    }
  };

  // Setup socket listeners
  useEffect(() => {
    // Listen for staff status changes
    socketService.on('staff:status-changed', debouncedUpdateCounts);
    
    // Listen for driver status changes
    socketService.on('driver:status-changed', debouncedUpdateCounts);
    
    // Listen for online staff list
    socketService.on('online:staff-list', debouncedUpdateCounts);
    
    // Listen for online drivers list
    socketService.on('online:drivers-list', debouncedUpdateCounts);

    // Fetch initial data
    fetchInitialData();

    // Cleanup on unmount
    return () => {
      socketService.off('staff:status-changed', debouncedUpdateCounts);
      socketService.off('driver:status-changed', debouncedUpdateCounts);
      socketService.off('online:staff-list', debouncedUpdateCounts);
      socketService.off('online:drivers-list', debouncedUpdateCounts);
    };
  }, []);

  // Join franchise room if user has franchise
  useEffect(() => {
    if (currentUser?.franchiseId) {
      socketService.joinRoom(`franchise:${currentUser.franchiseId}`);
    }
    
    return () => {
      if (currentUser?.franchiseId) {
        socketService.leaveRoom(`franchise:${currentUser.franchiseId}`);
      }
    };
  }, [currentUser?.franchiseId]);

  if (isLoading) {
    return (
      <div className={`bg-gray-900/50 border border-gray-800 rounded-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-800 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-16 bg-gray-800 rounded"></div>
            <div className="h-16 bg-gray-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-500/10 border border-red-500/30 rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <div className="text-red-400 font-medium mb-2">Connection Error</div>
          <div className="text-sm text-red-300">{error}</div>
          <button 
            onClick={() => fetchInitialData()}
            className="mt-3 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-900/50 border border-gray-800 rounded-lg p-6 ${className}`} suppressHydrationWarning>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Team Availability</h3>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-xs text-gray-400">Live</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Staff Count */}
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-400">{displayCounts.staff}</div>
              <div className="text-sm text-gray-300">Staff Online</div>
            </div>
            <div className="text-3xl">👥</div>
          </div>
        </div>
        
        {/* Drivers Count */}
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-400">{displayCounts.drivers}</div>
              <div className="text-sm text-gray-300">Drivers Online</div>
            </div>
            <div className="text-3xl">🚗</div>
          </div>
        </div>
      </div>
      
      {/* Total Count */}
      <div className="mt-4 pt-4 border-t border-gray-800">
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xl font-bold text-purple-400">{displayCounts.total}</div>
              <div className="text-sm text-gray-300">Total Team Members Online</div>
            </div>
            <div className="text-2xl">👥</div>
          </div>
        </div>
      </div>
      
      <div className="mt-3 text-xs text-gray-500 text-center">
        Real-time updates enabled • Last updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};

export default StaffDriverCounts;