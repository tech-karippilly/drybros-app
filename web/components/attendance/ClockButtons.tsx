"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui";
import { attendanceService } from "@/services/attendanceService";

interface ClockButtonsProps {
  userId: string;
  userName: string;
  userRole?: string;
  staffId?: string;
  driverId?: string;
  onStatusChange?: () => void;
}

interface AttendanceStatus {
  hasClockedIn: boolean;
  hasClockedOut: boolean;
  clockInTime: string | null;
  clockOutTime: string | null;
  totalWorkHours: string | null;
}

const ClockIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const PlayIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const StopIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
    />
  </svg>
);

export default function ClockButtons({ userId, userName, userRole, staffId, driverId, onStatusChange }: ClockButtonsProps) {
  const [status, setStatus] = useState<AttendanceStatus>({
    hasClockedIn: false,
    hasClockedOut: false,
    clockInTime: null,
    clockOutTime: null,
    totalWorkHours: null,
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [initialStatus, setInitialStatus] = useState<AttendanceStatus | null>(null);
  const toast = useToast();

  // Determine the correct ID to use for attendance
  // For staff: use staffId if available, otherwise userId
  // For drivers: use driverId if available, otherwise userId
  // For managers: use userId
  const attendanceId = staffId || driverId || userId;

  useEffect(() => {
    setMounted(true);
    fetchStatus();
  }, [attendanceId]);

  // Set initial status for hydration consistency
  useEffect(() => {
    if (!initialStatus) {
      setInitialStatus({
        hasClockedIn: false,
        hasClockedOut: false,
        clockInTime: null,
        clockOutTime: null,
        totalWorkHours: null,
      });
    }
  }, [initialStatus]);

  const fetchStatus = async () => {
    try {
      setFetching(true);
      const response = await attendanceService.getAttendanceStatus(attendanceId);
      
      // Handle different response structures
      const data = response.data?.data || response.data;
      
      // Ensure data exists and has the expected structure
      if (!data) {
        setStatus({
          hasClockedIn: false,
          hasClockedOut: false,
          clockInTime: null,
          clockOutTime: null,
          totalWorkHours: null,
        });
        return;
      }
      
      setStatus({
        hasClockedIn: !!(data?.clockedIn),
        hasClockedOut: !!(data?.lastClockOutTime),
        clockInTime: data?.clockInTime || null,
        clockOutTime: data?.lastClockOutTime || null,
        totalWorkHours: data?.totalWorkHours || null,
      });
    } catch (error: any) {
      console.error("Failed to fetch attendance status:", error);
      // Set default status on error to prevent component crash
      setStatus({
        hasClockedIn: false,
        hasClockedOut: false,
        clockInTime: null,
        clockOutTime: null,
        totalWorkHours: null,
      });
      // Don't show error toast on initial load - user might not have clocked in yet
    } finally {
      setFetching(false);
    }
  };

  const handleClockIn = async () => {
    try {
      setLoading(true);
      await attendanceService.clockIn({ id: attendanceId });
      toast.success("Clocked in successfully!");
      await fetchStatus();
      onStatusChange?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to clock in");
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    try {
      setLoading(true);
      await attendanceService.clockOut({ id: attendanceId });
      toast.success("Clocked out successfully!");
      await fetchStatus();
      onStatusChange?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to clock out");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return "--:--";
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Use initial status during SSR and initial client render to prevent hydration mismatch
  const displayStatus = mounted ? status : (initialStatus || {
    hasClockedIn: false,
    hasClockedOut: false,
    clockInTime: null,
    clockOutTime: null,
    totalWorkHours: null,
  });

  // Show loading skeleton only during active fetching (not initial mount)
  if (fetching && mounted) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6" suppressHydrationWarning>
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4">
            <div className="h-4 bg-gray-800 rounded w-3/4"></div>
            <div className="h-10 bg-gray-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6" suppressHydrationWarning>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">Attendance Clock</h3>
          <p className="text-sm text-gray-400">{userName}</p>
        </div>
        <ClockIcon className="w-8 h-8 text-blue-400" />
      </div>

      {/* Status Display */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Clock In</div>
          <div className={`text-lg font-semibold ${displayStatus.hasClockedIn ? "text-green-400" : "text-gray-500"}`}>
            {formatTime(displayStatus.clockInTime)}
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Clock Out</div>
          <div className={`text-lg font-semibold ${displayStatus.hasClockedOut ? "text-red-400" : "text-gray-500"}`}>
            {formatTime(displayStatus.clockOutTime)}
          </div>
        </div>
      </div>

      {/* Work Hours */}
      {displayStatus.totalWorkHours && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
          <div className="text-xs text-blue-400 mb-1">Total Work Hours</div>
          <div className="text-lg font-semibold text-blue-400">{displayStatus.totalWorkHours}</div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleClockIn}
          disabled={loading || displayStatus.hasClockedIn || displayStatus.hasClockedOut}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
            displayStatus.hasClockedIn || displayStatus.hasClockedOut
              ? "bg-gray-800 text-gray-500 cursor-not-allowed"
              : "bg-green-500 hover:bg-green-600 text-white"
          }`}
        >
          <PlayIcon className="w-5 h-5" />
          {loading ? "Processing..." : "Clock In"}
        </button>

        <button
          onClick={handleClockOut}
          disabled={loading || !displayStatus.hasClockedIn || displayStatus.hasClockedOut}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
            !displayStatus.hasClockedIn || displayStatus.hasClockedOut
              ? "bg-gray-800 text-gray-500 cursor-not-allowed"
              : "bg-red-500 hover:bg-red-600 text-white"
          }`}
        >
          <StopIcon className="w-5 h-5" />
          {loading ? "Processing..." : "Clock Out"}
        </button>
      </div>

      {/* Status Message */}
      <div className="mt-4 text-sm text-center">
        {!displayStatus.hasClockedIn && !displayStatus.hasClockedOut && (
          <span className="text-gray-400">Ready to clock in for today</span>
        )}
        {displayStatus.hasClockedIn && !displayStatus.hasClockedOut && (
          <span className="text-green-400">● Currently clocked in</span>
        )}
        {displayStatus.hasClockedOut && (
          <span className="text-gray-400">Clocked out for today</span>
        )}
      </div>
    </div>
  );
}
