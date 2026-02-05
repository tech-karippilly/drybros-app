"use client";

import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle, MapPin, User, Calendar, Clock, DollarSign, CreditCard, FileText, CheckCircle, XCircle, Image } from 'lucide-react';
import { getTripById, TripResponse } from '@/lib/features/trip/tripApi';
import { cn, formatCarType } from '@/lib/utils';
import { TripMap } from './TripMap';

interface TripDetailsModalProps {
    tripId: string;
    onClose: () => void;
}

export function TripDetailsModal({ tripId, onClose }: TripDetailsModalProps) {
    const [trip, setTrip] = useState<TripResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchTripDetails();
        
        // Poll for updates every 5 minutes if trip is in progress
        const pollInterval = setInterval(() => {
            if (trip && ['TRIP_STARTED', 'TRIP_PROGRESS', 'IN_PROGRESS', 'DRIVER_ON_THE_WAY'].includes(trip.status)) {
                fetchTripDetails();
            }
        }, 5 * 60 * 1000); // 5 minutes

        return () => clearInterval(pollInterval);
    }, [tripId, trip?.status]);

    const fetchTripDetails = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const tripData = await getTripById(tripId);
            setTrip(tripData);
        } catch (err: any) {
            setError(
                err?.response?.data?.error ||
                    err?.message ||
                    'Failed to fetch trip details'
            );
        } finally {
            setIsLoading(false);
        }
    };

    const formatPrice = (price: number) => {
        return `₹${price.toFixed(2)}`;
    };

    const formatDateTime = (date: Date | string | null) => {
        if (!date) return 'Not set';
        const d = new Date(date);
        return d.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatDate = (date: Date | string | null) => {
        if (!date) return 'Not set';
        const d = new Date(date);
        return d.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const formatTime = (date: Date | string | null) => {
        if (!date) return 'Not set';
        const d = new Date(date);
        return d.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING':
            case 'REQUESTED':
            case 'NOT_ASSIGNED':
                return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-500';
            case 'ASSIGNED':
            case 'DRIVER_ACCEPTED':
                return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-500';
            case 'TRIP_STARTED':
            case 'TRIP_PROGRESS':
            case 'DRIVER_ON_THE_WAY':
            case 'IN_PROGRESS':
                return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-500';
            case 'COMPLETED':
            case 'TRIP_ENDED':
                return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-500';
            case 'CANCELLED_BY_CUSTOMER':
            case 'CANCELLED_BY_OFFICE':
            case 'REJECTED_BY_DRIVER':
                return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-500';
            default:
                return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-500';
        }
    };

    const getPaymentStatusColor = (status: string) => {
        switch (status) {
            case 'PAID':
                return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-500';
            case 'PARTIALLY_PAID':
                return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-500';
            default:
                return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-500';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
                    <div>
                        <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white">
                            Trip Details
                        </h2>
                        <p className="text-sm text-[#49659c] dark:text-gray-400">
                            Trip ID: #{tripId}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-[#49659c] hover:text-[#0d121c] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading ? (
                        <div className="py-20 text-center">
                            <Loader2 className="size-8 animate-spin text-[#0d59f2] mx-auto mb-4" />
                            <p className="text-[#49659c]">Loading trip details...</p>
                        </div>
                    ) : error ? (
                        <div className="py-20 text-center">
                            <AlertCircle className="size-8 text-red-500 mx-auto mb-4" />
                            <p className="text-red-600 dark:text-red-400">{error}</p>
                            <button
                                onClick={fetchTripDetails}
                                className="mt-4 px-4 py-2 bg-[#0d59f2] text-white rounded-lg font-bold hover:bg-[#0d59f2]/90 transition-all"
                            >
                                Retry
                            </button>
                        </div>
                    ) : trip ? (
                        <div className="space-y-6">
                            {/* Status Badge */}
                            <div className="flex items-center gap-4">
                                <span
                                    className={cn(
                                        'inline-flex items-center px-4 py-2 rounded-full text-sm font-bold',
                                        getStatusColor(trip.status)
                                    )}
                                >
                                    {trip.status}
                                </span>
                                {trip.paymentStatus && (
                                    <span
                                        className={cn(
                                            'inline-flex items-center px-4 py-2 rounded-full text-sm font-bold',
                                            getPaymentStatusColor(trip.paymentStatus)
                                        )}
                                    >
                                        Payment: {trip.paymentStatus}
                                    </span>
                                )}
                            </div>

                            {/* Customer Information */}
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                                <h3 className="text-lg font-bold text-[#0d121c] dark:text-white mb-4 flex items-center gap-2">
                                    <User size={20} />
                                    Customer Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs font-bold uppercase text-[#49659c] dark:text-gray-400 mb-1">
                                            Name
                                        </p>
                                        <p className="text-sm font-bold text-[#0d121c] dark:text-white">
                                            {trip.customerName}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase text-[#49659c] dark:text-gray-400 mb-1">
                                            Phone
                                        </p>
                                        <p className="text-sm font-bold text-[#0d121c] dark:text-white">
                                            {trip.customerPhone}
                                        </p>
                                    </div>
                                    {trip.customerEmail && (
                                        <div>
                                            <p className="text-xs font-bold uppercase text-[#49659c] dark:text-gray-400 mb-1">
                                                Email
                                            </p>
                                            <p className="text-sm font-bold text-[#0d121c] dark:text-white">
                                                {trip.customerEmail}
                                            </p>
                                        </div>
                                    )}
                                    {trip.Customer && (
                                        <div>
                                            <p className="text-xs font-bold uppercase text-[#49659c] dark:text-gray-400 mb-1">
                                                Customer ID
                                            </p>
                                            <p className="text-sm font-bold text-[#0d121c] dark:text-white">
                                                #{trip.Customer.id}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Location Information */}
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                                <h3 className="text-lg font-bold text-[#0d121c] dark:text-white mb-4 flex items-center gap-2">
                                    <MapPin size={20} />
                                    Location Information
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs font-bold uppercase text-[#49659c] dark:text-gray-400 mb-2">
                                            Pickup Location
                                        </p>
                                        <p className="text-sm font-bold text-[#0d121c] dark:text-white mb-1">
                                            {trip.pickupAddress || trip.pickupLocation}
                                        </p>
                                        {trip.pickupLocationNote && (
                                            <p className="text-xs text-[#49659c] dark:text-gray-400">
                                                Note: {trip.pickupLocationNote}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase text-[#49659c] dark:text-gray-400 mb-2">
                                            Destination
                                        </p>
                                        <p className="text-sm font-bold text-[#0d121c] dark:text-white mb-1">
                                            {trip.dropAddress || trip.dropLocation || 'Not specified'}
                                        </p>
                                        {trip.dropLocationNote && (
                                            <p className="text-xs text-[#49659c] dark:text-gray-400">
                                                Note: {trip.dropLocationNote}
                                            </p>
                                        )}
                                    </div>
                                    {trip.liveLocationLat != null && trip.liveLocationLng != null && (
                                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                            <p className="text-xs font-bold uppercase text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-2">
                                                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                                                Driver Live Location
                                            </p>
                                            <p className="text-sm font-bold text-[#0d121c] dark:text-white">
                                                Lat: {trip.liveLocationLat.toFixed(6)}, Lng: {trip.liveLocationLng.toFixed(6)}
                                            </p>
                                            <p className="text-xs text-[#49659c] dark:text-gray-400 mt-1">
                                                Updates every 5 minutes
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Map View */}
                            {(trip.pickupLat != null && trip.pickupLng != null) || (trip.liveLocationLat != null && trip.liveLocationLng != null) ? (
                                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                                    <h3 className="text-lg font-bold text-[#0d121c] dark:text-white mb-4 flex items-center gap-2">
                                        <MapPin size={20} />
                                        Map View
                                        {trip.liveLocationLat != null && trip.liveLocationLng != null && (
                                            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full flex items-center gap-1">
                                                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                                                LIVE
                                            </span>
                                        )}
                                    </h3>
                                    <div className="rounded-lg overflow-hidden" style={{ height: '400px' }}>
                                        <TripMap
                                            pickupLat={trip.pickupLat}
                                            pickupLng={trip.pickupLng}
                                            dropLat={trip.dropLat}
                                            dropLng={trip.dropLng}
                                            pickupLocation={trip.pickupAddress || trip.pickupLocation}
                                            dropLocation={trip.dropAddress || trip.dropLocation}
                                            liveLocationLat={trip.liveLocationLat}
                                            liveLocationLng={trip.liveLocationLng}
                                        />
                                    </div>
                                </div>
                            ) : null}

                            {/* Trip Images Section */}
                            {(trip.odometerStartImageUrl || trip.odometerEndImageUrl || trip.driverSelfieUrl || trip.carImageFront || trip.carImageBack) && (
                                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                                    <h3 className="text-lg font-bold text-[#0d121c] dark:text-white mb-4 flex items-center gap-2">
                                        <Image size={20} />
                                        Trip Images
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {trip.odometerStartImageUrl && (
                                            <div className="space-y-2">
                                                <p className="text-xs font-bold uppercase text-[#49659c] dark:text-gray-400">
                                                    Odometer Start
                                                </p>
                                                <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
                                                    <img
                                                        src={trip.odometerStartImageUrl}
                                                        alt="Odometer Start"
                                                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                                                        onClick={() => window.open(trip.odometerStartImageUrl!, '_blank')}
                                                    />
                                                </div>
                                                {trip.startOdometer && (
                                                    <p className="text-xs text-[#49659c] dark:text-gray-400">
                                                        Reading: {trip.startOdometer} km
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                        {trip.odometerEndImageUrl && (
                                            <div className="space-y-2">
                                                <p className="text-xs font-bold uppercase text-[#49659c] dark:text-gray-400">
                                                    Odometer End
                                                </p>
                                                <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
                                                    <img
                                                        src={trip.odometerEndImageUrl}
                                                        alt="Odometer End"
                                                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                                                        onClick={() => window.open(trip.odometerEndImageUrl!, '_blank')}
                                                    />
                                                </div>
                                                {trip.endOdometer && (
                                                    <p className="text-xs text-[#49659c] dark:text-gray-400">
                                                        Reading: {trip.endOdometer} km
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                        {trip.driverSelfieUrl && (
                                            <div className="space-y-2">
                                                <p className="text-xs font-bold uppercase text-[#49659c] dark:text-gray-400">
                                                    Driver Selfie
                                                </p>
                                                <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
                                                    <img
                                                        src={trip.driverSelfieUrl}
                                                        alt="Driver Selfie"
                                                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                                                        onClick={() => window.open(trip.driverSelfieUrl!, '_blank')}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        {trip.carImageFront && (
                                            <div className="space-y-2">
                                                <p className="text-xs font-bold uppercase text-[#49659c] dark:text-gray-400">
                                                    Car Front
                                                </p>
                                                <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
                                                    <img
                                                        src={trip.carImageFront}
                                                        alt="Car Front"
                                                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                                                        onClick={() => window.open(trip.carImageFront!, '_blank')}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        {trip.carImageBack && (
                                            <div className="space-y-2">
                                                <p className="text-xs font-bold uppercase text-[#49659c] dark:text-gray-400">
                                                    Car Back
                                                </p>
                                                <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
                                                    <img
                                                        src={trip.carImageBack}
                                                        alt="Car Back"
                                                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                                                        onClick={() => window.open(trip.carImageBack!, '_blank')}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                                    </div>
                                </div>
                            </div>

                            {/* Trip Details */}
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                                <h3 className="text-lg font-bold text-[#0d121c] dark:text-white mb-4 flex items-center gap-2">
                                    <FileText size={20} />
                                    Trip Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs font-bold uppercase text-[#49659c] dark:text-gray-400 mb-1">
                                            Trip Type
                                        </p>
                                        <p className="text-sm font-bold text-[#0d121c] dark:text-white">
                                            {trip.tripType}
                                        </p>
                                    </div>
                                    {trip.carType && (
                                        <div>
                                            <p className="text-xs font-bold uppercase text-[#49659c] dark:text-gray-400 mb-1">
                                                Car Type
                                            </p>
                                            <p className="text-sm font-bold text-[#0d121c] dark:text-white">
                                                {formatCarType(trip.carType)}
                                            </p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-xs font-bold uppercase text-[#49659c] dark:text-gray-400 mb-1">
                                            Scheduled Date
                                        </p>
                                        <p className="text-sm font-bold text-[#0d121c] dark:text-white">
                                            {formatDate(trip.scheduledAt)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase text-[#49659c] dark:text-gray-400 mb-1">
                                            Scheduled Time
                                        </p>
                                        <p className="text-sm font-bold text-[#0d121c] dark:text-white">
                                            {formatTime(trip.scheduledAt)}
                                        </p>
                                    </div>
                                    {trip.startedAt && (
                                        <div>
                                            <p className="text-xs font-bold uppercase text-[#49659c] dark:text-gray-400 mb-1">
                                                Started At
                                            </p>
                                            <p className="text-sm font-bold text-[#0d121c] dark:text-white">
                                                {formatDateTime(trip.startedAt)}
                                            </p>
                                        </div>
                                    )}
                                    {trip.endedAt && (
                                        <div>
                                            <p className="text-xs font-bold uppercase text-[#49659c] dark:text-gray-400 mb-1">
                                                Ended At
                                            </p>
                                            <p className="text-sm font-bold text-[#0d121c] dark:text-white">
                                                {formatDateTime(trip.endedAt)}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Confirmation Flags */}
                            {(trip.isDetailsReconfirmed !== undefined ||
                                trip.isFareDiscussed !== undefined ||
                                trip.isPriceAccepted !== undefined) && (
                                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                                    <h3 className="text-lg font-bold text-[#0d121c] dark:text-white mb-4 flex items-center gap-2">
                                        <CheckCircle size={20} />
                                        Confirmation Status
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {trip.isDetailsReconfirmed !== undefined && (
                                            <div className="flex items-center gap-2">
                                                {trip.isDetailsReconfirmed ? (
                                                    <CheckCircle className="text-green-500" size={20} />
                                                ) : (
                                                    <XCircle className="text-red-500" size={20} />
                                                )}
                                                <span className="text-sm font-bold text-[#0d121c] dark:text-white">
                                                    Details Reconfirmed
                                                </span>
                                            </div>
                                        )}
                                        {trip.isFareDiscussed !== undefined && (
                                            <div className="flex items-center gap-2">
                                                {trip.isFareDiscussed ? (
                                                    <CheckCircle className="text-green-500" size={20} />
                                                ) : (
                                                    <XCircle className="text-red-500" size={20} />
                                                )}
                                                <span className="text-sm font-bold text-[#0d121c] dark:text-white">
                                                    Fare Discussed
                                                </span>
                                            </div>
                                        )}
                                        {trip.isPriceAccepted !== undefined && (
                                            <div className="flex items-center gap-2">
                                                {trip.isPriceAccepted ? (
                                                    <CheckCircle className="text-green-500" size={20} />
                                                ) : (
                                                    <XCircle className="text-red-500" size={20} />
                                                )}
                                                <span className="text-sm font-bold text-[#0d121c] dark:text-white">
                                                    Price Accepted
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Pricing Information */}
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                                <h3 className="text-lg font-bold text-[#0d121c] dark:text-white mb-4 flex items-center gap-2">
                                    <DollarSign size={20} />
                                    Pricing Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs font-bold uppercase text-[#49659c] dark:text-gray-400 mb-1">
                                            Base Amount
                                        </p>
                                        <p className="text-lg font-bold text-[#0d121c] dark:text-white">
                                            {formatPrice(trip.baseAmount)}
                                        </p>
                                    </div>
                                    {trip.extraAmount > 0 && (
                                        <div>
                                            <p className="text-xs font-bold uppercase text-[#49659c] dark:text-gray-400 mb-1">
                                                Extra Amount
                                            </p>
                                            <p className="text-lg font-bold text-[#0d121c] dark:text-white">
                                                {formatPrice(trip.extraAmount)}
                                            </p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-xs font-bold uppercase text-[#49659c] dark:text-gray-400 mb-1">
                                            Total Amount
                                        </p>
                                        <p className="text-lg font-bold text-[#0d121c] dark:text-white">
                                            {formatPrice(trip.totalAmount)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase text-[#49659c] dark:text-gray-400 mb-1">
                                            Final Amount
                                        </p>
                                        <p className="text-lg font-bold text-[#0d121c] dark:text-white">
                                            {formatPrice(trip.finalAmount)}
                                        </p>
                                    </div>
                                    {trip.isAmountOverridden && (
                                        <div className="md:col-span-2">
                                            <p className="text-xs font-bold uppercase text-[#49659c] dark:text-gray-400 mb-1">
                                                Override Reason
                                            </p>
                                            <p className="text-sm text-[#0d121c] dark:text-white">
                                                {trip.overrideReason || 'Not specified'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Payment Information */}
                            {trip.paymentMode && (
                                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                                    <h3 className="text-lg font-bold text-[#0d121c] dark:text-white mb-4 flex items-center gap-2">
                                        <CreditCard size={20} />
                                        Payment Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs font-bold uppercase text-[#49659c] dark:text-gray-400 mb-1">
                                                Payment Mode
                                            </p>
                                            <p className="text-sm font-bold text-[#0d121c] dark:text-white">
                                                {trip.paymentMode}
                                            </p>
                                        </div>
                                        {trip.paymentReference && (
                                            <div>
                                                <p className="text-xs font-bold uppercase text-[#49659c] dark:text-gray-400 mb-1">
                                                    Payment Reference
                                                </p>
                                                <p className="text-sm font-bold text-[#0d121c] dark:text-white">
                                                    {trip.paymentReference}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Driver Information */}
                            {trip.Driver && (
                                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                                    <h3 className="text-lg font-bold text-[#0d121c] dark:text-white mb-4 flex items-center gap-2">
                                        <User size={20} />
                                        Driver Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs font-bold uppercase text-[#49659c] dark:text-gray-400 mb-1">
                                                Name
                                            </p>
                                            <p className="text-sm font-bold text-[#0d121c] dark:text-white">
                                                {trip.Driver.firstName} {trip.Driver.lastName}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold uppercase text-[#49659c] dark:text-gray-400 mb-1">
                                                Driver Code
                                            </p>
                                            <p className="text-sm font-bold text-[#0d121c] dark:text-white">
                                                {trip.Driver.driverCode}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold uppercase text-[#49659c] dark:text-gray-400 mb-1">
                                                Phone
                                            </p>
                                            <p className="text-sm font-bold text-[#0d121c] dark:text-white">
                                                {trip.Driver.phone}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Franchise Information */}
                            {trip.Franchise && (
                                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                                    <h3 className="text-lg font-bold text-[#0d121c] dark:text-white mb-4 flex items-center gap-2">
                                        <FileText size={20} />
                                        Franchise Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs font-bold uppercase text-[#49659c] dark:text-gray-400 mb-1">
                                                Code
                                            </p>
                                            <p className="text-sm font-bold text-[#0d121c] dark:text-white">
                                                {trip.Franchise.code}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold uppercase text-[#49659c] dark:text-gray-400 mb-1">
                                                Name
                                            </p>
                                            <p className="text-sm font-bold text-[#0d121c] dark:text-white">
                                                {trip.Franchise.name}
                                            </p>
                                        </div>
                                        {trip.Franchise.location && (
                                            <div>
                                                <p className="text-xs font-bold uppercase text-[#49659c] dark:text-gray-400 mb-1">
                                                    Location
                                                </p>
                                                <p className="text-sm font-bold text-[#0d121c] dark:text-white">
                                                    {trip.Franchise.location}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Timestamps */}
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                                <h3 className="text-lg font-bold text-[#0d121c] dark:text-white mb-4 flex items-center gap-2">
                                    <Clock size={20} />
                                    Timestamps
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs font-bold uppercase text-[#49659c] dark:text-gray-400 mb-1">
                                            Created At
                                        </p>
                                        <p className="text-sm font-bold text-[#0d121c] dark:text-white">
                                            {formatDateTime(trip.createdAt)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase text-[#49659c] dark:text-gray-400 mb-1">
                                            Last Updated
                                        </p>
                                        <p className="text-sm font-bold text-[#0d121c] dark:text-white">
                                            {formatDateTime(trip.updatedAt)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-[#0d59f2] text-white rounded-lg font-bold hover:bg-[#0d59f2]/90 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
