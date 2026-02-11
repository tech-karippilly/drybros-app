"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/lib/hooks';
import {
    createTripType,
    fetchTripTypesPaginated,
} from '@/lib/features/tripType/tripTypeSlice';
import {
    Save, Loader2, DollarSign, Clock, FileText, Plus, Trash2, 
    Zap, Info, ArrowLeft, Car
} from 'lucide-react';
import {
    PricingMode,
    CarType,
    CAR_TYPE_METADATA,
} from '@/lib/features/tripType/tripTypeApi';

type SlabType = 'distance' | 'time';

interface DistanceSlabEntry {
    fromKm: number;
    toKm: number | null;
    amount: number;
}

interface TimeSlabEntry {
    fromTime: number;
    toTime: number | null;
    amount: number;
}

export default function CreateTripTypePage() {
    const dispatch = useAppDispatch();
    const router = useRouter();
    
    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        carCategory: CarType.NORMAL,
        pricingMode: PricingMode.TIME as PricingMode,
        // Time Based fields
        baseAmount: 0,
        baseHour: 1,
        extraPerHour: 0,
        extraPerHalfHour: 0,
        // Distance Based fields
        baseDistance: 0,
        extraPerDistance: 0,
        // Slab Based fields
        slabType: 'distance' as SlabType,
        distanceSlabs: [{ fromKm: 0, toKm: 100, amount: 0 }] as DistanceSlabEntry[],
        timeSlabs: [{ fromTime: 0, toTime: 1, amount: 0 }] as TimeSlabEntry[],
    });

    // UI state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    // Update pricing mode
    const handlePricingModeChange = (mode: PricingMode) => {
        setFormData(prev => ({
            ...prev,
            pricingMode: mode,
        }));
    };

    // Add distance slab entry
    const addDistanceSlabEntry = () => {
        setFormData(prev => {
            const lastSlab = prev.distanceSlabs[prev.distanceSlabs.length - 1];
            const newFromKm = lastSlab.toKm !== null ? lastSlab.toKm + 1 : 0;
            return {
                ...prev,
                distanceSlabs: [
                    ...prev.distanceSlabs.slice(0, -1),
                    { ...lastSlab, toKm: newFromKm - 1 },
                    { fromKm: newFromKm, toKm: newFromKm + 99, amount: 0 }
                ]
            };
        });
    };

    // Remove distance slab entry
    const removeDistanceSlabEntry = (index: number) => {
        setFormData(prev => {
            if (prev.distanceSlabs.length <= 1) return prev;
            const newSlabs = prev.distanceSlabs.filter((_, i) => i !== index);
            if (newSlabs.length > 0) {
                newSlabs[newSlabs.length - 1].toKm = null;
            }
            return { ...prev, distanceSlabs: newSlabs };
        });
    };

    // Update distance slab entry
    const updateDistanceSlabEntry = (index: number, field: keyof DistanceSlabEntry, value: number | null) => {
        setFormData(prev => {
            const newSlabs = [...prev.distanceSlabs];
            newSlabs[index] = { ...newSlabs[index], [field]: value };
            return { ...prev, distanceSlabs: newSlabs };
        });
    };

    // Add time slab entry
    const addTimeSlabEntry = () => {
        setFormData(prev => {
            const lastSlab = prev.timeSlabs[prev.timeSlabs.length - 1];
            const newFromTime = lastSlab.toTime !== null ? lastSlab.toTime + 1 : 0;
            return {
                ...prev,
                timeSlabs: [
                    ...prev.timeSlabs.slice(0, -1),
                    { ...lastSlab, toTime: newFromTime - 1 },
                    { fromTime: newFromTime, toTime: newFromTime + 1, amount: 0 }
                ]
            };
        });
    };

    // Remove time slab entry
    const removeTimeSlabEntry = (index: number) => {
        setFormData(prev => {
            if (prev.timeSlabs.length <= 1) return prev;
            const newSlabs = prev.timeSlabs.filter((_, i) => i !== index);
            if (newSlabs.length > 0) {
                newSlabs[newSlabs.length - 1].toTime = null;
            }
            return { ...prev, timeSlabs: newSlabs };
        });
    };

    // Update time slab entry
    const updateTimeSlabEntry = (index: number, field: keyof TimeSlabEntry, value: number | null) => {
        setFormData(prev => {
            const newSlabs = [...prev.timeSlabs];
            newSlabs[index] = { ...newSlabs[index], [field]: value };
            return { ...prev, timeSlabs: newSlabs };
        });
    };

    // Validation
    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        // Basic validation
        if (!formData.name.trim()) {
            errors.name = 'Trip type name is required';
        }

        // Mode-specific validation
        if (formData.pricingMode === PricingMode.TIME) {
            if (formData.baseAmount <= 0) {
                errors.baseAmount = 'Base amount must be greater than 0';
            }
            if (formData.baseHour <= 0) {
                errors.baseHour = 'Base hour must be greater than 0';
            }
        } else if (formData.pricingMode === PricingMode.DISTANCE) {
            if (formData.baseAmount <= 0) {
                errors.baseAmount = 'Base amount must be greater than 0';
            }
            if (formData.baseHour <= 0) {
                errors.baseHour = 'Base hour must be greater than 0';
            }
            if (formData.baseDistance <= 0) {
                errors.baseDistance = 'Base distance must be greater than 0';
            }
        } else if (formData.pricingMode === PricingMode.SLAB) {
            if (formData.slabType === 'distance') {
                formData.distanceSlabs.forEach((slab, idx) => {
                    if (slab.amount <= 0) {
                        errors[`distanceSlab_${idx}`] = `Slab ${idx + 1} amount must be greater than 0`;
                    }
                });
            } else {
                formData.timeSlabs.forEach((slab, idx) => {
                    if (slab.amount <= 0) {
                        errors[`timeSlab_${idx}`] = `Slab ${idx + 1} amount must be greater than 0`;
                    }
                });
            }
        }

        setValidationErrors(errors);
        if (Object.keys(errors).length > 0) {
            setError('Please fix the validation errors below');
            return false;
        }

        return true;
    };

    // Submit form
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            const payload: any = {
                name: formData.name.trim(),
                description: formData.description.trim() || undefined,
                carCategory: formData.carCategory,
                type: formData.pricingMode,
            };

            // Add mode-specific fields
            if (formData.pricingMode === PricingMode.TIME) {
                payload.baseAmount = formData.baseAmount;
                payload.baseHour = formData.baseHour;
                payload.extraPerHour = formData.extraPerHour;
                payload.extraPerHalfHour = formData.extraPerHalfHour;
            } else if (formData.pricingMode === PricingMode.DISTANCE) {
                payload.baseAmount = formData.baseAmount;
                payload.baseHour = formData.baseHour;
                payload.baseDistance = formData.baseDistance;
                payload.extraPerDistance = formData.extraPerDistance;
            } else if (formData.pricingMode === PricingMode.SLAB) {
                payload.slabType = formData.slabType;
                if (formData.slabType === 'distance') {
                    payload.distanceSlab = formData.distanceSlabs.map(slab => ({
                        from: slab.fromKm,
                        to: slab.toKm,
                        price: slab.amount
                    }));
                } else {
                    payload.timeSlab = formData.timeSlabs.map(slab => ({
                        from: `${String(slab.fromTime).padStart(2, '0')}:00`,
                        to: slab.toTime !== null ? `${String(slab.toTime).padStart(2, '0')}:00` : '23:59',
                        price: slab.amount
                    }));
                }
            }

            await dispatch(createTripType(payload)).unwrap();
            dispatch(fetchTripTypesPaginated({ page: 1, limit: 10 }));
            router.push('/dashboard/trip-types');
        } catch (err: any) {
            setError(
                err?.message ||
                err?.response?.data?.error ||
                'Failed to create trip type'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0d121c]">
            {/* Header */}
            <div className="bg-white dark:bg-[#101622] border-b border-gray-200 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/dashboard/trip-types')}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-600 dark:text-gray-400"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                    Create Trip Type
                                </h1>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Define pricing logic and vehicle categories for new ride services.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Error Display */}
                    {error && (
                        <div className="bg-white dark:bg-[#101622] rounded-2xl shadow-sm border border-red-200 dark:border-red-800 p-4">
                            <div className="flex items-start gap-3">
                                <Info className="text-red-600 dark:text-red-400 mt-0.5" size={18} />
                                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Basic Information */}
                    <div className="bg-white dark:bg-[#101622] rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 space-y-6">
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <FileText size={20} className="text-blue-600 dark:text-blue-400" />
                            Basic Information
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Name */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Trip Type Name *
                                </label>
                                <input
                                    required
                                    name="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g. City Round Trip, Long Distance"
                                    className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border ${
                                        validationErrors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                                    } rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:text-white`}
                                    disabled={isSubmitting}
                                />
                                {validationErrors.name && (
                                    <p className="text-xs text-red-600 dark:text-red-400">{validationErrors.name}</p>
                                )}
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Description (Optional)
                                </label>
                                <input
                                    name="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Brief description..."
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:text-white"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Car Category and Pricing Mode */}
                    <div className="bg-white dark:bg-[#101622] rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Car Category */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Car Category *
                                </label>
                                <select
                                    value={formData.carCategory}
                                    onChange={(e) => setFormData(prev => ({ ...prev, carCategory: e.target.value as CarType }))}
                                    className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                >
                                    {Object.values(CarType).map((category) => {
                                        const metadata = CAR_TYPE_METADATA[category];
                                        return (
                                            <option key={category} value={category}>
                                                {metadata.label}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            {/* Pricing Mode */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Pricing Mode *
                                </label>
                                <select
                                    value={formData.pricingMode}
                                    onChange={(e) => handlePricingModeChange(e.target.value as PricingMode)}
                                    className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                >
                                    <option value={PricingMode.TIME}>Time Based</option>
                                    <option value={PricingMode.DISTANCE}>Distance Based</option>
                                    <option value={PricingMode.SLAB}>Slab Based</option>
                                </select>
                            </div>
                        </div>

                        {/* Slab Based Sub-options */}
                        {formData.pricingMode === PricingMode.SLAB && (
                            <div className="p-4 border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/30">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Slab Type
                                </label>
                                <select
                                    value={formData.slabType}
                                    onChange={(e) => setFormData(prev => ({ ...prev, slabType: e.target.value as SlabType }))}
                                    className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                >
                                    <option value="distance">Distance Based Slabs</option>
                                    <option value="time">Time Based Slabs</option>
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Time Based Form */}
                    {formData.pricingMode === PricingMode.TIME && (
                        <div className="bg-white dark:bg-[#101622] rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 space-y-4">
                            <h4 className="text-md font-bold text-gray-900 dark:text-white">Time Based Configuration</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Base Amount (₹) *</label>
                                    <input
                                        required
                                        type="number"
                                        value={formData.baseAmount}
                                        onChange={(e) => setFormData(prev => ({ ...prev, baseAmount: parseFloat(e.target.value) || 0 }))}
                                        min="0"
                                        step="10"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:text-white"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Base Hour(s) *</label>
                                    <input
                                        required
                                        type="number"
                                        value={formData.baseHour}
                                        onChange={(e) => setFormData(prev => ({ ...prev, baseHour: parseFloat(e.target.value) || 0 }))}
                                        min="0.5"
                                        step="0.5"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:text-white"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Extra Per Hour (₹)</label>
                                    <input
                                        type="number"
                                        value={formData.extraPerHour}
                                        onChange={(e) => setFormData(prev => ({ ...prev, extraPerHour: parseFloat(e.target.value) || 0 }))}
                                        min="0"
                                        step="10"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:text-white"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Extra Per Half Hour (₹)</label>
                                    <input
                                        type="number"
                                        value={formData.extraPerHalfHour}
                                        onChange={(e) => setFormData(prev => ({ ...prev, extraPerHalfHour: parseFloat(e.target.value) || 0 }))}
                                        min="0"
                                        step="10"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Distance Based Form */}
                    {formData.pricingMode === PricingMode.DISTANCE && (
                        <div className="bg-white dark:bg-[#101622] rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 space-y-4">
                            <h4 className="text-md font-bold text-gray-900 dark:text-white">Distance Based Configuration</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Base Amount (₹) *</label>
                                    <input
                                        required
                                        type="number"
                                        value={formData.baseAmount}
                                        onChange={(e) => setFormData(prev => ({ ...prev, baseAmount: parseFloat(e.target.value) || 0 }))}
                                        min="0"
                                        step="10"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:text-white"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Base Hour(s) *</label>
                                    <input
                                        required
                                        type="number"
                                        value={formData.baseHour}
                                        onChange={(e) => setFormData(prev => ({ ...prev, baseHour: parseFloat(e.target.value) || 0 }))}
                                        min="0.5"
                                        step="0.5"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:text-white"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Base Distance (km) *</label>
                                    <input
                                        required
                                        type="number"
                                        value={formData.baseDistance}
                                        onChange={(e) => setFormData(prev => ({ ...prev, baseDistance: parseFloat(e.target.value) || 0 }))}
                                        min="0"
                                        step="10"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:text-white"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Extra Per Distance (₹/km)</label>
                                    <input
                                        type="number"
                                        value={formData.extraPerDistance}
                                        onChange={(e) => setFormData(prev => ({ ...prev, extraPerDistance: parseFloat(e.target.value) || 0 }))}
                                        min="0"
                                        step="1"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Slab Based Form */}
                    {formData.pricingMode === PricingMode.SLAB && (
                        <div className="bg-white dark:bg-[#101622] rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-md font-bold text-gray-900 dark:text-white">
                                    {formData.slabType === 'distance' ? 'Distance Based Slabs' : 'Time Based Slabs'}
                                </h4>
                                <button
                                    type="button"
                                    onClick={formData.slabType === 'distance' ? addDistanceSlabEntry : addTimeSlabEntry}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
                                >
                                    <Plus size={16} />
                                    Add Slab
                                </button>
                            </div>

                            {formData.slabType === 'distance' ? (
                                <div className="space-y-3">
                                    {formData.distanceSlabs.map((slab, index) => (
                                        <div key={index} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Slab {index + 1}</span>
                                                {formData.distanceSlabs.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeDistanceSlabEntry(index)}
                                                        className="text-red-600 hover:text-red-700 dark:text-red-400"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="space-y-1">
                                                    <label className="text-xs text-gray-600 dark:text-gray-400">From (km)</label>
                                                    <input
                                                        type="number"
                                                        value={slab.fromKm}
                                                        onChange={(e) => updateDistanceSlabEntry(index, 'fromKm', parseFloat(e.target.value) || 0)}
                                                        min="0"
                                                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm dark:text-white"
                                                        disabled={index > 0}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs text-gray-600 dark:text-gray-400">To (km)</label>
                                                    <input
                                                        type="number"
                                                        value={slab.toKm ?? ''}
                                                        onChange={(e) => updateDistanceSlabEntry(index, 'toKm', e.target.value ? parseFloat(e.target.value) : null)}
                                                        min={slab.fromKm + 1}
                                                        placeholder="∞"
                                                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm dark:text-white"
                                                        disabled={index === formData.distanceSlabs.length - 1}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs text-gray-600 dark:text-gray-400">Amount (₹)</label>
                                                    <input
                                                        type="number"
                                                        value={slab.amount}
                                                        onChange={(e) => updateDistanceSlabEntry(index, 'amount', parseFloat(e.target.value) || 0)}
                                                        min="0"
                                                        step="10"
                                                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-semibold dark:text-white"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {formData.timeSlabs.map((slab, index) => (
                                        <div key={index} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Slab {index + 1}</span>
                                                {formData.timeSlabs.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeTimeSlabEntry(index)}
                                                        className="text-red-600 hover:text-red-700 dark:text-red-400"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="space-y-1">
                                                    <label className="text-xs text-gray-600 dark:text-gray-400">From (hours)</label>
                                                    <input
                                                        type="number"
                                                        value={slab.fromTime}
                                                        onChange={(e) => updateTimeSlabEntry(index, 'fromTime', parseFloat(e.target.value) || 0)}
                                                        min="0"
                                                        step="0.5"
                                                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm dark:text-white"
                                                        disabled={index > 0}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs text-gray-600 dark:text-gray-400">To (hours)</label>
                                                    <input
                                                        type="number"
                                                        value={slab.toTime ?? ''}
                                                        onChange={(e) => updateTimeSlabEntry(index, 'toTime', e.target.value ? parseFloat(e.target.value) : null)}
                                                        min={slab.fromTime + 0.5}
                                                        step="0.5"
                                                        placeholder="∞"
                                                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm dark:text-white"
                                                        disabled={index === formData.timeSlabs.length - 1}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs text-gray-600 dark:text-gray-400">Amount (₹)</label>
                                                    <input
                                                        type="number"
                                                        value={slab.amount}
                                                        onChange={(e) => updateTimeSlabEntry(index, 'amount', parseFloat(e.target.value) || 0)}
                                                        min="0"
                                                        step="10"
                                                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-semibold dark:text-white"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-4 pb-8">
                        <button
                            type="button"
                            onClick={() => router.push('/dashboard/trip-types')}
                            disabled={isSubmitting}
                            className="px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all font-semibold border border-gray-300 dark:border-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-8 py-3 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-xl transition-all font-bold flex items-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Save size={20} />
                                    Save Configuration
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
