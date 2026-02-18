'use client';

import { useState, useEffect } from 'react';
import { attendanceService } from '@/services/attendanceService';

interface AttendanceSummaryProps {
  className?: string;
  date?: Date;
}

interface AttendanceStats {
  present: number;
  absent: number;
  leave: number;
  late: number;
  onTime: number;
  total: number;
}

const AttendanceSummary = ({ className = '', date }: AttendanceSummaryProps) => {
  const [currentDate] = useState<Date>(() => date || new Date());
  const [stats, setStats] = useState<AttendanceStats>({
    present: 0,
    absent: 0,
    leave: 0,
    late: 0,
    onTime: 0,
    total: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAttendanceStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch attendance data for the specified date
      const response = await attendanceService.getMonitorData();
      const data = response.data?.data || response.data;
      
      if (data) {
        setStats({
          present: data.present || 0,
          absent: data.absent || 0,
          leave: data.leave || 0,
          late: data.late || 0,
          onTime: data.onTime || 0,
          total: (data.present || 0) + (data.absent || 0) + (data.leave || 0)
        });
      }
    } catch (err: any) {
      console.error('Error fetching attendance stats:', err);
      setError(err.message || 'Failed to fetch attendance data');
      
      // Set empty stats on error
      setStats({
        present: 0,
        absent: 0,
        leave: 0,
        late: 0,
        onTime: 0,
        total: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceStats();
  }, [currentDate]);

  if (isLoading) {
    return (
      <div className={`bg-gray-900/50 border border-gray-800 rounded-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-800 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-20 bg-gray-800 rounded"></div>
            <div className="h-20 bg-gray-800 rounded"></div>
            <div className="h-20 bg-gray-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && stats.total === 0) {
    return (
      <div className={`bg-red-500/10 border border-red-500/30 rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <div className="text-red-400 font-medium mb-2">Data Unavailable</div>
          <div className="text-sm text-red-300">{error}</div>
          <button 
            onClick={fetchAttendanceStats}
            className="mt-3 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const presentPercentage = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;
  const onTimePercentage = stats.present > 0 ? Math.round((stats.onTime / stats.present) * 100) : 0;

  return (
    <div className={`bg-gray-900/50 border border-gray-800 rounded-lg p-6 ${className}`} suppressHydrationWarning>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Attendance Summary</h3>
        <div className="text-sm text-gray-400">
          {currentDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* Present */}
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-400">{stats.present}</div>
              <div className="text-sm text-gray-300">Present</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-green-400">{presentPercentage}%</div>
              <div className="text-xs text-gray-400">of total</div>
            </div>
          </div>
        </div>
        
        {/* Absent */}
        <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/30 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-400">{stats.absent}</div>
          <div className="text-sm text-gray-300">Absent</div>
        </div>
        
        {/* On Leave */}
        <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-500/30 rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-400">{stats.leave}</div>
          <div className="text-sm text-gray-300">On Leave</div>
        </div>
      </div>
      
      {/* Additional Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* On Time */}
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xl font-bold text-blue-400">{stats.onTime}</div>
              <div className="text-sm text-gray-300">On Time</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-blue-400">{onTimePercentage}%</div>
              <div className="text-xs text-gray-400">of present</div>
            </div>
          </div>
        </div>
        
        {/* Late Arrivals */}
        <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xl font-bold text-orange-400">{stats.late}</div>
              <div className="text-sm text-gray-300">Late Arrivals</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-orange-400">
                {stats.present > 0 ? Math.round((stats.late / stats.present) * 100) : 0}%
              </div>
              <div className="text-xs text-gray-400">of present</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Summary Footer */}
      <div className="mt-4 pt-4 border-t border-gray-800">
        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-400">
            Total Staff: <span className="text-white font-medium">{stats.total}</span>
          </div>
          <div className="text-gray-400">
            Updated: <span className="text-white font-medium">{currentDate.toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceSummary;