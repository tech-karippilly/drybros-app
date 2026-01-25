"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
    getLeaveRequests,
    createLeaveRequest as createLeaveApi,
    updateLeaveRequestStatus,
    type LeaveRequestResponse,
    type CreateLeaveRequest,
    type UpdateLeaveStatusRequest,
    type PaginatedLeaveResponse,
} from '@/lib/features/leave/leaveApi';
import { Plus, Search, Loader2, AlertCircle, CheckCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] as const;
const LEAVE_TYPES = ['SICK_LEAVE', 'CASUAL_LEAVE', 'EARNED_LEAVE', 'EMERGENCY_LEAVE', 'OTHER'] as const;

function isPaginated(r: LeaveRequestResponse[] | PaginatedLeaveResponse): r is PaginatedLeaveResponse {
    return typeof r === 'object' && 'pagination' in r && Array.isArray((r as PaginatedLeaveResponse).data);
}

export function LeaveManager() {
    const [list, setList] = useState<LeaveRequestResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [createOpen, setCreateOpen] = useState(false);
    const [statusModal, setStatusModal] = useState<LeaveRequestResponse | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const fetchList = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const params: { page?: number; limit?: number; status?: string } = { page: 1, limit: 100 };
            if (statusFilter !== 'all') params.status = statusFilter;
            const res = await getLeaveRequests(params);
            const data = isPaginated(res) ? res.data : res;
            setList(Array.isArray(data) ? data : []);
        } catch (e: unknown) {
            const msg = e && typeof e === 'object' && 'response' in e
                ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
                : e instanceof Error ? e.message : 'Failed to load leave requests';
            setError(String(msg));
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        fetchList();
    }, [fetchList]);

    const filtered = list.filter(
        (l) =>
            (l.reason || '').toLowerCase().includes(search.toLowerCase()) ||
            (l.driverId || '').toLowerCase().includes(search.toLowerCase()) ||
            (l.staffId || '').toLowerCase().includes(search.toLowerCase())
    );

    const handleCreate = async (body: CreateLeaveRequest) => {
        try {
            setSubmitting(true);
            await createLeaveApi(body);
            setCreateOpen(false);
            await fetchList();
        } catch (e: unknown) {
            const msg = e && typeof e === 'object' && 'response' in e
                ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
                : e instanceof Error ? e.message : 'Failed to create leave request';
            alert(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateStatus = async (id: string, body: UpdateLeaveStatusRequest) => {
        try {
            setSubmitting(true);
            await updateLeaveRequestStatus(id, body);
            setStatusModal(null);
            await fetchList();
        } catch (e: unknown) {
            const msg = e && typeof e === 'object' && 'response' in e
                ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
                : e instanceof Error ? e.message : 'Failed to update status';
            alert(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white">Leave Requests</h2>
                    <p className="text-sm text-[#49659c] dark:text-gray-400">Manage leave requests and approvals.</p>
                </div>
                <button
                    onClick={() => setCreateOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0d59f2] text-white rounded-lg font-bold hover:bg-[#0d59f2]/90 shadow-lg shadow-blue-500/20"
                >
                    <Plus size={18} />
                    New Request
                </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#49659c] size-4" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by reason, driver/staff ID..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm dark:text-white outline-none focus:ring-2 focus:ring-[#0d59f2]/20"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm dark:text-white"
                >
                    <option value="all">All statuses</option>
                    {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
            </div>

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
                    <div className="py-16 text-center text-[#49659c] dark:text-gray-400">No leave requests.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                                <tr>
                                    <th className="text-left px-6 py-3 font-semibold text-[#0d121c] dark:text-white">Reason</th>
                                    <th className="text-left px-6 py-3 font-semibold text-[#0d121c] dark:text-white">Type</th>
                                    <th className="text-left px-6 py-3 font-semibold text-[#0d121c] dark:text-white">Start – End</th>
                                    <th className="text-left px-6 py-3 font-semibold text-[#0d121c] dark:text-white">Status</th>
                                    <th className="text-left px-6 py-3 font-semibold text-[#0d121c] dark:text-white">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((l) => (
                                    <tr key={l.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                                        <td className="px-6 py-3">
                                            <p className="font-medium text-[#0d121c] dark:text-white">{l.reason}</p>
                                            <p className="text-xs text-[#49659c] dark:text-gray-400">{l.driverId || l.staffId || '—'}</p>
                                        </td>
                                        <td className="px-6 py-3 text-[#49659c] dark:text-gray-400">{l.leaveType}</td>
                                        <td className="px-6 py-3 text-[#49659c] dark:text-gray-400">
                                            {new Date(l.startDate).toLocaleDateString()} – {new Date(l.endDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-3">
                                            <span
                                                className={cn(
                                                    'px-2 py-0.5 rounded text-xs font-medium',
                                                    l.status === 'APPROVED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                    l.status === 'REJECTED' || l.status === 'CANCELLED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                )}
                                            >
                                                {l.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3">
                                            {l.status === 'PENDING' && (
                                                <button
                                                    onClick={() => setStatusModal(l)}
                                                    className="text-[#0d59f2] hover:underline font-medium text-sm"
                                                >
                                                    Update status
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {createOpen && (
                <CreateLeaveModal
                    onClose={() => setCreateOpen(false)}
                    onSubmit={handleCreate}
                    submitting={submitting}
                />
            )}
            {statusModal && (
                <UpdateLeaveStatusModal
                    leave={statusModal}
                    onClose={() => setStatusModal(null)}
                    onSubmit={(body) => handleUpdateStatus(statusModal.id, body)}
                    submitting={submitting}
                />
            )}
        </div>
    );
}

function CreateLeaveModal({
    onClose,
    onSubmit,
    submitting,
}: {
    onClose: () => void;
    onSubmit: (b: CreateLeaveRequest) => void;
    submitting: boolean;
}) {
    const [driverId, setDriverId] = useState('');
    const [staffId, setStaffId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');
    const [leaveType, setLeaveType] = useState<CreateLeaveRequest['leaveType']>('CASUAL_LEAVE');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason.trim()) {
            alert('Reason is required.');
            return;
        }
        if (!driverId && !staffId) {
            alert('Provide either driver ID or staff ID.');
            return;
        }
        if (driverId && staffId) {
            alert('Provide only one of driver ID or staff ID.');
            return;
        }
        if (!startDate || !endDate) {
            alert('Start and end dates are required.');
            return;
        }
        onSubmit({
            driverId: driverId || undefined,
            staffId: staffId || undefined,
            startDate: new Date(startDate).toISOString(),
            endDate: new Date(endDate).toISOString(),
            reason: reason.trim(),
            leaveType,
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-[#0d121c] dark:text-white">New Leave Request</h3>
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
                        <label className="block text-sm font-medium text-[#49659c] dark:text-gray-400 mb-1">Start date *</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            required
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#49659c] dark:text-gray-400 mb-1">End date *</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            required
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#49659c] dark:text-gray-400 mb-1">Reason *</label>
                        <input
                            type="text"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            required
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#49659c] dark:text-gray-400 mb-1">Leave type</label>
                        <select
                            value={leaveType}
                            onChange={(e) => setLeaveType(e.target.value as CreateLeaveRequest['leaveType'])}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white"
                        >
                            {LEAVE_TYPES.map((t) => (
                                <option key={t} value={t}>{t.replace('_', ' ')}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 font-medium dark:text-white">
                            Cancel
                        </button>
                        <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 rounded-lg bg-[#0d59f2] text-white font-bold hover:bg-[#0d59f2]/90 disabled:opacity-50">
                            {submitting ? 'Creating...' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function UpdateLeaveStatusModal({
    leave,
    onClose,
    onSubmit,
    submitting,
}: {
    leave: LeaveRequestResponse;
    onClose: () => void;
    onSubmit: (b: UpdateLeaveStatusRequest) => void;
    submitting: boolean;
}) {
    const [status, setStatus] = useState<UpdateLeaveStatusRequest['status']>('APPROVED');
    const [rejectionReason, setRejectionReason] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            status,
            rejectionReason: status === 'REJECTED' ? (rejectionReason.trim() || undefined) : undefined,
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-[#0d121c] dark:text-white">Update status</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                        <X size={20} />
                    </button>
                </div>
                <p className="text-sm text-[#49659c] dark:text-gray-400 mb-4">{leave.reason}</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[#49659c] dark:text-gray-400 mb-1">Status</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as UpdateLeaveStatusRequest['status'])}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white"
                        >
                            {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                    {status === 'REJECTED' && (
                        <div>
                            <label className="block text-sm font-medium text-[#49659c] dark:text-gray-400 mb-1">Rejection reason (optional)</label>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                rows={2}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white resize-none"
                            />
                        </div>
                    )}
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 font-medium dark:text-white">
                            Cancel
                        </button>
                        <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 rounded-lg bg-[#0d59f2] text-white font-bold hover:bg-[#0d59f2]/90 disabled:opacity-50 flex items-center justify-center gap-2">
                            {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                            Update
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
