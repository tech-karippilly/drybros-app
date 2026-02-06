"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { createComplaint, type CreateComplaintRequest } from '@/lib/features/complaints/complaintsApi';
import { COMPLAINT_PRIORITY } from '@/lib/constants/complaints';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { DASHBOARD_ROUTES } from '@/lib/constants/routes';

export default function CreateComplaintPage() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const [driverId, setDriverId] = useState('');
    const [staffId, setStaffId] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [tripId, setTripId] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<CreateComplaintRequest['priority']>('MEDIUM');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!title.trim() || !description.trim()) {
            setError('Title and description are required.');
            return;
        }
        if (!customerName.trim()) {
            setError('Customer name is required.');
            return;
        }
        if (!driverId && !staffId) {
            setError('Provide either driver ID or staff ID.');
            return;
        }
        if (driverId && staffId) {
            setError('Provide only one of driver ID or staff ID.');
            return;
        }

        try {
            setSubmitting(true);
            await createComplaint({
                driverId: driverId || undefined,
                staffId: staffId || undefined,
                customerName: customerName.trim(),
                tripId: tripId || undefined,
                title: title.trim(),
                description: description.trim(),
                priority,
            });
            router.push(DASHBOARD_ROUTES.COMPLAINTS);
        } catch (e: unknown) {
            const msg = e && typeof e === 'object' && 'response' in e
                ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
                : e instanceof Error ? e.message : 'Failed to create complaint';
            setError(String(msg));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="p-6 max-w-3xl">
                <div className="mb-6">
                    <Link 
                        href={DASHBOARD_ROUTES.COMPLAINTS}
                        className="inline-flex items-center gap-2 text-[#0d59f2] hover:underline mb-4"
                    >
                        <ArrowLeft size={18} />
                        Back to Complaints
                    </Link>
                    <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white">Create New Complaint</h2>
                    <p className="text-sm text-[#49659c] dark:text-gray-400">File a complaint against a driver or staff member.</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
                        {error}
                    </div>
                )}

                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-[#0d121c] dark:text-white mb-2">
                                    Customer Name *
                                </label>
                                <input
                                    type="text"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    placeholder="Enter customer name"
                                    required
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white focus:ring-2 focus:ring-[#0d59f2]/20 outline-none"
                                />
                                <p className="text-xs text-[#49659c] dark:text-gray-500 mt-1">
                                    Name of the customer who filed this complaint
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#0d121c] dark:text-white mb-2">
                                    Trip ID (optional)
                                </label>
                                <input
                                    type="text"
                                    value={tripId}
                                    onChange={(e) => setTripId(e.target.value)}
                                    placeholder="UUID of related trip"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white focus:ring-2 focus:ring-[#0d59f2]/20 outline-none"
                                />
                                <p className="text-xs text-[#49659c] dark:text-gray-500 mt-1">
                                    If related to a specific trip
                                </p>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
                            <h3 className="text-sm font-semibold text-[#0d121c] dark:text-white mb-4">
                                Subject (Driver or Staff)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-[#0d121c] dark:text-white mb-2">
                                        Driver ID
                                    </label>
                                    <input
                                        type="text"
                                        value={driverId}
                                        onChange={(e) => { 
                                            setDriverId(e.target.value); 
                                            if (e.target.value) setStaffId(''); 
                                        }}
                                        placeholder="UUID"
                                        disabled={!!staffId}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white focus:ring-2 focus:ring-[#0d59f2]/20 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                    <p className="text-xs text-[#49659c] dark:text-gray-500 mt-1">
                                        Complaint against a driver
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[#0d121c] dark:text-white mb-2">
                                        Staff ID
                                    </label>
                                    <input
                                        type="text"
                                        value={staffId}
                                        onChange={(e) => { 
                                            setStaffId(e.target.value); 
                                            if (e.target.value) setDriverId(''); 
                                        }}
                                        placeholder="UUID"
                                        disabled={!!driverId}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white focus:ring-2 focus:ring-[#0d59f2]/20 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                    <p className="text-xs text-[#49659c] dark:text-gray-500 mt-1">
                                        Complaint against a staff member
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
                            <h3 className="text-sm font-semibold text-[#0d121c] dark:text-white mb-4">
                                Complaint Details
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#0d121c] dark:text-white mb-2">
                                        Title *
                                    </label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Brief description of the complaint"
                                        required
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white focus:ring-2 focus:ring-[#0d59f2]/20 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[#0d121c] dark:text-white mb-2">
                                        Description *
                                    </label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Detailed description of the complaint..."
                                        required
                                        rows={5}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white focus:ring-2 focus:ring-[#0d59f2]/20 outline-none resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[#0d121c] dark:text-white mb-2">
                                        Priority
                                    </label>
                                    <select
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value as CreateComplaintRequest['priority'])}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white focus:ring-2 focus:ring-[#0d59f2]/20 outline-none"
                                    >
                                        {COMPLAINT_PRIORITY.map((p) => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                            <Link
                                href={DASHBOARD_ROUTES.COMPLAINTS}
                                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 font-medium text-center dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                Cancel
                            </Link>
                            <button 
                                type="submit" 
                                disabled={submitting} 
                                className="flex-1 px-4 py-2.5 rounded-lg bg-[#0d59f2] text-white font-bold hover:bg-[#0d59f2]/90 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
                            >
                                {submitting && <Loader2 size={18} className="animate-spin" />}
                                {submitting ? 'Creating...' : 'Create Complaint'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
}
