"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    getAttendances,
    clockIn,
    clockOut,
    type AttendanceResponse,
    type ClockInRequest,
    type ClockOutRequest,
    type PaginatedAttendanceResponse,
} from '@/lib/features/attendance/attendanceApi';
import { Search, Loader2, AlertCircle, LogIn, LogOut, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AttendanceCalendar } from '@/components/ui/AttendanceCalendar';
import { format } from 'date-fns';

function isPaginated(r: AttendanceResponse[] | PaginatedAttendanceResponse): r is PaginatedAttendanceResponse {
    return typeof r === 'object' && 'pagination' in r && Array.isArray((r as PaginatedAttendanceResponse).data);
}

export function AttendanceManager() {
    const [list, setList] = useState<AttendanceResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [clockModal, setClockModal] = useState<'in' | 'out' | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const fetchList = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await getAttendances({ page: 1, limit: 100 });
            const data = isPaginated(res) ? res.data : res;
            setList(Array.isArray(data) ? data : []);
        } catch (e: unknown) {
            const msg = e && typeof e === 'object' && 'response' in e
                ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
                : e instanceof Error ? e.message : 'Failed to load attendance';
            setError(String(msg));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchList();
    }, [fetchList]);

    const filtered = list.filter(
        (a) =>
            (a.driverId || '').toLowerCase().includes(search.toLowerCase()) ||
            (a.staffId || '').toLowerCase().includes(search.toLowerCase())
    );

    // Create a Set of dates with attendance for the calendar
    const attendanceDates = useMemo(() => {
        const dateSet = new Set<string>();
        list.forEach((attendance) => {
            const dateStr = format(new Date(attendance.date), 'yyyy-MM-dd');
            dateSet.add(dateStr);
        });
        return dateSet;
    }, [list]);

    const handleClockIn = async (body: ClockInRequest) => {
        try {
            setSubmitting(true);
            await clockIn(body);
            setClockModal(null);
            await fetchList();
        } catch (e: unknown) {
            const msg = e && typeof e === 'object' && 'response' in e
                ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
                : e instanceof Error ? e.message : 'Clock-in failed';
            alert(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleClockOut = async (body: ClockOutRequest) => {
        try {
            setSubmitting(true);
            await clockOut(body);
            setClockModal(null);
            await fetchList();
        } catch (e: unknown) {
            const msg = e && typeof e === 'object' && 'response' in e
                ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
                : e instanceof Error ? e.message : 'Clock-out failed';
            alert(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white">Attendance</h2>
                    <p className="text-sm text-[#49659c] dark:text-gray-400">Track clock-in / clock-out and view records.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setClockModal('in')}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700"
                    >
                        <LogIn size={18} />
                        Clock In
                    </button>
                    <button
                        onClick={() => setClockModal('out')}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700"
                    >
                        <LogOut size={18} />
                        Clock Out
                    </button>
                </div>
            </div>

            <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#49659c] size-4" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by driver/staff ID..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm dark:text-white outline-none focus:ring-2 focus:ring-[#0d59f2]/20"
                />
            </div>

            {/* Calendar Section - Full Width */}
            <div className="w-full">
                <AttendanceCalendar
                    attendanceDates={attendanceDates}
                    showHolidays={true}
                />
            </div>

            {/* Attendance Table Section */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="size-8 animate-spin text-[#0d59f2]" />
                    </div>
                ) : error ? (
                    <div className="flex items-center gap-2 p-6 text-amber-600 dark:text-amber-400">
                        <AlertCircle size={20} />
                        {error}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-16 text-center text-[#49659c] dark:text-gray-400">No attendance records.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                                <tr>
                                    <th className="text-left px-6 py-3 font-semibold text-[#0d121c] dark:text-white">Driver / Staff</th>
                                    <th className="text-left px-6 py-3 font-semibold text-[#0d121c] dark:text-white">Date</th>
                                    <th className="text-left px-6 py-3 font-semibold text-[#0d121c] dark:text-white">Clock In</th>
                                    <th className="text-left px-6 py-3 font-semibold text-[#0d121c] dark:text-white">Clock Out</th>
                                    <th className="text-left px-6 py-3 font-semibold text-[#0d121c] dark:text-white">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((a) => (
                                    <tr key={a.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                                        <td className="px-6 py-3 text-[#0d121c] dark:text-white">
                                            {a.driverId || a.staffId || '—'}
                                        </td>
                                        <td className="px-6 py-3 text-[#49659c] dark:text-gray-400">
                                            {new Date(a.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-3 text-[#49659c] dark:text-gray-400">
                                            {a.clockIn ? new Date(a.clockIn).toLocaleTimeString() : '—'}
                                        </td>
                                        <td className="px-6 py-3 text-[#49659c] dark:text-gray-400">
                                            {a.clockOut ? new Date(a.clockOut).toLocaleTimeString() : '—'}
                                        </td>
                                        <td className="px-6 py-3">
                                            <span
                                                className={cn(
                                                    'px-2 py-0.5 rounded text-xs font-medium',
                                                    a.status === 'PRESENT' || a.status === 'COMPLETED'
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                )}
                                            >
                                                {a.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {clockModal === 'in' && (
                <ClockInOutModal
                    kind="in"
                    onClose={() => setClockModal(null)}
                    onSubmit={handleClockIn}
                    submitting={submitting}
                />
            )}
            {clockModal === 'out' && (
                <ClockInOutModal
                    kind="out"
                    onClose={() => setClockModal(null)}
                    onSubmit={handleClockOut}
                    submitting={submitting}
                />
            )}
        </div>
    );
}

function ClockInOutModal({
    kind,
    onClose,
    onSubmit,
    submitting,
}: {
    kind: 'in' | 'out';
    onClose: () => void;
    onSubmit: (b: ClockInRequest | ClockOutRequest) => void;
    submitting: boolean;
}) {
    const [driverId, setDriverId] = useState('');
    const [staffId, setStaffId] = useState('');
    const [notes, setNotes] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!driverId && !staffId) {
            alert('Provide either driver ID or staff ID.');
            return;
        }
        if (driverId && staffId) {
            alert('Provide only one of driver ID or staff ID.');
            return;
        }
        onSubmit({
            driverId: driverId || undefined,
            staffId: staffId || undefined,
            notes: notes.trim() || undefined,
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-[#0d121c] dark:text-white">
                        {kind === 'in' ? 'Clock In' : 'Clock Out'}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[#49659c] dark:text-gray-400 mb-1">Driver ID (optional if staff set)</label>
                        <input
                            type="text"
                            value={driverId}
                            onChange={(e) => { setDriverId(e.target.value); setStaffId(''); }}
                            placeholder="UUID"
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#49659c] dark:text-gray-400 mb-1">Staff ID (optional if driver set)</label>
                        <input
                            type="text"
                            value={staffId}
                            onChange={(e) => { setStaffId(e.target.value); setDriverId(''); }}
                            placeholder="UUID"
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#49659c] dark:text-gray-400 mb-1">Notes (optional)</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white resize-none"
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 font-medium dark:text-white">
                            Cancel
                        </button>
                        <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 rounded-lg bg-[#0d59f2] text-white font-bold hover:bg-[#0d59f2]/90 disabled:opacity-50">
                            {submitting ? 'Submitting...' : kind === 'in' ? 'Clock In' : 'Clock Out'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
