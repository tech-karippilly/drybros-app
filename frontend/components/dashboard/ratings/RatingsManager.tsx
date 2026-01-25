"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
    getRatings,
    createRating,
    type RatingResponse,
    type CreateRatingRequest,
    type PaginatedRatingsResponse,
} from '@/lib/features/ratings/ratingsApi';
import { Plus, Search, Loader2, AlertCircle, Star, X } from 'lucide-react';
import { cn } from '@/lib/utils';

function isPaginated(r: RatingResponse[] | PaginatedRatingsResponse): r is PaginatedRatingsResponse {
    return typeof r === 'object' && 'pagination' in r && Array.isArray((r as PaginatedRatingsResponse).data);
}

export function RatingsManager() {
    const [list, setList] = useState<RatingResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [driverFilter, setDriverFilter] = useState('');
    const [createOpen, setCreateOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const fetchList = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const params: { page?: number; limit?: number; driverId?: string } = { page: 1, limit: 100 };
            if (driverFilter) params.driverId = driverFilter;
            const res = await getRatings(params);
            const data = isPaginated(res) ? res.data : res;
            setList(Array.isArray(data) ? data : []);
        } catch (e: unknown) {
            const msg = e && typeof e === 'object' && 'response' in e
                ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
                : e instanceof Error ? e.message : 'Failed to load ratings';
            setError(String(msg));
        } finally {
            setLoading(false);
        }
    }, [driverFilter]);

    useEffect(() => {
        fetchList();
    }, [fetchList]);

    const filtered = list.filter(
        (r) =>
            r.customerName.toLowerCase().includes(search.toLowerCase()) ||
            (r.customerPhone || '').includes(search) ||
            (r.driverId || '').toLowerCase().includes(search.toLowerCase())
    );

    const handleCreate = async (body: CreateRatingRequest) => {
        try {
            setSubmitting(true);
            await createRating(body);
            setCreateOpen(false);
            await fetchList();
        } catch (e: unknown) {
            const msg = e && typeof e === 'object' && 'response' in e
                ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
                : e instanceof Error ? e.message : 'Failed to create rating';
            alert(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white">Ratings</h2>
                    <p className="text-sm text-[#49659c] dark:text-gray-400">Driver ratings and feedback.</p>
                </div>
                <button
                    onClick={() => setCreateOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0d59f2] text-white rounded-lg font-bold hover:bg-[#0d59f2]/90 shadow-lg shadow-blue-500/20"
                >
                    <Plus size={18} />
                    New Rating
                </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#49659c] size-4" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by customer, phone, driver..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm dark:text-white outline-none focus:ring-2 focus:ring-[#0d59f2]/20"
                    />
                </div>
                <input
                    type="text"
                    value={driverFilter}
                    onChange={(e) => setDriverFilter(e.target.value)}
                    placeholder="Driver ID filter"
                    className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm dark:text-white"
                />
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
                    <div className="py-16 text-center text-[#49659c] dark:text-gray-400">No ratings.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                                <tr>
                                    <th className="text-left px-6 py-3 font-semibold text-[#0d121c] dark:text-white">Customer</th>
                                    <th className="text-left px-6 py-3 font-semibold text-[#0d121c] dark:text-white">Driver</th>
                                    <th className="text-left px-6 py-3 font-semibold text-[#0d121c] dark:text-white">Overall</th>
                                    <th className="text-left px-6 py-3 font-semibold text-[#0d121c] dark:text-white">Safety / Smooth / Polite</th>
                                    <th className="text-left px-6 py-3 font-semibold text-[#0d121c] dark:text-white">Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((r) => (
                                    <tr key={r.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                                        <td className="px-6 py-3">
                                            <p className="font-medium text-[#0d121c] dark:text-white">{r.customerName}</p>
                                            <p className="text-xs text-[#49659c] dark:text-gray-400">{r.customerPhone}</p>
                                        </td>
                                        <td className="px-6 py-3 text-[#49659c] dark:text-gray-400">{r.driverId}</td>
                                        <td className="px-6 py-3">
                                            <span className="inline-flex items-center gap-1 text-amber-500">
                                                <Star size={14} fill="currentColor" />
                                                {r.overallRating}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-[#49659c] dark:text-gray-400">
                                            {r.drivingSafety} / {r.drivingSmoothness} / {r.behaviorPoliteness}
                                        </td>
                                        <td className="px-6 py-3 text-[#49659c] dark:text-gray-400">
                                            {new Date(r.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {createOpen && (
                <CreateRatingModal
                    onClose={() => setCreateOpen(false)}
                    onSubmit={handleCreate}
                    submitting={submitting}
                />
            )}
        </div>
    );
}

function CreateRatingModal({
    onClose,
    onSubmit,
    submitting,
}: {
    onClose: () => void;
    onSubmit: (b: CreateRatingRequest) => void;
    submitting: boolean;
}) {
    const [driverId, setDriverId] = useState('');
    const [tripId, setTripId] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [overallRating, setOverallRating] = useState(5);
    const [drivingSafety, setDrivingSafety] = useState(5);
    const [drivingSmoothness, setDrivingSmoothness] = useState(5);
    const [behaviorPoliteness, setBehaviorPoliteness] = useState(5);
    const [experience, setExperience] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!driverId.trim() || !customerName.trim() || !customerPhone.trim()) {
            alert('Driver ID, customer name, and phone are required.');
            return;
        }
        if (customerPhone.length < 10) {
            alert('Phone must be at least 10 characters.');
            return;
        }
        onSubmit({
            driverId: driverId.trim(),
            tripId: tripId.trim() || undefined,
            customerName: customerName.trim(),
            customerPhone: customerPhone.trim(),
            customerEmail: customerEmail.trim() || undefined,
            overallRating,
            drivingSafety,
            drivingSmoothness,
            behaviorPoliteness,
            experience: experience.trim() || undefined,
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-[#0d121c] dark:text-white">New Rating</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[#49659c] dark:text-gray-400 mb-1">Driver ID *</label>
                        <input
                            type="text"
                            value={driverId}
                            onChange={(e) => setDriverId(e.target.value)}
                            required
                            placeholder="UUID"
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#49659c] dark:text-gray-400 mb-1">Trip ID (optional)</label>
                        <input
                            type="text"
                            value={tripId}
                            onChange={(e) => setTripId(e.target.value)}
                            placeholder="UUID"
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#49659c] dark:text-gray-400 mb-1">Customer name *</label>
                        <input
                            type="text"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            required
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#49659c] dark:text-gray-400 mb-1">Customer phone *</label>
                        <input
                            type="text"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            required
                            minLength={10}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#49659c] dark:text-gray-400 mb-1">Customer email (optional)</label>
                        <input
                            type="email"
                            value={customerEmail}
                            onChange={(e) => setCustomerEmail(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white"
                        />
                    </div>
                    {(
                        [
                            ['Overall', overallRating, setOverallRating],
                            ['Safety', drivingSafety, setDrivingSafety],
                            ['Smoothness', drivingSmoothness, setDrivingSmoothness],
                            ['Politeness', behaviorPoliteness, setBehaviorPoliteness],
                        ] as const
                    ).map(([label, val, set]) => (
                        <div key={label}>
                            <label className="block text-sm font-medium text-[#49659c] dark:text-gray-400 mb-1">{label} (1–5)</label>
                            <input
                                type="number"
                                min={1}
                                max={5}
                                value={val}
                                onChange={(e) => set(Number(e.target.value))}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white"
                            />
                        </div>
                    ))}
                    <div>
                        <label className="block text-sm font-medium text-[#49659c] dark:text-gray-400 mb-1">Experience (optional)</label>
                        <textarea
                            value={experience}
                            onChange={(e) => setExperience(e.target.value)}
                            rows={2}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white resize-none"
                        />
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
