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
import { getDriverList, type DriverResponse } from '@/lib/features/drivers/driverApi';
import { getStaffList, type StaffResponse } from '@/lib/features/staff/staffApi';
import { getTripsPaginated, type TripResponse } from '@/lib/features/trip/tripApi';
import { KPI_ACTIVE_TRIP_STATUSES } from '@/lib/constants/kpi';
import {
    ATTENDANCE_DATE_FILTERS,
    ATTENDANCE_LIST_LIMIT,
    ATTENDANCE_SEARCH_PLACEHOLDER,
    ATTENDANCE_TRIP_LOOKUP_LIMIT,
    ATTENDANCE_UI_LABELS,
    type AttendanceDateFilter,
} from '@/lib/constants/attendance';
import { Search, Loader2, AlertCircle, LogIn, LogOut, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AttendanceCalendar } from '@/components/ui/AttendanceCalendar';
import { format, subDays } from 'date-fns';

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
    const [dateFilter, setDateFilter] = useState<AttendanceDateFilter>(ATTENDANCE_DATE_FILTERS.TODAY);

    const [drivers, setDrivers] = useState<DriverResponse[]>([]);
    const [staff, setStaff] = useState<StaffResponse[]>([]);
    const [tripStatusByDriverId, setTripStatusByDriverId] = useState<Record<string, string>>({});

    const filterDateRange = useMemo((): { startDate?: string; endDate?: string } => {
        if (dateFilter === ATTENDANCE_DATE_FILTERS.ALL) return {};
        const base =
            dateFilter === ATTENDANCE_DATE_FILTERS.YESTERDAY ? subDays(new Date(), 1) : new Date();
        const day = format(base, 'yyyy-MM-dd');
        return { startDate: day, endDate: day };
    }, [dateFilter]);

    const fetchList = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await getAttendances({
                page: 1,
                limit: ATTENDANCE_LIST_LIMIT,
                ...filterDateRange,
            });
            const data = isPaginated(res) ? res.data : res;
            const nextList = Array.isArray(data) ? data : [];
            setList(nextList);

            // Trip status lookup: only for single-day filters (Today / Yesterday)
            if (filterDateRange.startDate && filterDateRange.endDate) {
                const tripsRes = await getTripsPaginated({
                    page: 1,
                    limit: ATTENDANCE_TRIP_LOOKUP_LIMIT,
                    dateFrom: filterDateRange.startDate,
                    dateTo: filterDateRange.endDate,
                });

                const latestTripByDriver: Record<string, TripResponse> = {};
                for (const t of tripsRes.data) {
                    if (!t.driverId) continue;
                    const key = t.driverId;
                    const candidateTs = new Date(
                        (t.updatedAt as any) ??
                            (t.startedAt as any) ??
                            (t.scheduledAt as any) ??
                            (t.createdAt as any) ??
                            0
                    ).getTime();

                    const existing = latestTripByDriver[key];
                    if (!existing) {
                        latestTripByDriver[key] = t;
                        continue;
                    }
                    const existingTs = new Date(
                        (existing.updatedAt as any) ??
                            (existing.startedAt as any) ??
                            (existing.scheduledAt as any) ??
                            (existing.createdAt as any) ??
                            0
                    ).getTime();
                    if (candidateTs >= existingTs) latestTripByDriver[key] = t;
                }

                const statusMap: Record<string, string> = {};
                for (const [driverId, trip] of Object.entries(latestTripByDriver)) {
                    statusMap[driverId] = trip.status || '—';
                }
                setTripStatusByDriverId(statusMap);
            } else {
                setTripStatusByDriverId({});
            }
        } catch (e: unknown) {
            const msg = e && typeof e === 'object' && 'response' in e
                ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
                : e instanceof Error ? e.message : 'Failed to load attendance';
            setError(String(msg));
        } finally {
            setLoading(false);
        }
    }, [filterDateRange]);

    useEffect(() => {
        fetchList();
    }, [fetchList]);

    useEffect(() => {
        let isMounted = true;

        async function fetchPeopleLookups() {
            try {
                const [driversRes, staffRes] = await Promise.all([
                    getDriverList({ page: 1, limit: 1000 }),
                    getStaffList({ page: 1, limit: 1000 }),
                ]);

                const driverList = Array.isArray(driversRes)
                    ? driversRes
                    : 'data' in driversRes
                        ? (driversRes.data as DriverResponse[])
                        : [];

                const staffList = Array.isArray(staffRes)
                    ? staffRes
                    : 'data' in staffRes
                        ? (staffRes.data as StaffResponse[])
                        : [];

                if (!isMounted) return;
                setDrivers(driverList);
                setStaff(staffList);
            } catch {
                // Non-fatal: fallback to showing IDs in the table.
            }
        }

        fetchPeopleLookups();
        return () => {
            isMounted = false;
        };
    }, []);

    const driverNameById = useMemo(() => {
        const m = new Map<string, string>();
        drivers.forEach((d) => {
            const name = `${d.firstName ?? ''} ${d.lastName ?? ''}`.trim();
            if (d.id) m.set(d.id, name || d.id);
        });
        return m;
    }, [drivers]);

    const staffNameById = useMemo(() => {
        const m = new Map<string, string>();
        staff.forEach((s) => {
            if (s.id) m.set(s.id, s.name || s.id);
        });
        return m;
    }, [staff]);

    const getPersonDisplay = useCallback(
        (a: AttendanceResponse): { label: string; subLabel?: string } => {
            if (a.driverId) {
                const name = driverNameById.get(a.driverId);
                return { label: name ?? a.driverId, subLabel: name ? a.driverId : undefined };
            }
            if (a.staffId) {
                const name = staffNameById.get(a.staffId);
                return { label: name ?? a.staffId, subLabel: name ? a.staffId : undefined };
            }
            return { label: '—' };
        },
        [driverNameById, staffNameById]
    );

    const filtered = list.filter((a) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;

        const person = getPersonDisplay(a);
        const parts = [
            a.driverId ?? '',
            a.staffId ?? '',
            person.label ?? '',
            person.subLabel ?? '',
            a.status ?? '',
            a.driverId ? tripStatusByDriverId[a.driverId] ?? '' : '',
        ];

        return parts.join(' ').toLowerCase().includes(q);
    });

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
                    placeholder={ATTENDANCE_SEARCH_PLACEHOLDER}
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

            {/* Date Filter */}
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-[#49659c] dark:text-gray-400">
                    {ATTENDANCE_UI_LABELS.DATE_FILTER}
                </span>
                <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
                    <button
                        onClick={() => setDateFilter(ATTENDANCE_DATE_FILTERS.TODAY)}
                        className={cn(
                            'px-3 py-1.5 text-sm font-semibold transition-colors',
                            dateFilter === ATTENDANCE_DATE_FILTERS.TODAY
                                ? 'bg-[#0d59f2] text-white'
                                : 'bg-white dark:bg-gray-900 text-[#0d121c] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                        )}
                    >
                        {ATTENDANCE_UI_LABELS.TODAY}
                    </button>
                    <button
                        onClick={() => setDateFilter(ATTENDANCE_DATE_FILTERS.YESTERDAY)}
                        className={cn(
                            'px-3 py-1.5 text-sm font-semibold transition-colors border-l border-gray-200 dark:border-gray-800',
                            dateFilter === ATTENDANCE_DATE_FILTERS.YESTERDAY
                                ? 'bg-[#0d59f2] text-white'
                                : 'bg-white dark:bg-gray-900 text-[#0d121c] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                        )}
                    >
                        {ATTENDANCE_UI_LABELS.YESTERDAY}
                    </button>
                    <button
                        onClick={() => setDateFilter(ATTENDANCE_DATE_FILTERS.ALL)}
                        className={cn(
                            'px-3 py-1.5 text-sm font-semibold transition-colors border-l border-gray-200 dark:border-gray-800',
                            dateFilter === ATTENDANCE_DATE_FILTERS.ALL
                                ? 'bg-[#0d59f2] text-white'
                                : 'bg-white dark:bg-gray-900 text-[#0d121c] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                        )}
                    >
                        {ATTENDANCE_UI_LABELS.ALL}
                    </button>
                </div>
                {filterDateRange.startDate && (
                    <span className="text-sm text-[#49659c] dark:text-gray-400">
                        {filterDateRange.startDate}
                    </span>
                )}
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
                                    <th className="text-left px-6 py-3 font-semibold text-[#0d121c] dark:text-white">Trip Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((a) => (
                                    <tr key={a.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                                        <td className="px-6 py-3 text-[#0d121c] dark:text-white">
                                            {(() => {
                                                const p = getPersonDisplay(a);
                                                return (
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{p.label}</span>
                                                        {p.subLabel && (
                                                            <span className="text-xs text-[#49659c] dark:text-gray-400">
                                                                {p.subLabel}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })()}
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
                                        <td className="px-6 py-3">
                                            {a.driverId ? (
                                                <span
                                                    className={cn(
                                                        'px-2 py-0.5 rounded text-xs font-medium',
                                                        KPI_ACTIVE_TRIP_STATUSES.includes(
                                                            (tripStatusByDriverId[a.driverId] ?? '') as any
                                                        )
                                                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                                            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                                    )}
                                                >
                                                    {tripStatusByDriverId[a.driverId] ?? '—'}
                                                </span>
                                            ) : (
                                                <span className="text-[#49659c] dark:text-gray-400">—</span>
                                            )}
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
        const id = driverId.trim() || staffId.trim();
        if (!id) {
            alert('Provide either driver ID or staff ID.');
            return;
        }
        if (driverId && staffId) {
            alert('Provide only one of driver ID or staff ID.');
            return;
        }
        onSubmit({
            id,
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
