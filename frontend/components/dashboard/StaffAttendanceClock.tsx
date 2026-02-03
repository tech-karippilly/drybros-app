"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Clock, LogIn, LogOut, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppSelector } from '@/lib/hooks';
import {
    clockIn,
    clockOut,
    getAttendanceStatus,
    type AttendanceStatusResponse,
    type ClockInRequest,
    type ClockOutRequest,
} from '@/lib/features/attendance/attendanceApi';
import { useToast } from '@/components/ui/toast';
import { USER_ROLES } from '@/lib/constants/roles';

interface TimerDisplayProps {
    startTime: Date;
}

function getErrorMessage(err: unknown, fallback: string): string {
    if (typeof err === 'string') return err;
    if (err && typeof err === 'object') {
        const r = (err as { response?: { data?: { error?: string; message?: string } } }).response?.data;
        if (r?.error) return r.error;
        if (r?.message) return r.message;
        const m = (err as { message?: string }).message;
        if (m) return m;
    }
    return fallback;
}

function TimerDisplay({ startTime }: TimerDisplayProps) {
    const [elapsed, setElapsed] = useState<number>(0);

    useEffect(() => {
        const updateElapsed = () => {
            const now = new Date();
            const diff = now.getTime() - startTime.getTime();
            setElapsed(Math.floor(diff / 1000)); // elapsed in seconds
        };

        updateElapsed();
        const interval = setInterval(updateElapsed, 1000);

        return () => clearInterval(interval);
    }, [startTime]);

    const formatTime = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    return (
        <div className="text-center">
            <p className="text-sm font-semibold text-[#49659c] dark:text-gray-400 mb-2 uppercase tracking-wider">
                Time Elapsed
            </p>
            <div className="flex items-center justify-center gap-2">
                <Clock size={24} className="text-[#0d59f2]" />
                <p className="text-4xl font-bold text-[#0d121c] dark:text-white font-mono">
                    {formatTime(elapsed)}
                </p>
            </div>
        </div>
    );
}

export function StaffAttendanceClock() {
    const { user } = useAppSelector((state) => state.auth);
    const [status, setStatus] = useState<AttendanceStatusResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const { toast } = useToast();

    const fetchStatus = useCallback(async () => {
        if (!user) return;

        try {
            setLoading(true);
            const data = await getAttendanceStatus(user._id);
            setStatus(data);
        } catch (error) {
            console.error('Failed to fetch attendance status:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Load today's attendance status on mount
    useEffect(() => {
        if (user) {
            fetchStatus();
        } else {
            setLoading(false);
        }
    }, [user, fetchStatus]);

    const handleClockIn = async () => {
        if (!user) return;
        
        setActionLoading(true);
        try {
            const payload: ClockInRequest = {};
            const userId = user._id;

            if (user.role === USER_ROLES.STAFF) {
                payload.staffId = userId;
            } else if (user.role === USER_ROLES.DRIVER) {
                payload.driverId = userId;
            } else {
                payload.userId = userId;
            }

            await clockIn(payload);
            
            toast({
                title: "Clocked In",
                description: "You have successfully clocked in.",
                variant: "success",
            });
            
            // Refresh status
            fetchStatus();
        } catch (error: unknown) {
            const msg = getErrorMessage(error, "Failed to clock in");
            toast({
                title: "Clock In Failed",
                description: msg,
                variant: "error",
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleClockOut = async () => {
        if (!user) return;
        
        setActionLoading(true);
        try {
            const payload: ClockOutRequest = {};
            const userId = user._id;

            if (user.role === USER_ROLES.STAFF) {
                payload.staffId = userId;
            } else if (user.role === USER_ROLES.DRIVER) {
                payload.driverId = userId;
            } else {
                payload.userId = userId;
            }

            await clockOut(payload);
            
            toast({
                title: "Clocked Out",
                description: "You have successfully clocked out.",
                variant: "success",
            });
            
            fetchStatus();
        } catch (error: unknown) {
            const msg = getErrorMessage(error, "Failed to clock out");
            toast({
                title: "Clock Out Failed",
                description: msg,
                variant: "error",
            });
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
                    <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
            </div>
        );
    }

    const isClockedIn = status?.clockedIn ?? false;
    const clockInTime = status?.clockInTime ? new Date(status.clockInTime) : null;
    const lastClockOutTime = status?.lastClockOutTime ? new Date(status.lastClockOutTime) : null;

    return (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-[#0d121c] dark:text-white mb-2 flex items-center gap-2">
                    <Clock size={20} className="text-[#0d59f2]" />
                    Attendance Clock
                </h3>
                <p className="text-sm text-[#49659c] dark:text-gray-400">
                    Check in to start tracking your work hours
                </p>
            </div>

            {isClockedIn && clockInTime ? (
                <div className="space-y-6">
                    {/* Timer Display */}
                    <div className="bg-gradient-to-br from-[#0d59f2] to-[#0d59f2]/80 p-8 rounded-xl text-white">
                        <TimerDisplay startTime={clockInTime} />
                        <div className="mt-4 pt-4 border-t border-white/20">
                            <div className="flex items-center justify-between text-sm">
                                <span className="opacity-90">Clock In Time</span>
                                <span className="font-semibold">
                                    {clockInTime.toLocaleTimeString('en-IN', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit',
                                    })}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Clock Out Button */}
                    <button
                        onClick={handleClockOut}
                        disabled={actionLoading}
                        className={cn(
                            'w-full py-4 px-6 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-3',
                            'bg-red-600 hover:bg-red-700 active:scale-[0.98] shadow-lg shadow-red-500/20',
                            'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100'
                        )}
                    >
                        {actionLoading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Processing...</span>
                            </>
                        ) : (
                            <>
                                <LogOut size={20} />
                                <span>Clock Out</span>
                            </>
                        )}
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {lastClockOutTime && (
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800 flex items-center gap-3">
                            <CheckCircle size={20} className="text-green-600" />
                            <div className="text-sm">
                                <span className="text-green-700 dark:text-green-300">Last clocked out at: </span>
                                <span className="font-semibold text-green-900 dark:text-green-100">
                                    {lastClockOutTime.toLocaleTimeString('en-IN', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit',
                                    })}
                                </span>
                            </div>
                        </div>
                    )}
                    
                    <button
                        onClick={handleClockIn}
                        disabled={actionLoading}
                        className={cn(
                            'w-full py-4 px-6 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-3',
                            'bg-[#0d59f2] hover:bg-[#0b4acc] active:scale-[0.98] shadow-lg shadow-blue-500/20',
                            'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100'
                        )}
                    >
                        {actionLoading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Processing...</span>
                            </>
                        ) : (
                            <>
                                <LogIn size={20} />
                                <span>Clock In</span>
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
