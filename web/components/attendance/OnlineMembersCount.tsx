'use client';

import { useState, useEffect } from 'react';
import { socketService, type StatusChangePayload, type OnlineStaffListPayload, type OnlineDriversListPayload } from '@/services/socketService';
import { franchiseService } from '@/services/franchiseService';
import { useSocketEventDebounce } from '@/hooks/useDebounce';

interface OnlineCountProps {
  franchiseId?: string;
  className?: string;
}

interface OnlineCounts {
  managers: number;
  staff: number;
  drivers: number;
  total: number;
}

const OnlineMembersCount = ({ franchiseId, className = '' }: OnlineCountProps) => {
  const [onlineCounts, setOnlineCounts] = useState<OnlineCounts>({
    managers: 0,
    staff: 0,
    drivers: 0,
    total: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [initialCounts, setInitialCounts] = useState<OnlineCounts | null>(null);

  // Set initial state for hydration
  useEffect(() => {
    setMounted(true);
    if (!initialCounts) {
      setInitialCounts({
        managers: 0,
        staff: 0,
        drivers: 0,
        total: 0
      });
    }
  }, [initialCounts]);

  // Debounced handler for updating counts
  const debouncedUpdateCounts = useSocketEventDebounce((data: any) => {
    console.log('Received socket data:', data);
    updateOnlineCounts(data);
  }, 500);

  // Use initial counts during SSR to prevent hydration mismatch
  const displayCounts = mounted ? onlineCounts : (initialCounts || {
    managers: 0,
    staff: 0,
    drivers: 0,
    total: 0
  });

  // Update online counts based on socket data
  const updateOnlineCounts = (data: any) => {
    try {
      let managers = 0;
      let staff = 0;
      let drivers = 0;

      // Handle different data formats
      // Handle both new format { staff: [...] } and old format { data: [...] }
      let staffData = data?.staff || data?.data || [];
      let driversData = data?.drivers || data?.data || [];
      
      if (Array.isArray(staffData) && staffData.length > 0) {
        // Online staff list payload - filter by franchise if applicable
        const onlineStaff = staffData.filter((s: any) => {
          // If franchiseId is specified, only include staff from that franchise
          if (franchiseId) {
            return s.onlineStatus && s.franchiseId === franchiseId;
          }
          return s.onlineStatus;
        });
        staff = onlineStaff.length;
        // Count managers (assuming managers have a specific role or property)
        managers = onlineStaff.filter((s: any) => s.role === 'MANAGER' || s.isManager).length;
      }
      
      if (Array.isArray(driversData) && driversData.length > 0) {
        // Online drivers list payload - filter by franchise if applicable
        const onlineDrivers = driversData.filter((d: any) => {
          // If franchiseId is specified, only include drivers from that franchise
          if (franchiseId) {
            return d.onlineStatus && d.franchiseId === franchiseId;
          }
          return d.onlineStatus;
        });
        drivers = onlineDrivers.length;
      }
      
      if (data?.onlineStatus !== undefined) {
        // Individual status change payload
        if (data.staffId) {
          // This is a staff member
          if (franchiseId && data.franchiseId !== franchiseId) {
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
          if (franchiseId && data.franchiseId !== franchiseId) {
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

      const total = managers + staff + drivers;
      
      setOnlineCounts({
        managers,
        staff,
        drivers,
        total
      });
    } catch (err) {
      console.error('Error updating online counts:', err);
    }
  };

  // Fetch initial data with retry logic
  const fetchInitialData = async (retryCount = 0) => {
    const maxRetries = 3;
    
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
        // Use the franchiseId from props if available, otherwise get from current user
        // Admins see all franchises (undefined), others see only their franchise
        const requestFranchiseId = franchiseId;
              
        // Wait a bit to ensure socket is fully connected before requesting data
        setTimeout(() => {
          socketService.requestOnlineStaff(requestFranchiseId);
          socketService.requestOnlineDrivers(requestFranchiseId);
        }, 100);
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
      
      if (err.message === 'Failed to connect to socket after maximum attempts') {
        setError('Unable to establish real-time connection. Please check your internet connection.');
        return;
      }
      
      // Retry logic for other errors
      if (retryCount < maxRetries) {
        console.log(`Retrying socket connection (${retryCount + 1}/${maxRetries})...`);
        setTimeout(() => {
          fetchInitialData(retryCount + 1);
        }, 2000 * (retryCount + 1)); // Exponential backoff
        return;
      }
      
      setError('Failed to connect to real-time updates after multiple attempts');
    } finally {
      if (retryCount >= maxRetries || !error) {
        setIsLoading(false);
      }
    }
  };

  // Setup socket listeners
  useEffect(() => {
    let isMounted = true;
    
    const setupSocket = async () => {
      if (!isMounted) return;
      
      try {
        // Listen for staff status changes
        socketService.on('staff:status-changed', debouncedUpdateCounts);
        
        // Listen for driver status changes
        socketService.on('driver:status-changed', debouncedUpdateCounts);
        
        // Listen for online staff list
        socketService.on('online:staff-list', debouncedUpdateCounts);
        
        // Listen for online drivers list
        socketService.on('online:drivers-list', debouncedUpdateCounts);

        // Fetch initial data
        await fetchInitialData();
      } catch (error) {
        console.error('Error setting up socket:', error);
      }
    };
    
    setupSocket();

    // Cleanup on unmount
    return () => {
      isMounted = false;
      socketService.off('staff:status-changed', debouncedUpdateCounts);
      socketService.off('driver:status-changed', debouncedUpdateCounts);
      socketService.off('online:staff-list', debouncedUpdateCounts);
      socketService.off('online:drivers-list', debouncedUpdateCounts);
      // Disconnect socket when component unmounts
      socketService.disconnect();
    };
  }, []);

  // Join franchise room if user has franchise
  useEffect(() => {
    if (franchiseId) {
      socketService.joinRoom(`franchise:${franchiseId}`);
    }
    
    return () => {
      if (franchiseId) {
        socketService.leaveRoom(`franchise:${franchiseId}`);
      }
    };
  }, [franchiseId]);

  if (isLoading) {
    return (
      <div className={`bg-gray-900/50 border border-gray-800 rounded-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-800 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-4 gap-4">
            <div className="h-16 bg-gray-800 rounded"></div>
            <div className="h-16 bg-gray-800 rounded"></div>
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
        <h3 className="text-lg font-semibold text-white">Online Members</h3>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-xs text-gray-400">Live</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Online */}
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/30 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-400">{displayCounts.total}</div>
          <div className="text-sm text-gray-300">Total Online</div>
        </div>
        
        {/* Managers */}
        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/30 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-400">{displayCounts.managers}</div>
          <div className="text-sm text-gray-300">Managers</div>
        </div>
        
        {/* Staff */}
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/30 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-400">{displayCounts.staff}</div>
          <div className="text-sm text-gray-300">Staff</div>
        </div>
        
        {/* Drivers */}
        <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/30 rounded-lg p-4">
          <div className="text-2xl font-bold text-orange-400">{displayCounts.drivers}</div>
          <div className="text-sm text-gray-300">Drivers</div>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-800">
        <div className="text-xs text-gray-500 flex items-center justify-between">
          <span>Real-time updates enabled</span>
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
};

export default OnlineMembersCount;