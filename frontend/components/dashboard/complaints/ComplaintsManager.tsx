"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
    getComplaints,
    createComplaint,
    updateComplaintStatus,
    type ComplaintResponse,
    type CreateComplaintRequest,
    type UpdateComplaintStatusRequest,
    type PaginatedComplaintsResponse,
} from '@/lib/features/complaints/complaintsApi';
import { Plus, Search, Loader2, AlertCircle, CheckCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const;

function isPaginated(r: ComplaintResponse[] | PaginatedComplaintsResponse): r is PaginatedComplaintsResponse {
    return typeof r === 'object' && 'pagination' in r && Array.isArray((r as PaginatedComplaintsResponse).data);
}

export function ComplaintsManager() {
    const [list, setList] = useState<ComplaintResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [createOpen, setCreateOpen] = useState(false);
    const [statusModal, setStatusModal] = useState<ComplaintResponse | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const fetchList = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const params: { page?: number; limit?: number; status?: string } = { page: 1, limit: 100 };
            if (statusFilter !== 'all') params.status = statusFilter;
            const res = await getComplaints(params);
            const data = isPaginated(res) ? res.data : res;
            setList(Array.isArray(data) ? data : []);
        } catch (e: unknown) {
            const msg = e && typeof e === 'object' && 'response' in e
                ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
                : e instanceof Error ? e.message : 'Failed to load complaints';
            setError(String(msg));
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        fetchList();
    }, [fetchList]);

    const filtered = list.filter(
        (c) =>
            c.title.toLowerCase().includes(search.toLowerCase()) ||
            (c.description || '').toLowerCase().includes(search.toLowerCase())
    );

    const handleCreate = async (body: CreateComplaintRequest) => {
        try {
            setSubmitting(true);
            await createComplaint(body);
            setCreateOpen(false);
            await fetchList();
        } catch (e: unknown) {
            const msg = e && typeof e === 'object' && 'response' in e
                ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
                : e instanceof Error ? e.message : 'Failed to create complaint';
            alert(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateStatus = async (id: string, body: UpdateComplaintStatusRequest) => {
        try {
            setSubmitting(true);
            await updateComplaintStatus(id, body);
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
                    <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white">Complaints</h2>
                    <p className="text-sm text-[#49659c] dark:text-gray-400">Review and resolve customer complaints.</p>
                </div>
                <button
                    onClick={() => setCreateOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0d59f2] text-white rounded-lg font-bold hover:bg-[#0d59f2]/90 shadow-lg shadow-blue-500/20"
                >
                    <Plus size={18} />
                    New Complaint
                </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#49659c] size-4" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search complaints..."
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
                    <div className="py-16 text-center text-[#49659c] dark:text-gray-400">No complaints found.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                                <tr>
                                    <th className="text-left px-6 py-3 font-semibold text-[#0d121c] dark:text-white">Title</th>
                                    <th className="text-left px-6 py-3 font-semibold text-[#0d121c] dark:text-white">Status</th>
                                    <th className="text-left px-6 py-3 font-semibold text-[#0d121c] dark:text-white">Severity</th>
                                    <th className="text-left px-6 py-3 font-semibold text-[#0d121c] dark:text-white">Created</th>
                                    <th className="text-left px-6 py-3 font-semibold text-[#0d121c] dark:text-white">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((c) => (
                                    <tr key={c.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                                        <td className="px-6 py-3">
                                            <p className="font-medium text-[#0d121c] dark:text-white">{c.title}</p>
                                            <p className="text-xs text-[#49659c] dark:text-gray-400 line-clamp-1">{c.description}</p>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span
                                                className={cn(
                                                    'px-2 py-0.5 rounded text-xs font-medium',
                                                    c.status === 'RESOLVED' || c.status === 'CLOSED'
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                )}
                                            >
                                                {c.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-[#49659c] dark:text-gray-400">{c.severity}</td>
                                        <td className="px-6 py-3 text-[#49659c] dark:text-gray-400">
                                            {new Date(c.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-3">
                                            <button
                                                onClick={() => setStatusModal(c)}
                                                className="text-[#0d59f2] hover:underline font-medium text-sm"
                                            >
                                                Update status
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {createOpen && (
                <CreateComplaintModal
                    onClose={() => setCreateOpen(false)}
                    onSubmit={handleCreate}
                    submitting={submitting}
                />
            )}
            {statusModal && (
                <UpdateStatusModal
                    complaint={statusModal}
                    onClose={() => setStatusModal(null)}
                    onSubmit={(body) => handleUpdateStatus(statusModal.id, body)}
                    submitting={submitting}
                />
            )}
        </div>
    );
}

function CreateComplaintModal({
    onClose,
    onSubmit,
    submitting,
}: {
    onClose: () => void;
    onSubmit: (b: CreateComplaintRequest) => void;
    submitting: boolean;
}) {
    const [driverId, setDriverId] = useState('');
    const [staffId, setStaffId] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [severity, setSeverity] = useState<CreateComplaintRequest['severity']>('MEDIUM');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !description.trim()) {
            alert('Title and description are required.');
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
        onSubmit({
            driverId: driverId || undefined,
            staffId: staffId || undefined,
            title: title.trim(),
            description: description.trim(),
            severity,
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-[#0d121c] dark:text-white">New Complaint</h3>
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
                        <label className="block text-sm font-medium text-[#49659c] dark:text-gray-400 mb-1">Title *</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#49659c] dark:text-gray-400 mb-1">Description *</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                            rows={3}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white resize-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#49659c] dark:text-gray-400 mb-1">Severity</label>
                        <select
                            value={severity}
                            onChange={(e) => setSeverity(e.target.value as CreateComplaintRequest['severity'])}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white"
                        >
                            {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map((s) => (
                                <option key={s} value={s}>{s}</option>
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

function UpdateStatusModal({
    complaint,
    onClose,
    onSubmit,
    submitting,
}: {
    complaint: ComplaintResponse;
    onClose: () => void;
    onSubmit: (b: UpdateComplaintStatusRequest) => void;
    submitting: boolean;
}) {
    const [status, setStatus] = useState<UpdateComplaintStatusRequest['status']>(complaint.status as UpdateComplaintStatusRequest['status']);
    const [resolution, setResolution] = useState(complaint.resolution || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ status, resolution: resolution.trim() || undefined });
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
                <p className="text-sm text-[#49659c] dark:text-gray-400 mb-4">{complaint.title}</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[#49659c] dark:text-gray-400 mb-1">Status</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as UpdateComplaintStatusRequest['status'])}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white"
                        >
                            {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#49659c] dark:text-gray-400 mb-1">Resolution (optional)</label>
                        <textarea
                            value={resolution}
                            onChange={(e) => setResolution(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white resize-none"
                        />
                    </div>
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
