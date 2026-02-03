
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import {
  getAttendanceMonitor,
  type AttendanceMonitorResponse,
  type AttendanceMonitorLog
} from '@/lib/features/attendance/attendanceApi';
import { Loader2, RefreshCw, Users, Car, Briefcase, Clock, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export function AttendanceMonitor() {
  const [data, setData] = useState<AttendanceMonitorResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAttendanceMonitor();
      setData(res);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load attendance monitor data';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Optional: Auto-refresh every minute for "Live" feel
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const formatTime = (isoString: string | null) => {
    if (!isoString) return '—';
    try {
      return format(new Date(isoString), 'hh:mm a');
    } catch {
      return 'Invalid';
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
        <AlertCircle size={20} />
        <p>{error}</p>
        <button onClick={fetchData} className="ml-auto underline hover:text-red-800">Retry</button>
      </div>
    );
  }

  const { stats, logs } = data!;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Live Attendance Monitor</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Real-time tracking for {format(new Date(), 'MMMM d, yyyy')}</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={cn(loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Active Drivers"
          count={stats.activeDriverCount}
          icon={<Car className="text-blue-600" size={24} />}
          bg="bg-blue-50"
        />
        <StatsCard
          title="Active Staff"
          count={stats.activeStaffCount}
          icon={<Users className="text-green-600" size={24} />}
          bg="bg-green-50"
        />
        <StatsCard
          title="Active Managers"
          count={stats.activeManagerCount}
          icon={<Briefcase className="text-purple-600" size={24} />}
          bg="bg-purple-50"
        />
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3">Name / Role</th>
                <th className="px-4 py-3">Login</th>
                <th className="px-4 py-3">Clock In</th>
                <th className="px-4 py-3">Clock Out</th>
                <th className="px-4 py-3">Logout</th>
                <th className="px-4 py-3">Time Worked</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No attendance records found for today.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr 
                      onClick={() => toggleRow(log.id)} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {log.sessions && log.sessions.length > 0 && (
                            <div className="text-gray-400">
                              {expandedRows[log.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{log.name}</div>
                            <div className="text-xs text-gray-500">{log.role}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300 font-mono text-xs">
                        {formatTime(log.loginTime)}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300 font-mono text-xs">
                        {formatTime(log.clockInTime)}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300 font-mono text-xs">
                        {formatTime(log.clockOutTime)}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300 font-mono text-xs">
                        {formatTime(log.logoutTime)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 font-mono text-xs font-medium text-blue-600 dark:text-blue-400">
                          <Clock size={12} />
                          {log.timeWorked || "00:00"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={log.status} />
                      </td>
                    </tr>
                    {expandedRows[log.id] && log.sessions && log.sessions.length > 0 && (
                      <tr className="bg-gray-50/50 dark:bg-gray-900/30 border-t border-gray-100 dark:border-gray-800">
                        <td colSpan={7} className="px-4 py-3 pl-12">
                          <div className="text-xs font-medium text-gray-500 mb-2">Detailed Sessions</div>
                          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                            <table className="w-full text-xs text-left">
                              <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                  <th className="px-3 py-2">Session Start</th>
                                  <th className="px-3 py-2">Session End</th>
                                  <th className="px-3 py-2">Duration</th>
                                  <th className="px-3 py-2">Notes</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {log.sessions.map((s, idx) => {
                                  const start = new Date(s.clockIn).getTime();
                                  const end = s.clockOut ? new Date(s.clockOut).getTime() : Date.now();
                                  const diffMs = end - start;
                                  const hrs = Math.floor(diffMs / 3600000);
                                  const mins = Math.floor((diffMs % 3600000) / 60000);
                                  const dur = `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
                                  
                                  return (
                                    <tr key={s.id || idx}>
                                      <td className="px-3 py-2 font-mono">{formatTime(s.clockIn)}</td>
                                      <td className="px-3 py-2 font-mono">{formatTime(s.clockOut)}</td>
                                      <td className="px-3 py-2 font-mono">{dur}</td>
                                      <td className="px-3 py-2 text-gray-500">{s.notes || '-'}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatsCard({ title, count, icon, bg }: { title: string; count: number; icon: React.ReactNode; bg: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4">
      <div className={cn("p-3 rounded-lg", bg)}>{icon}</div>
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PRESENT: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    ABSENT: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    HALF_DAY: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    LEAVE: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  };

  const defaultStyle = "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";

  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium", styles[status] || defaultStyle)}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
