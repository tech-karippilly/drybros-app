"use client";

import React, { useEffect, useState } from 'react';
import { Clock, LogIn, LogOut, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AttendanceState {
    clockIn: string | null;
    clockOut: string | null;
    date: string;
}

interface TimerDisplayProps {
    startTime: Date;
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

const STORAGE_KEY = 'dashboard_attendance';

function getTodayDateString(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

function getStoredAttendance(): AttendanceState | null {
    if (typeof window === 'undefined') return null;
    
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return null;
        
        const attendance: AttendanceState = JSON.parse(stored);
        const today = getTodayDateString();
        
        // Only return if it's for today
        if (attendance.date === today) {
            return attendance;
        }
        
        // Clear old attendance
        localStorage.removeItem(STORAGE_KEY);
        return null;
    } catch {
        return null;
    }
}

function saveAttendance(attendance: AttendanceState): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(attendance));
}

export function AttendanceCard() {
    const [attendance, setAttendance] = useState<AttendanceState | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Load today's attendance from localStorage
    useEffect(() => {
        const stored = getStoredAttendance();
        setAttendance(stored);
        setLoading(false);
    }, []);

    const handleClockIn = () => {
        setActionLoading(true);
        
        // Simulate API delay
        setTimeout(() => {
            const now = new Date().toISOString();
            const today = getTodayDateString();
            
            const newAttendance: AttendanceState = {
                clockIn: now,
                clockOut: null,
                date: today,
            };
            
            saveAttendance(newAttendance);
            setAttendance(newAttendance);
            setActionLoading(false);
        }, 500);
    };

    const handleClockOut = () => {
        if (!attendance || !attendance.clockIn) return;
        
        setActionLoading(true);
        
        // Simulate API delay
        setTimeout(() => {
            const now = new Date().toISOString();
            
            const updatedAttendance: AttendanceState = {
                ...attendance,
                clockOut: now,
            };
            
            saveAttendance(updatedAttendance);
            setAttendance(updatedAttendance);
            setActionLoading(false);
        }, 500);
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

    const isClockedIn = attendance?.clockIn && !attendance?.clockOut;
    const clockInTime = attendance?.clockIn ? new Date(attendance.clockIn) : null;

    return (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-[#0d121c] dark:text-white mb-2 flex items-center gap-2">
                    <Clock size={20} className="text-[#0d59f2]" />
                    Attendance
                </h3>
            </div>

            {isClockedIn && clockInTime ? (
                <div className="space-y-6">
                    {/* Timer Display */}
                    <div className="bg-gradient-to-br from-[#0d59f2] to-[#0d59f2]/80 p-6 rounded-xl text-white">
                        <TimerDisplay startTime={clockInTime} />
                        <div className="mt-4 pt-4 border-t border-white/20">
                            <div className="flex items-center justify-between text-sm">
                                <span className="opacity-90">Clock In</span>
                                <span className="font-semibold">
                                    {clockInTime.toLocaleTimeString('en-IN', {
                                        hour: '2-digit',
                                        minute: '2-digit',
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
                            'w-full py-3 px-4 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2',
                            'bg-red-600 hover:bg-red-700 active:scale-[0.98] shadow-lg shadow-red-500/20',
                            'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100'
                        )}
                    >
                        {actionLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Processing...</span>
                            </>
                        ) : (
                            <>
                                <LogOut size={18} />
                                <span>Clock Out</span>
                            </>
                        )}
                    </button>
                </div>
            ) : attendance?.clockOut ? (
                <div className="space-y-4">
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2 mb-3">
                            <CheckCircle size={20} className="text-green-600" />
                            <h4 className="font-semibold text-sm text-green-900 dark:text-green-100">
                                Clocked Out
                            </h4>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-green-700 dark:text-green-300">Clock In:</span>
                                <span className="font-semibold text-green-900 dark:text-green-100">
                                    {attendance.clockIn
                                        ? new Date(attendance.clockIn).toLocaleTimeString('en-IN', {
                                              hour: '2-digit',
                                              minute: '2-digit',
                                          })
                                        : '—'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-green-700 dark:text-green-300">Clock Out:</span>
                                <span className="font-semibold text-green-900 dark:text-green-100">
                                    {attendance.clockOut
                                        ? new Date(attendance.clockOut).toLocaleTimeString('en-IN', {
                                              hour: '2-digit',
                                              minute: '2-digit',
                                          })
                                        : '—'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl text-center">
                        <p className="text-sm text-[#49659c] dark:text-gray-400 mb-4">
                            Ready to start your day?
                        </p>
                    </div>

                    {/* Clock In Button */}
                    <button
                        onClick={handleClockIn}
                        disabled={actionLoading}
                        className={cn(
                            'w-full py-3 px-4 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2',
                            'bg-[#0d59f2] hover:bg-[#0d59f2]/90 active:scale-[0.98] shadow-lg shadow-blue-500/20',
                            'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100'
                        )}
                    >
                        {actionLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Processing...</span>
                            </>
                        ) : (
                            <>
                                <LogIn size={18} />
                                <span>Clock In</span>
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
