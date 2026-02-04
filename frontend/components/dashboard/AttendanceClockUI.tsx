"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Clock, LogIn, LogOut, CheckCircle, Loader2 } from 'lucide-react';
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

interface AttendanceClockUIProps {
    variant?: 'compact' | 'full'; // 'compact' for header, 'full' for page
}

export function AttendanceClockUI({ variant = 'full' }: AttendanceClockUIProps) {
    const { user } = useAppSelector((state) => state.auth);
    const [status, setStatus] = useState<AttendanceStatusResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [shiftTime, setShiftTime] = useState({ hours: 0, minutes: 0, seconds: 0 });
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

    // Update shift time
    useEffect(() => {
        if (!status?.clockedIn || !status?.clockInTime) {
            setShiftTime({ hours: 0, minutes: 0, seconds: 0 });
            return;
        }

        const updateShiftTime = () => {
            const start = new Date(status.clockInTime!).getTime();
            const now = Date.now();
            if (now < start) return;

            const diff = Math.floor((now - start) / 1000);
            setShiftTime({
                hours: Math.floor(diff / 3600),
                minutes: Math.floor((diff % 3600) / 60),
                seconds: diff % 60,
            });
        };

        updateShiftTime();
        const timer = setInterval(updateShiftTime, 1000);
        return () => clearInterval(timer);
    }, [status]);

    // Update current time
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const handleClockIn = async () => {
        if (!user) return;
        setActionLoading(true);
        try {
            const payload: ClockInRequest = {};
            if (user.role === USER_ROLES.STAFF) {
                payload.staffId = user._id;
            } else if (user.role === USER_ROLES.DRIVER) {
                payload.driverId = user._id;
            } else {
                payload.userId = user._id;
            }
            await clockIn(payload);
            toast({
                title: "Clocked In",
                description: "You have successfully clocked in.",
                variant: "success",
            });
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
            if (user.role === USER_ROLES.STAFF) {
                payload.staffId = user._id;
            } else if (user.role === USER_ROLES.DRIVER) {
                payload.driverId = user._id;
            } else {
                payload.userId = user._id;
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

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    const formatShiftTime = (t: typeof shiftTime) => {
        return `${String(t.hours).padStart(2, "0")}:${String(t.minutes).padStart(2, "0")}:${String(t.seconds).padStart(2, "0")}`;
    };

    const isClockedIn = status?.clockedIn ?? false;

    if (loading) {
        return (
            <div className={cn(
                variant === 'compact' 
                    ? "rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/50"
                    : "rounded-xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/50"
            )}>
                <div className="animate-pulse">
                    <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-4"></div>
                    <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </div>
            </div>
        );
    }

    if (variant === 'compact') {
        return (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
                <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            Current Time
                        </span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-slate-900 dark:text-white">
                                {formatTime(currentTime)}
                            </span>
                            <span className="text-xs font-medium uppercase text-slate-500">
                                {formatDate(currentTime)}
                            </span>
                        </div>
                    </div>
                    <div className="h-10 w-px bg-slate-200 dark:bg-slate-800" />
                    {isClockedIn ? (
                        <>
                            <div className="flex flex-col">
                                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-emerald-500">
                                    <span className="size-1.5 rounded-full bg-emerald-500" />
                                    ON SHIFT
                                </span>
                                <span className="text-2xl font-black text-[#137fec]">
                                    {formatShiftTime(shiftTime)}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={handleClockOut}
                                disabled={actionLoading}
                                className={cn(
                                    "flex items-center gap-2 rounded-lg bg-red-500 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-red-600",
                                    "disabled:opacity-50 disabled:cursor-not-allowed"
                                )}
                            >
                                {actionLoading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        <span>Clocking Out...</span>
                                    </>
                                ) : (
                                    <>
                                        <LogOut className="h-5 w-5" />
                                        <span>Clock Out</span>
                                    </>
                                )}
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                    Not Clocked In
                                </span>
                                <span className="text-lg font-bold text-slate-500">
                                    Clock in to start tracking
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={handleClockIn}
                                disabled={actionLoading}
                                className={cn(
                                    "flex items-center gap-2 rounded-lg bg-[#137fec] px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-[#137fec]/90",
                                    "disabled:opacity-50 disabled:cursor-not-allowed"
                                )}
                            >
                                {actionLoading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        <span>Clocking In...</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="h-5 w-5" />
                                        <span>Clock In</span>
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </div>
            </div>
        );
    }

    // Full variant for page display (same design as compact)
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
            <div className="flex flex-col lg:flex-row items-center gap-6">
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Current Time
                    </span>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-900 dark:text-white">
                            {formatTime(currentTime)}
                        </span>
                        <span className="text-xs font-medium uppercase text-slate-500">
                            {formatDate(currentTime)}
                        </span>
                    </div>
                </div>
                <div className="hidden lg:block h-10 w-px bg-slate-200 dark:bg-slate-800" />
                {isClockedIn ? (
                    <>
                        <div className="flex flex-col">
                            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-emerald-500">
                                <span className="size-1.5 rounded-full bg-emerald-500" />
                                ON SHIFT
                            </span>
                            <span className="text-2xl font-black text-[#137fec]">
                                {formatShiftTime(shiftTime)}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={handleClockOut}
                            disabled={actionLoading}
                            className={cn(
                                "flex items-center gap-2 rounded-lg bg-red-500 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-red-600",
                                "disabled:opacity-50 disabled:cursor-not-allowed"
                            )}
                        >
                            {actionLoading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    <span>Clocking Out...</span>
                                </>
                            ) : (
                                <>
                                    <LogOut className="h-5 w-5" />
                                    <span>Clock Out</span>
                                </>
                            )}
                        </button>
                    </>
                ) : (
                    <>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                Not Clocked In
                            </span>
                            <span className="text-lg font-bold text-slate-500">
                                Clock in to start tracking
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={handleClockIn}
                            disabled={actionLoading}
                            className={cn(
                                "flex items-center gap-2 rounded-lg bg-[#137fec] px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-[#137fec]/90",
                                "disabled:opacity-50 disabled:cursor-not-allowed"
                            )}
                        >
                            {actionLoading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    <span>Clocking In...</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="h-5 w-5" />
                                    <span>Clock In</span>
                                </>
                            )}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
