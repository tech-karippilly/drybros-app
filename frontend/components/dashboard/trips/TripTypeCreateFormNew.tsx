"use client";

import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '@/lib/hooks';
import {
    createTripType,
    updateTripType,
    fetchTripTypesPaginated,
} from '@/lib/features/tripType/tripTypeSlice';
import {
    X, Save, Loader2, DollarSign, Clock, FileText, Plus, Trash2, 
    ChevronDown, ChevronUp, Copy, Zap, Info
} from 'lucide-react';
import {
    TripTypeResponse,
    PricingMode,
    CarType,
    CarTypePricing,
    DistanceSlab,
    CAR_TYPE_METADATA,
} from '@/lib/features/tripType/tripTypeApi';

interface TripTypeCreateFormNewProps {
    onClose: () => void;
    tripType?: TripTypeResponse | null;
}

// Template presets for quick setup
const TEMPLATES = {
    CITY_ROUND: {
        name: 'City Round',
        pricingMode: PricingMode.TIME_BASED,
        baseHour: 3,
        extraPerHour: 100,
        extraPerHalfHour: 50,
        carTypePricing: [
            { carType: CarType.MANUAL, basePrice: 400 },
            { carType: CarType.AUTOMATIC, basePrice: 450 },
            { carType: CarType.PREMIUM_CARS, basePrice: 600 },
            { carType: CarType.LUXURY_CARS, basePrice: 800 },
            { carType: CarType.SPORTY_CARS, basePrice: 1000 },
        ]
    },
    LONG_ROUND: {
        name: 'Long Round',
        pricingMode: PricingMode.DISTANCE_BASED,
        baseHour: 8,
        baseDistance: 200,
        extraPerHour: 150,
        extraPerHalfHour: 75,
        carTypePricing: [
            {
                carType: CarType.MANUAL,
                basePrice: 3000,
                distanceSlabs: [
                    { from: 0, to: 100, price: 3000 },
                    { from: 101, to: 200, price: 4500 },
                    { from: 201, to: null, price: 6000 },
                ]
            },
            {
                carType: CarType.AUTOMATIC,
                basePrice: 3300,
                distanceSlabs: [
                    { from: 0, to: 100, price: 3300 },
                    { from: 101, to: 200, price: 5000 },
                    { from: 201, to: null, price: 6500 },
                ]
            },
            {
                carType: CarType.PREMIUM_CARS,
                basePrice: 4500,
                distanceSlabs: [
                    { from: 0, to: 100, price: 4500 },
                    { from: 101, to: 200, price: 6500 },
                    { from: 201, to: null, price: 8500 },
                ]
            },
            {
                carType: CarType.LUXURY_CARS,
                basePrice: 6000,
                distanceSlabs: [
                    { from: 0, to: 100, price: 6000 },
                    { from: 101, to: 200, price: 8500 },
                    { from: 201, to: null, price: 11000 },
                ]
            },
            {
                carType: CarType.SPORTY_CARS,
                basePrice: 8000,
                distanceSlabs: [
                    { from: 0, to: 100, price: 8000 },
                    { from: 101, to: 200, price: 11000 },
                    { from: 201, to: null, price: 14000 },
                ]
            },
        ]
    }
};

// Initialize empty car type pricing
const initializeCarTypePricing = (pricingMode: PricingMode): Omit<CarTypePricing, 'id'>[] => {
    return Object.values(CarType).map(carType => ({
        carType,
        basePrice: 0,
        distanceSlabs: pricingMode === PricingMode.DISTANCE_BASED
            ? [{ from: 0, to: 100, price: 0 }]
            : undefined
    }));
};

export function TripTypeCreateFormNew({
    onClose,
    tripType,
}: TripTypeCreateFormNewProps) {
    const dispatch = useAppDispatch();
    
    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        pricingMode: PricingMode.TIME_BASED,
        baseHour: 1,
        extraPerHour: 0,
        extraPerHalfHour: 0,
        baseDistance: 0,
        carTypePricing: initializeCarTypePricing(PricingMode.TIME_BASED),
    });

    // UI state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedCarTypes, setExpandedCarTypes] = useState<Set<CarType>>(
        new Set([CarType.MANUAL])
    );
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    // Load existing trip type data
    useEffect(() => {
        if (tripType) {
            setFormData({
                name: tripType.name,
                description: tripType.description || '',
                pricingMode: tripType.pricingMode,
                baseHour: tripType.baseHour || 1,
                extraPerHour: tripType.extraPerHour || 0,
                extraPerHalfHour: tripType.extraPerHalfHour || 0,
                baseDistance: tripType.baseDistance || 0,
                carTypePricing: tripType.carTypePricing.map(cp => ({
                    carType: cp.carType,
                    basePrice: cp.basePrice,
                    distanceSlabs: cp.distanceSlabs || undefined
                }))
            });
        }
    }, [tripType]);

    // Toggle car type section
    const toggleCarType = (carType: CarType) => {
        setExpandedCarTypes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(carType)) {
                newSet.delete(carType);
            } else {
                newSet.add(carType);
            }
            return newSet;
        });
    };

    // Apply template
    const applyTemplate = (templateKey: keyof typeof TEMPLATES) => {
        const template = TEMPLATES[templateKey];
        setFormData({
            name: template.name,
            description: '',
            pricingMode: template.pricingMode,
            baseHour: template.baseHour || 1,
            extraPerHour: template.extraPerHour || 0,
            extraPerHalfHour: template.extraPerHalfHour || 0,
            baseDistance: template.baseDistance || 0,
            carTypePricing: template.carTypePricing.map(cp => ({
                carType: cp.carType,
                basePrice: cp.basePrice,
                distanceSlabs: cp.distanceSlabs
            }))
        });
        setError(null);
        setValidationErrors({});
    };

    // Update pricing mode
    const handlePricingModeChange = (mode: PricingMode) => {
        setFormData(prev => ({
            ...prev,
            pricingMode: mode,
            carTypePricing: prev.carTypePricing.map(cp => ({
                ...cp,
                distanceSlabs: mode === PricingMode.DISTANCE_BASED
                    ? (cp.distanceSlabs || [{ from: 0, to: 100, price: cp.basePrice }])
                    : undefined
            }))
        }));
    };

    // Update car type pricing
    const updateCarTypePricing = (carType: CarType, field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            carTypePricing: prev.carTypePricing.map(cp =>
                cp.carType === carType ? { ...cp, [field]: value } : cp
            )
        }));
        setValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[`${carType}_${field}`];
            return newErrors;
        });
    };

    // Add distance slab
    const addDistanceSlab = (carType: CarType) => {
        setFormData(prev => ({
            ...prev,
            carTypePricing: prev.carTypePricing.map(cp => {
                if (cp.carType === carType && cp.distanceSlabs) {
                    const lastSlab = cp.distanceSlabs[cp.distanceSlabs.length - 1];
                    const newFrom = lastSlab.to !== null ? lastSlab.to + 1 : 0;
                    return {
                        ...cp,
                        distanceSlabs: [
                            ...cp.distanceSlabs.slice(0, -1),
                            { ...lastSlab, to: newFrom - 1 },
                            { from: newFrom, to: newFrom + 99, price: lastSlab.price }
                        ]
                    };
                }
                return cp;
            })
        }));
    };

    // Remove distance slab
    const removeDistanceSlab = (carType: CarType, index: number) => {
        setFormData(prev => ({
            ...prev,
            carTypePricing: prev.carTypePricing.map(cp => {
                if (cp.carType === carType && cp.distanceSlabs && cp.distanceSlabs.length > 1) {
                    const newSlabs = cp.distanceSlabs.filter((_, i) => i !== index);
                    // Make last slab open-ended
                    if (newSlabs.length > 0) {
                        newSlabs[newSlabs.length - 1].to = null;
                    }
                    return { ...cp, distanceSlabs: newSlabs };
                }
                return cp;
            })
        }));
    };

    // Update distance slab
    const updateDistanceSlab = (
        carType: CarType,
        slabIndex: number,
        field: keyof DistanceSlab,
        value: number | null
    ) => {
        setFormData(prev => ({
            ...prev,
            carTypePricing: prev.carTypePricing.map(cp => {
                if (cp.carType === carType && cp.distanceSlabs) {
                    const newSlabs = [...cp.distanceSlabs];
                    newSlabs[slabIndex] = { ...newSlabs[slabIndex], [field]: value };
                    
                    // Auto-adjust ranges
                    if (field === 'to' && slabIndex < newSlabs.length - 1 && value !== null) {
                        newSlabs[slabIndex + 1].from = value + 1;
                    }
                    
                    return { ...cp, distanceSlabs: newSlabs };
                }
                return cp;
            })
        }));
    };

    // Duplicate pricing from one car type to another
    const duplicatePricing = (fromCarType: CarType, toCarType: CarType) => {
        const sourcePricing = formData.carTypePricing.find(cp => cp.carType === fromCarType);
        if (!sourcePricing) return;

        setFormData(prev => ({
            ...prev,
            carTypePricing: prev.carTypePricing.map(cp =>
                cp.carType === toCarType ? {
                    ...cp,
                    basePrice: sourcePricing.basePrice,
                    distanceSlabs: sourcePricing.distanceSlabs
                        ? JSON.parse(JSON.stringify(sourcePricing.distanceSlabs))
                        : undefined
                } : cp
            )
        }));
    };

    // Validation
    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        // Basic validation
        if (!formData.name.trim()) {
            errors.name = 'Trip type name is required';
        }

        if (formData.baseHour <= 0) {
            errors.baseHour = 'Base hour must be greater than 0';
        }

        if (formData.pricingMode === PricingMode.DISTANCE_BASED && formData.baseDistance <= 0) {
            errors.baseDistance = 'Base distance must be greater than 0 for distance-based pricing';
        }

        // Car type pricing validation
        formData.carTypePricing.forEach(cp => {
            if (cp.basePrice <= 0) {
                errors[`${cp.carType}_basePrice`] = `${CAR_TYPE_METADATA[cp.carType].label} base price must be greater than 0`;
            }

            if (formData.pricingMode === PricingMode.DISTANCE_BASED) {
                if (!cp.distanceSlabs || cp.distanceSlabs.length === 0) {
                    errors[`${cp.carType}_slabs`] = `${CAR_TYPE_METADATA[cp.carType].label} must have at least one distance slab`;
                } else {
                    cp.distanceSlabs.forEach((slab, idx) => {
                        if (slab.price <= 0) {
                            errors[`${cp.carType}_slab_${idx}_price`] = `Slab ${idx + 1} price must be greater than 0`;
                        }
                        if (slab.from < 0) {
                            errors[`${cp.carType}_slab_${idx}_from`] = `Slab ${idx + 1} 'from' must be >= 0`;
                        }
                        if (slab.to !== null && slab.to <= slab.from) {
                            errors[`${cp.carType}_slab_${idx}_to`] = `Slab ${idx + 1} 'to' must be greater than 'from'`;
                        }
                    });
                }
            }
        });

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
            const payload = {
                name: formData.name.trim(),
                description: formData.description.trim() || undefined,
                pricingMode: formData.pricingMode,
                baseHour: formData.baseHour,
                extraPerHour: formData.extraPerHour,
                extraPerHalfHour: formData.extraPerHalfHour,
                baseDistance: formData.pricingMode === PricingMode.DISTANCE_BASED
                    ? formData.baseDistance
                    : undefined,
                carTypePricing: formData.carTypePricing.map(cp => ({
                    carType: cp.carType,
                    basePrice: cp.basePrice,
                    distanceSlabs: formData.pricingMode === PricingMode.DISTANCE_BASED
                        ? cp.distanceSlabs
                        : undefined
                }))
            };

            if (tripType) {
                await dispatch(updateTripType({ id: tripType.id, data: payload })).unwrap();
            } else {
                await dispatch(createTripType(payload)).unwrap();
            }

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

    // Currency formatter
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    return (
        <div className="fixed inset-0 bg-[#0d121c]/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white dark:bg-[#101622] w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-300 my-8">
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900">
                    <div>
                        <h3 className="text-2xl font-bold dark:text-white">
                            {tripType ? 'Edit Trip Type' : 'Create Trip Type'}
                        </h3>
                        <p className="text-xs text-[#49659c] font-medium uppercase tracking-wider mt-1">
                            Configure pricing for all 5 car types
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
                    {/* Template Presets */}
                    {!tripType && (
                        <div className="mb-8 p-6 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl border border-indigo-100 dark:border-gray-700">
                            <div className="flex items-center gap-2 mb-4">
                                <Zap className="text-indigo-600" size={20} />
                                <h4 className="text-lg font-bold dark:text-white">Quick Start Templates</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => applyTemplate('CITY_ROUND')}
                                    className="p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-transparent hover:border-indigo-500 transition-all text-left group"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-bold text-gray-900 dark:text-white">City Round Trip</span>
                                        <Clock className="text-indigo-600 group-hover:scale-110 transition-transform" size={20} />
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Time-based pricing • 3 base hours • Starting from ₹400</p>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => applyTemplate('LONG_ROUND')}
                                    className="p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-transparent hover:border-indigo-500 transition-all text-left group"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-bold text-gray-900 dark:text-white">Long Round Trip</span>
                                        <DollarSign className="text-indigo-600 group-hover:scale-110 transition-transform" size={20} />
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Distance-based • 200km base • With distance slabs</p>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Error Display */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
                            <Info className="text-red-600 mt-0.5" size={18} />
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    {/* Basic Information */}
                    <div className="mb-8 space-y-6">
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <FileText size={20} className="text-indigo-600" />
                            Basic Information
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Name */}
                            <div className="space-y-2">
                                <label className="text-xs font-black text-[#49659c] uppercase tracking-widest">
                                    Trip Type Name *
                                </label>
                                <input
                                    required
                                    name="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g. City Round, Long Round"
                                    className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border ${
                                        validationErrors.name ? 'border-red-500' : 'border-gray-200 dark:border-gray-800'
                                    } rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-medium`}
                                    disabled={isSubmitting || !!tripType}
                                />
                                {validationErrors.name && (
                                    <p className="text-xs text-red-600">{validationErrors.name}</p>
                                )}
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <label className="text-xs font-black text-[#49659c] uppercase tracking-widest">
                                    Description (Optional)
                                </label>
                                <input
                                    name="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Brief description..."
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-medium"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Pricing Mode */}
                    <div className="mb-8 space-y-4">
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <DollarSign size={20} className="text-indigo-600" />
                            Pricing Mode *
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => handlePricingModeChange(PricingMode.TIME_BASED)}
                                className={`p-6 rounded-xl border-2 transition-all text-left ${
                                    formData.pricingMode === PricingMode.TIME_BASED
                                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                                }`}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <Clock size={24} className="text-indigo-600" />
                                    <span className="font-bold text-gray-900 dark:text-white">Time-Based Pricing</span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Pricing based on base hours + extra hours. No distance slabs required.
                                </p>
                            </button>

                            <button
                                type="button"
                                onClick={() => handlePricingModeChange(PricingMode.DISTANCE_BASED)}
                                className={`p-6 rounded-xl border-2 transition-all text-left ${
                                    formData.pricingMode === PricingMode.DISTANCE_BASED
                                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                                }`}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <DollarSign size={24} className="text-indigo-600" />
                                    <span className="font-bold text-gray-900 dark:text-white">Distance-Based Pricing</span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Pricing based on distance slabs. Requires defining distance ranges with prices.
                                </p>
                            </button>
                        </div>
                    </div>

                    {/* Common Fields */}
                    <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-900/50 rounded-2xl space-y-4">
                        <h4 className="text-md font-bold text-gray-900 dark:text-white">Common Configuration</h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-[#49659c] uppercase tracking-widest">
                                    Base Hour(s) *
                                </label>
                                <input
                                    required
                                    type="number"
                                    value={formData.baseHour}
                                    onChange={(e) => setFormData(prev => ({ ...prev, baseHour: parseFloat(e.target.value) || 0 }))}
                                    min="0.5"
                                    step="0.5"
                                    className={`w-full px-4 py-3 bg-white dark:bg-gray-900 border ${
                                        validationErrors.baseHour ? 'border-red-500' : 'border-gray-200 dark:border-gray-800'
                                    } rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-medium`}
                                    disabled={isSubmitting}
                                />
                                {validationErrors.baseHour && (
                                    <p className="text-xs text-red-600">{validationErrors.baseHour}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-[#49659c] uppercase tracking-widest">
                                    Extra Per Hour (₹)
                                </label>
                                <input
                                    type="number"
                                    value={formData.extraPerHour}
                                    onChange={(e) => setFormData(prev => ({ ...prev, extraPerHour: parseFloat(e.target.value) || 0 }))}
                                    min="0"
                                    step="10"
                                    className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-medium"
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-[#49659c] uppercase tracking-widest">
                                    Extra Per 30 Min (₹)
                                </label>
                                <input
                                    type="number"
                                    value={formData.extraPerHalfHour}
                                    onChange={(e) => setFormData(prev => ({ ...prev, extraPerHalfHour: parseFloat(e.target.value) || 0 }))}
                                    min="0"
                                    step="10"
                                    className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-medium"
                                    disabled={isSubmitting}
                                />
                            </div>

                            {formData.pricingMode === PricingMode.DISTANCE_BASED && (
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-[#49659c] uppercase tracking-widest">
                                        Base Distance (km) *
                                    </label>
                                    <input
                                        required
                                        type="number"
                                        value={formData.baseDistance}
                                        onChange={(e) => setFormData(prev => ({ ...prev, baseDistance: parseFloat(e.target.value) || 0 }))}
                                        min="0"
                                        step="10"
                                        className={`w-full px-4 py-3 bg-white dark:bg-gray-900 border ${
                                            validationErrors.baseDistance ? 'border-red-500' : 'border-gray-200 dark:border-gray-800'
                                        } rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-medium`}
                                        disabled={isSubmitting}
                                    />
                                    {validationErrors.baseDistance && (
                                        <p className="text-xs text-red-600">{validationErrors.baseDistance}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Car Type Pricing */}
                    <div className="mb-8 space-y-4">
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            🚗 Car Type Pricing (All 5 Required) *
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Configure pricing for each car type. {formData.pricingMode === PricingMode.DISTANCE_BASED ? 'Distance slabs define price ranges based on distance traveled.' : 'Base price is charged for the base hours.'}
                        </p>

                        <div className="space-y-3">
                            {Object.values(CarType).map((carType) => {
                                const pricing = formData.carTypePricing.find(cp => cp.carType === carType);
                                const metadata = CAR_TYPE_METADATA[carType];
                                const isExpanded = expandedCarTypes.has(carType);

                                return (
                                    <div
                                        key={carType}
                                        className="border-2 border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden transition-all"
                                    >
                                        {/* Car Type Header */}
                                        <button
                                            type="button"
                                            onClick={() => toggleCarType(carType)}
                                            className="w-full p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{metadata.icon}</span>
                                                <div className="text-left">
                                                    <span className="font-bold text-gray-900 dark:text-white">
                                                        {metadata.label}
                                                    </span>
                                                    {pricing && pricing.basePrice > 0 && (
                                                        <span className="ml-3 text-sm text-indigo-600 dark:text-indigo-400 font-semibold">
                                                            Base: {formatCurrency(pricing.basePrice)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {pricing && formData.pricingMode === PricingMode.DISTANCE_BASED && pricing.distanceSlabs && (
                                                    <span className="text-xs px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full font-semibold">
                                                        {pricing.distanceSlabs.length} slabs
                                                    </span>
                                                )}
                                                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                            </div>
                                        </button>

                                        {/* Car Type Pricing Details */}
                                        {isExpanded && pricing && (
                                            <div className="p-6 space-y-4 bg-white dark:bg-gray-900/30">
                                                {/* Duplicate from other car type */}
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const otherCarType = Object.values(CarType).find(ct => ct !== carType);
                                                            if (otherCarType) duplicatePricing(otherCarType, carType);
                                                        }}
                                                        className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg flex items-center gap-1 text-gray-700 dark:text-gray-300 font-medium transition-colors"
                                                    >
                                                        <Copy size={12} />
                                                        Copy from...
                                                    </button>
                                                    <select
                                                        onChange={(e) => {
                                                            if (e.target.value) {
                                                                duplicatePricing(e.target.value as CarType, carType);
                                                                e.target.value = '';
                                                            }
                                                        }}
                                                        className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-gray-800 border-none rounded-lg text-gray-700 dark:text-gray-300"
                                                    >
                                                        <option value="">Select car type...</option>
                                                        {Object.values(CarType)
                                                            .filter(ct => ct !== carType)
                                                            .map(ct => (
                                                                <option key={ct} value={ct}>
                                                                    {CAR_TYPE_METADATA[ct].label}
                                                                </option>
                                                            ))}
                                                    </select>
                                                </div>

                                                {/* Base Price */}
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black text-[#49659c] uppercase tracking-widest">
                                                        Base Price (₹) *
                                                    </label>
                                                    <input
                                                        required
                                                        type="number"
                                                        value={pricing.basePrice}
                                                        onChange={(e) => updateCarTypePricing(carType, 'basePrice', parseFloat(e.target.value) || 0)}
                                                        min="0"
                                                        step="50"
                                                        className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border ${
                                                            validationErrors[`${carType}_basePrice`] ? 'border-red-500' : 'border-gray-200 dark:border-gray-800'
                                                        } rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-medium`}
                                                        disabled={isSubmitting}
                                                    />
                                                    {validationErrors[`${carType}_basePrice`] && (
                                                        <p className="text-xs text-red-600">{validationErrors[`${carType}_basePrice`]}</p>
                                                    )}
                                                </div>

                                                {/* Distance Slabs (for DISTANCE_BASED mode) */}
                                                {formData.pricingMode === PricingMode.DISTANCE_BASED && pricing.distanceSlabs && (
                                                    <div className="space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <label className="text-xs font-black text-[#49659c] uppercase tracking-widest">
                                                                Distance Slabs *
                                                            </label>
                                                            <button
                                                                type="button"
                                                                onClick={() => addDistanceSlab(carType)}
                                                                className="text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-1 transition-colors"
                                                            >
                                                                <Plus size={12} />
                                                                Add Slab
                                                            </button>
                                                        </div>

                                                        <div className="space-y-2">
                                                            {pricing.distanceSlabs.map((slab, slabIndex) => (
                                                                <div
                                                                    key={slabIndex}
                                                                    className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl"
                                                                >
                                                                    <div className="flex items-center gap-3 mb-2">
                                                                        <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
                                                                            Slab {slabIndex + 1}
                                                                        </span>
                                                                        {pricing.distanceSlabs!.length > 1 && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => removeDistanceSlab(carType, slabIndex)}
                                                                                className="ml-auto text-red-600 hover:text-red-700 dark:text-red-400"
                                                                            >
                                                                                <Trash2 size={14} />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                    <div className="grid grid-cols-3 gap-3">
                                                                        <div className="space-y-1">
                                                                            <label className="text-xs text-gray-600 dark:text-gray-400">
                                                                                From (km)
                                                                            </label>
                                                                            <input
                                                                                type="number"
                                                                                value={slab.from}
                                                                                onChange={(e) => updateDistanceSlab(carType, slabIndex, 'from', parseFloat(e.target.value) || 0)}
                                                                                min="0"
                                                                                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                                                                                disabled={slabIndex > 0} // Auto-calculated for non-first slabs
                                                                            />
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <label className="text-xs text-gray-600 dark:text-gray-400">
                                                                                To (km)
                                                                            </label>
                                                                            <input
                                                                                type="number"
                                                                                value={slab.to ?? ''}
                                                                                onChange={(e) => updateDistanceSlab(carType, slabIndex, 'to', e.target.value ? parseFloat(e.target.value) : null)}
                                                                                min={slab.from + 1}
                                                                                placeholder="∞"
                                                                                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                                                                                disabled={slabIndex === pricing.distanceSlabs!.length - 1} // Last slab is open-ended
                                                                            />
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <label className="text-xs text-gray-600 dark:text-gray-400">
                                                                                Price (₹)
                                                                            </label>
                                                                            <input
                                                                                type="number"
                                                                                value={slab.price}
                                                                                onChange={(e) => updateDistanceSlab(carType, slabIndex, 'price', parseFloat(e.target.value) || 0)}
                                                                                min="0"
                                                                                step="50"
                                                                                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-semibold"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    {(validationErrors[`${carType}_slab_${slabIndex}_from`] ||
                                                                        validationErrors[`${carType}_slab_${slabIndex}_to`] ||
                                                                        validationErrors[`${carType}_slab_${slabIndex}_price`]) && (
                                                                        <p className="text-xs text-red-600 mt-2">
                                                                            {validationErrors[`${carType}_slab_${slabIndex}_from`] ||
                                                                                validationErrors[`${carType}_slab_${slabIndex}_to`] ||
                                                                                validationErrors[`${carType}_slab_${slabIndex}_price`]}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                        {validationErrors[`${carType}_slabs`] && (
                                                            <p className="text-xs text-red-600">{validationErrors[`${carType}_slabs`]}</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-800">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all font-semibold"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl transition-all font-bold flex items-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    {tripType ? 'Updating...' : 'Creating...'}
                                </>
                            ) : (
                                <>
                                    <Save size={20} />
                                    {tripType ? 'Update Trip Type' : 'Create Trip Type'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
