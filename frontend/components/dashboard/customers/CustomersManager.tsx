"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { getCustomers, type CustomerResponse } from '@/lib/features/customers/customersApi';
import { Search, Loader2, AlertCircle, User } from 'lucide-react';

export function CustomersManager() {
    const [list, setList] = useState<CustomerResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    const fetchList = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getCustomers();
            setList(data);
        } catch (e: unknown) {
            const msg = e && typeof e === 'object' && 'response' in e
                ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
                : e instanceof Error ? e.message : 'Failed to load customers';
            setError(String(msg));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchList();
    }, [fetchList]);

    const filtered = list.filter(
        (c) =>
            c.fullName.toLowerCase().includes(search.toLowerCase()) ||
            (c.phone || '').includes(search) ||
            (c.email || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
            <div>
                <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white">Customers</h2>
                <p className="text-sm text-[#49659c] dark:text-gray-400">View customer database.</p>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#49659c] size-4" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, phone, email..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm dark:text-white outline-none focus:ring-2 focus:ring-[#0d59f2]/20"
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
                    <div className="py-16 text-center text-[#49659c] dark:text-gray-400">No customers.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                                <tr>
                                    <th className="text-left px-6 py-3 font-semibold text-[#0d121c] dark:text-white">Name</th>
                                    <th className="text-left px-6 py-3 font-semibold text-[#0d121c] dark:text-white">Phone</th>
                                    <th className="text-left px-6 py-3 font-semibold text-[#0d121c] dark:text-white">Email</th>
                                    <th className="text-left px-6 py-3 font-semibold text-[#0d121c] dark:text-white">City</th>
                                    <th className="text-left px-6 py-3 font-semibold text-[#0d121c] dark:text-white">Franchise</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((c) => (
                                    <tr key={c.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                                        <td className="px-6 py-3">
                                            <p className="font-medium text-[#0d121c] dark:text-white">{c.fullName}</p>
                                            <p className="text-xs text-[#49659c] dark:text-gray-400">#{c.id}</p>
                                        </td>
                                        <td className="px-6 py-3 text-[#49659c] dark:text-gray-400">{c.phone}</td>
                                        <td className="px-6 py-3 text-[#49659c] dark:text-gray-400">{c.email || '—'}</td>
                                        <td className="px-6 py-3 text-[#49659c] dark:text-gray-400">{c.city || '—'}</td>
                                        <td className="px-6 py-3 text-[#49659c] dark:text-gray-400">{c.franchiseId}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
