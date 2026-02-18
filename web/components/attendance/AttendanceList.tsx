'use client';

import { useState, useEffect, useRef } from 'react';
import { attendanceService } from '@/services/attendanceService';

interface AttendanceRecord {
  id: string;
  name: string;
  loginTime: string | null;
  clockInTime: string | null;
  clockOutTime: string | null;
  logoutTime: string | null;
  timeWorked: string | null;
  date: string;
  status: string;
  role: string;
}

interface AttendanceListProps {
  className?: string;
  date?: Date;
  franchiseId?: string;
}

// Helper function to validate UUID format
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

const AttendanceList = ({ className = '', date = new Date(), franchiseId }: AttendanceListProps) => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'loginTime' | 'clockInTime' | 'timeWorked'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Ref for cleanup
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Format time for display
  const formatTime = (dateString: string | null) => {
    if (!dateString) return '--:--';
    try {
      return new Date(dateString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return '--:--';
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Calculate time worked in hours:minutes format
  const calculateTimeWorked = (clockIn: string | null, clockOut: string | null) => {
    if (!clockIn || !clockOut) return '--:--';
    
    try {
      const inTime = new Date(clockIn);
      const outTime = new Date(clockOut);
      const diffMs = outTime.getTime() - inTime.getTime();
      
      if (diffMs <= 0) return '--:--';
      
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    } catch {
      return '--:--';
    }
  };

  // Fetch attendance data
  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // For admin, use the /all endpoint to get all attendance records
      const params: any = {
        startDate: date.toISOString().split('T')[0],
        endDate: date.toISOString().split('T')[0],
        page: 1,
        limit: 100
      };
      
      // Only add franchiseId if it's a valid UUID and not an empty string
      if (franchiseId && franchiseId.trim() !== '' && isValidUUID(franchiseId)) {
        params.franchiseId = franchiseId;
      }
      
      const response = await attendanceService.getAllAttendances(params);
      
      const data = response.data?.data || response.data || [];
      
      // Transform data to match our interface and remove duplicates
      const processedRecords = new Map<string, AttendanceRecord>();
      
      data.forEach((record: any) => {
        // Create a unique key for each person on a specific date
        const personId = record.staffId || record.driverId || record.userId || 'unknown';
        const recordDate = new Date(record.date).toDateString();
        const uniqueKey = `${personId}-${recordDate}`;
        
        // Get person name
        const name = record.Staff?.name || 
                    (record.Driver ? `${record.Driver.firstName} ${record.Driver.lastName}` : '') || 
                    record.User?.fullName || 'Unknown';
        
        const role = record.Staff ? 'Staff' : record.Driver ? 'Driver' : record.User ? 'Manager' : 'Unknown';
        
        // If this person already has a record for this date, merge the data
        if (processedRecords.has(uniqueKey)) {
          const existingRecord = processedRecords.get(uniqueKey)!;
          
          // Keep the earliest login time
          if (record.loginTime && (!existingRecord.loginTime || 
              new Date(record.loginTime) < new Date(existingRecord.loginTime))) {
            existingRecord.loginTime = record.loginTime;
          }
          
          // Keep the earliest clock-in time
          if (record.clockIn && (!existingRecord.clockInTime || 
              new Date(record.clockIn) < new Date(existingRecord.clockInTime))) {
            existingRecord.clockInTime = record.clockIn;
          }
          
          // Keep the latest clock-out time
          if (record.clockOut && (!existingRecord.clockOutTime || 
              new Date(record.clockOut) > new Date(existingRecord.clockOutTime))) {
            existingRecord.clockOutTime = record.clockOut;
          }
          
          // Keep the latest logout time
          if (record.logoutTime && (!existingRecord.logoutTime || 
              new Date(record.logoutTime) > new Date(existingRecord.logoutTime))) {
            existingRecord.logoutTime = record.logoutTime;
          }
          
          // Recalculate time worked with the merged times
          existingRecord.timeWorked = calculateTimeWorked(existingRecord.clockInTime, existingRecord.clockOutTime);
        } else {
          // Create new record
          processedRecords.set(uniqueKey, {
            id: record.id,
            name,
            loginTime: record.loginTime,
            clockInTime: record.clockIn,
            clockOutTime: record.clockOut,
            logoutTime: record.logoutTime || null,
            timeWorked: calculateTimeWorked(record.clockIn, record.clockOut),
            date: record.date,
            status: record.status,
            role
          });
        }
      });
      
      // Convert map values to array
      const transformedData: AttendanceRecord[] = Array.from(processedRecords.values());
      
      setAttendanceRecords(transformedData);
    } catch (err: any) {
      console.error('Error fetching attendance data:', err);
      setError(err.message || 'Failed to fetch attendance data');
      
      // Set empty array when there's an error
      setAttendanceRecords([]);
    } finally {
      setLoading(false);
    }
  };

  // Sort records
  const sortedRecords = [...attendanceRecords].sort((a, b) => {
    let aValue: string | number = '';
    let bValue: string | number = '';
    
    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'loginTime':
        aValue = a.loginTime ? new Date(a.loginTime).getTime() : 0;
        bValue = b.loginTime ? new Date(b.loginTime).getTime() : 0;
        break;
      case 'clockInTime':
        aValue = a.clockInTime ? new Date(a.clockInTime).getTime() : 0;
        bValue = b.clockInTime ? new Date(b.clockInTime).getTime() : 0;
        break;
      case 'timeWorked':
        // Convert time worked to minutes for comparison
        const parseTime = (timeStr: string) => {
          if (timeStr === '--:--') return 0;
          const [hours, minutes] = timeStr.split(':').map(Number);
          return hours * 60 + minutes;
        };
        aValue = parseTime(a.timeWorked || '--:--');
        bValue = parseTime(b.timeWorked || '--:--');
        break;
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
    } else {
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
    }
  });

  // Handle sorting
  const handleSort = (column: 'name' | 'loginTime' | 'clockInTime' | 'timeWorked') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  useEffect(() => {
    fetchAttendanceData();
    
    // Set up interval for periodic sync (every 5 seconds)
    const syncInterval = setInterval(() => {
      fetchAttendanceData();
    }, 5000);
    
    // Cleanup interval on unmount
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      clearInterval(syncInterval);
    };
  }, [date, franchiseId]);

  if (loading) {
    return (
      <div className={`bg-gray-900/50 border border-gray-800 rounded-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-800 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-800 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-500/10 border border-red-500/30 rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <div className="text-red-400 font-medium mb-2">Failed to Load Attendance Data</div>
          <div className="text-sm text-red-300">{error}</div>
          <button 
            onClick={fetchAttendanceData}
            className="mt-3 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-900/50 border border-gray-800 rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Attendance Records</h3>
        <div className="text-sm text-gray-400">
          {formatDate(date.toISOString())}
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th 
                className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400 cursor-pointer hover:text-gray-300"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-1">
                  Name
                  {sortBy === 'name' && (
                    <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th 
                className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400 cursor-pointer hover:text-gray-300"
                onClick={() => handleSort('loginTime')}
              >
                <div className="flex items-center gap-1">
                  Login Time
                  {sortBy === 'loginTime' && (
                    <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th 
                className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400 cursor-pointer hover:text-gray-300"
                onClick={() => handleSort('clockInTime')}
              >
                <div className="flex items-center gap-1">
                  Clock In
                  {sortBy === 'clockInTime' && (
                    <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                Clock Out
              </th>
              <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                Logout Time
              </th>
              <th 
                className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400 cursor-pointer hover:text-gray-300"
                onClick={() => handleSort('timeWorked')}
              >
                <div className="flex items-center gap-1">
                  Time Worked
                  {sortBy === 'timeWorked' && (
                    <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                Status
              </th>
              <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                Role
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {sortedRecords.map((record) => (
              <tr key={record.id} className="hover:bg-gray-800/30 transition-colors">
                <td className="py-4">
                  <div className="text-sm font-medium text-white">{record.name}</div>
                </td>
                <td className="py-4">
                  <div className="text-sm text-gray-300">{formatTime(record.loginTime)}</div>
                </td>
                <td className="py-4">
                  <div className={`text-sm font-medium ${record.clockInTime ? 'text-green-400' : 'text-gray-500'}`}>
                    {formatTime(record.clockInTime)}
                  </div>
                </td>
                <td className="py-4">
                  <div className={`text-sm ${record.clockOutTime ? 'text-red-400' : 'text-gray-500'}`}>
                    {formatTime(record.clockOutTime)}
                  </div>
                </td>
                <td className="py-4">
                  <div className="text-sm text-gray-300">{formatTime(record.logoutTime)}</div>
                </td>
                <td className="py-4">
                  <div className={`text-sm font-medium ${record.timeWorked !== '--:--' ? 'text-blue-400' : 'text-gray-500'}`}>
                    {record.timeWorked}
                  </div>
                </td>
                <td className="py-4">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    record.status === 'PRESENT' 
                      ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                      : record.status === 'ABSENT'
                      ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                      : 'bg-gray-500/10 text-gray-400 border border-gray-500/30'
                  }`}>
                    {record.status}
                  </span>
                </td>
                <td className="py-4">
                  <div className="text-sm text-gray-300">{record.role}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {attendanceRecords.length === 0 && !loading && !error && (
        <div className="text-center py-8 text-gray-400">
          No attendance records found for this date
        </div>
      )}
      
      <div className="mt-4 pt-4 border-t border-gray-800">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <div>
            Showing {attendanceRecords.length} records
          </div>
          <div>
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceList;