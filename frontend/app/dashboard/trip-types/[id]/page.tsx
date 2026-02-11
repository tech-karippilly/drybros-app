"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader2, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { getTripTypeById, deleteTripType as deleteTripTypeApi, TripTypeResponse } from '@/lib/features/tripType/tripTypeApi';

export default function TripTypeDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const tripTypeId = params.id as string;
    const [tripType, setTripType] = useState<TripTypeResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchTripTypeDetails();
    }, [tripTypeId]);

    const fetchTripTypeDetails = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await getTripTypeById(tripTypeId);
            setTripType(data);
        } catch (err: any) {
            setError(err?.response?.data?.error || err?.message || 'Failed to fetch trip type details');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this trip type?')) return;
        
        try {
            await deleteTripTypeApi(tripTypeId);
            router.push('/dashboard/trip-types');
        } catch (err: any) {
            alert(err?.response?.data?.error || err?.message || 'Failed to delete trip type');
        }
    };

    const handleEdit = () => {
        router.push(`/dashboard/trip-types/${tripTypeId}/edit`);
    };

    const formatPrice = (price: number | null | undefined) => {
        if (price === null || price === undefined) return '-';
        return `₹${price.toFixed(2)}`;
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="size-10 animate-spin text-[#0d59f2]" />
                <p className="text-[#49659c]">Loading trip type details...</p>
            </div>
        );
    }

    if (error || !tripType) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <AlertCircle className="size-12 text-red-500" />
                <h3 className="text-xl font-bold text-[#0d121c] dark:text-white">Error</h3>
                <p className="text-[#49659c]">{error || 'Trip type not found'}</p>
                <button
                    onClick={() => router.push('/dashboard/trip-types')}
                    className="px-4 py-2 bg-[#0d59f2] text-white rounded-lg font-bold hover:bg-[#0d59f2]/90 transition-all"
                >
                    Back to Trip Types
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/dashboard/trip-types')}
                        className="p-2 text-[#49659c] hover:text-[#0d59f2] hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white">
                            {tripType.name}
                        </h2>
                        <p className="text-[#49659c] dark:text-gray-400">
                            Trip type details and pricing information
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleEdit}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-all"
                    >
                        <Edit2 size={18} />
                        <span>Edit</span>
                    </button>
                    <button
                        onClick={handleDelete}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-all"
                    >
                        <Trash2 size={18} />
                        <span>Delete</span>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="space-y-6">
                {/* Basic Information */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 space-y-4">
                    <h3 className="text-lg font-bold text-[#0d121c] dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">
                        Basic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold uppercase text-[#49659c] dark:text-gray-400">Name</label>
                            <p className="text-sm font-semibold text-[#0d121c] dark:text-white mt-1">{tripType.name}</p>
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-[#49659c] dark:text-gray-400">Car Category</label>
                            <p className="text-sm font-semibold text-[#0d121c] dark:text-white mt-1">{tripType.carCategory}</p>
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-xs font-bold uppercase text-[#49659c] dark:text-gray-400">Description</label>
                            <p className="text-sm text-[#0d121c] dark:text-white mt-1">{tripType.description || 'No description'}</p>
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-[#49659c] dark:text-gray-400">Pricing Type</label>
                            <div className="mt-1">
                                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-xs font-bold">
                                    {tripType.type}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pricing Details */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 space-y-4">
                    <h3 className="text-lg font-bold text-[#0d121c] dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">
                        Pricing Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {tripType.baseAmount !== null && (
                            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                                <label className="text-xs font-bold uppercase text-blue-600 dark:text-blue-400">Base Amount</label>
                                <p className="text-2xl font-bold text-blue-700 dark:text-blue-400 mt-1">{formatPrice(tripType.baseAmount)}</p>
                            </div>
                        )}
                        {tripType.baseHour !== null && (
                            <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-xl border border-purple-200 dark:border-purple-800">
                                <label className="text-xs font-bold uppercase text-purple-600 dark:text-purple-400">Base Hours</label>
                                <p className="text-2xl font-bold text-purple-700 dark:text-purple-400 mt-1">{tripType.baseHour}h</p>
                            </div>
                        )}
                        {tripType.baseDistance !== null && (
                            <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-xl border border-green-200 dark:border-green-800">
                                <label className="text-xs font-bold uppercase text-green-600 dark:text-green-400">Base Distance</label>
                                <p className="text-2xl font-bold text-green-700 dark:text-green-400 mt-1">{tripType.baseDistance} km</p>
                            </div>
                        )}
                        {tripType.extraPerHour !== null && (
                            <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-200 dark:border-amber-800">
                                <label className="text-xs font-bold uppercase text-amber-600 dark:text-amber-400">Extra Per Hour</label>
                                <p className="text-2xl font-bold text-amber-700 dark:text-amber-400 mt-1">{formatPrice(tripType.extraPerHour)}</p>
                            </div>
                        )}
                        {tripType.extraPerHalfHour !== null && (
                            <div className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-xl border border-orange-200 dark:border-orange-800">
                                <label className="text-xs font-bold uppercase text-orange-600 dark:text-orange-400">Extra Per 30 Min</label>
                                <p className="text-2xl font-bold text-orange-700 dark:text-orange-400 mt-1">{formatPrice(tripType.extraPerHalfHour)}</p>
                            </div>
                        )}
                        {tripType.extraPerDistance !== null && (
                            <div className="bg-teal-50 dark:bg-teal-900/10 p-4 rounded-xl border border-teal-200 dark:border-teal-800">
                                <label className="text-xs font-bold uppercase text-teal-600 dark:text-teal-400">Extra Per KM</label>
                                <p className="text-2xl font-bold text-teal-700 dark:text-teal-400 mt-1">{formatPrice(tripType.extraPerDistance)}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Distance Slabs */}
                {tripType.distanceSlab && Array.isArray(tripType.distanceSlab) && tripType.distanceSlab.length > 0 && (
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 space-y-4">
                        <h3 className="text-lg font-bold text-[#0d121c] dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">
                            Distance Slabs
                        </h3>
                        <div className="space-y-2">
                            {tripType.distanceSlab.map((slab: any, index: number) => (
                                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <span className="text-sm text-[#0d121c] dark:text-white">
                                        <span className="font-bold">{slab.from} km</span> to <span className="font-bold">{slab.to ? `${slab.to} km` : 'unlimited'}</span>
                                    </span>
                                    <span className="text-lg font-bold text-[#0d59f2]">{formatPrice(slab.price)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Time Slabs */}
                {tripType.timeSlab && Array.isArray(tripType.timeSlab) && tripType.timeSlab.length > 0 && (
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 space-y-4">
                        <h3 className="text-lg font-bold text-[#0d121c] dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">
                            Time Slabs
                        </h3>
                        <div className="space-y-2">
                            {tripType.timeSlab.map((slab: any, index: number) => (
                                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <span className="text-sm text-[#0d121c] dark:text-white">
                                        <span className="font-bold">{slab.from}</span> to <span className="font-bold">{slab.to}</span>
                                    </span>
                                    <span className="text-lg font-bold text-[#0d59f2]">{formatPrice(slab.price)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Timestamps */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
                    <h3 className="text-lg font-bold text-[#0d121c] dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2 mb-4">
                        Record Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <label className="font-bold uppercase text-[#49659c] dark:text-gray-400 text-xs">Created At</label>
                            <p className="text-[#0d121c] dark:text-white mt-1">
                                {new Date(tripType.createdAt).toLocaleString('en-IN')}
                            </p>
                        </div>
                        <div>
                            <label className="font-bold uppercase text-[#49659c] dark:text-gray-400 text-xs">Updated At</label>
                            <p className="text-[#0d121c] dark:text-white mt-1">
                                {new Date(tripType.updatedAt).toLocaleString('en-IN')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
