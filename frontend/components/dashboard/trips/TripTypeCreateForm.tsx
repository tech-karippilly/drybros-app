"use client";

import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '@/lib/hooks';
import {
    createTripType,
    updateTripType,
    fetchTripTypesPaginated,
} from '@/lib/features/tripType/tripTypeSlice';
import { X, Save, Loader2, DollarSign, Clock, FileText } from 'lucide-react';
import { TripTypeResponse } from '@/lib/features/tripType/tripTypeApi';

interface TripTypeCreateFormProps {
    onClose: () => void;
    tripType?: TripTypeResponse | null;
}

export function TripTypeCreateForm({
    onClose,
    tripType,
}: TripTypeCreateFormProps) {
    const dispatch = useAppDispatch();
    const [formData, setFormData] = useState({
        name: '',
        basePrice: '',
        baseHours: '1',
        extraPerHour: '',
        extraPerHalfHour: '',
        description: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (tripType) {
            // Calculate base hours if basePricePerHour exists, otherwise default to 1
            const calculatedBaseHours = tripType.basePricePerHour
                ? (tripType.basePrice / tripType.basePricePerHour).toString()
                : tripType.baseDuration?.toString() || '1';
            
            setFormData({
                name: tripType.name,
                basePrice: tripType.basePrice.toString(),
                baseHours: calculatedBaseHours,
                extraPerHour: tripType.extraPerHour.toString(),
                extraPerHalfHour: tripType.extraPerHalfHour?.toString() || '',
                description: tripType.description || '',
            });
        }
    }, [tripType]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setError(null);
    };

    const validateForm = (): boolean => {
        if (!formData.name.trim()) {
            setError('Trip type name is required');
            return false;
        }
        if (!formData.basePrice || parseFloat(formData.basePrice) <= 0) {
            setError('Base price must be greater than 0');
            return false;
        }
        if (!formData.extraPerHour || parseFloat(formData.extraPerHour) < 0) {
            setError('Extra per hour must be 0 or greater');
            return false;
        }
        if (
            formData.extraPerHalfHour &&
            parseFloat(formData.extraPerHalfHour) < 0
        ) {
            setError('Extra per 30 minutes must be 0 or greater');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            const basePricePerHour = parseFloat(formData.basePrice);
            const baseHours = parseFloat(formData.baseHours);
            const totalBasePrice = basePricePerHour * baseHours;

            const payload = {
                name: formData.name.trim(),
                basePrice: totalBasePrice,
                basePricePerHour: basePricePerHour,
                baseDuration: baseHours,
                extraPerHour: parseFloat(formData.extraPerHour) || 0,
                extraPerHalfHour: formData.extraPerHalfHour
                    ? parseFloat(formData.extraPerHalfHour)
                    : undefined,
                description: formData.description.trim() || undefined,
            };

            if (tripType) {
                await dispatch(updateTripType({ id: tripType.id, data: payload })).unwrap();
            } else {
                await dispatch(createTripType(payload)).unwrap();
            }

            // Refresh the list
            dispatch(fetchTripTypesPaginated({ page: 1, limit: 10 }));
            onClose();
        } catch (err: any) {
            setError(
                err?.message ||
                    err?.response?.data?.error ||
                    `Failed to ${tripType ? 'update' : 'create'} trip type`
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-[#0d121c]/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#101622] w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                    <div>
                        <h3 className="text-xl font-bold dark:text-white">
                            {tripType ? 'Edit Trip Type' : 'Create Trip Type'}
                        </h3>
                        <p className="text-xs text-[#49659c] font-medium uppercase tracking-wider mt-1">
                            {tripType
                                ? 'Update trip type configuration'
                                : 'Add a new trip type to the system'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-all text-[#49659c]"
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    <div className="space-y-6">
                        {/* Trip Type Name */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-[#49659c] uppercase tracking-widest flex items-center gap-2">
                                <FileText size={14} />
                                Trip Type Name
                            </label>
                            <input
                                required
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g. CITY_ROUND, CITY_DROPOFF"
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-medium"
                                disabled={isSubmitting || !!tripType}
                            />
                            {tripType && (
                                <p className="text-xs text-[#49659c]">
                                    Trip type name cannot be changed after creation
                                </p>
                            )}
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-[#49659c] uppercase tracking-widest">
                                Description (Optional)
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Brief description of this trip type..."
                                rows={3}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-medium resize-none"
                                disabled={isSubmitting}
                            />
                        </div>

                        {/* Base Price per Hour Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Base Price per Hour */}
                            <div className="space-y-2">
                                <label className="text-xs font-black text-[#49659c] uppercase tracking-widest flex items-center gap-2">
                                    <DollarSign size={14} />
                                    Base Price / Hour (INR)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#49659c] dark:text-gray-400 font-medium">
                                        ₹
                                    </span>
                                    <input
                                        required
                                        type="number"
                                        name="basePrice"
                                        value={formData.basePrice}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                        className="w-full pl-8 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-medium"
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>

                            {/* Base Hours Selector */}
                            <div className="space-y-2">
                                <label className="text-xs font-black text-[#49659c] uppercase tracking-widest flex items-center gap-2">
                                    <Clock size={14} />
                                    Base Hours
                                </label>
                                <select
                                    name="baseHours"
                                    value={formData.baseHours}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-medium"
                                    disabled={isSubmitting}
                                >
                                    {Array.from({ length: 24 }, (_, i) => i + 1).map((hour) => (
                                        <option key={hour} value={hour}>
                                            {hour} {hour === 1 ? 'Hour' : 'Hours'}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-[#49659c]">
                                    Total base price: ₹{((parseFloat(formData.basePrice) || 0) * (parseFloat(formData.baseHours) || 1)).toFixed(2)}
                                </p>
                            </div>
                        </div>

                        {/* Extra Pricing Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Extra per Hour */}
                            <div className="space-y-2">
                                <label className="text-xs font-black text-[#49659c] uppercase tracking-widest flex items-center gap-2">
                                    <Clock size={14} />
                                    Extra per Hour (INR)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#49659c] dark:text-gray-400 font-medium">
                                        ₹
                                    </span>
                                    <input
                                        required
                                        type="number"
                                        name="extraPerHour"
                                        value={formData.extraPerHour}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                        className="w-full pl-8 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-medium"
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>

                            {/* Extra per 30 Min */}
                            <div className="space-y-2">
                                <label className="text-xs font-black text-[#49659c] uppercase tracking-widest flex items-center gap-2">
                                    <Clock size={14} />
                                    Extra per 30 Min (INR) (Optional)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#49659c] dark:text-gray-400 font-medium">
                                        ₹
                                    </span>
                                    <input
                                        type="number"
                                        name="extraPerHalfHour"
                                        value={formData.extraPerHalfHour}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                        className="w-full pl-8 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-medium"
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-6 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl text-[#49659c] font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-6 py-2.5 bg-[#0d59f2] text-white rounded-xl font-bold hover:bg-[#0d59f2]/90 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    <span>{tripType ? 'Update' : 'Create'} Trip Type</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
