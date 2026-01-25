"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, AlertCircle, MapPin, User, Calendar, Clock, DollarSign, CreditCard, FileText, CheckCircle, XCircle, UserPlus, Phone, CalendarClock, Ban, UserMinus } from 'lucide-react';
import {
    getTripById,
    getAvailableDriversForTrip,
    assignDriverToTrip,
    rescheduleTrip as rescheduleTripApi,
    cancelTrip as cancelTripApi,
    reassignDriverToTrip as reassignDriverToTripApi,
    TripResponse,
} from '@/lib/features/trip/tripApi';
import { PerformanceBadge } from '@/components/ui/PerformanceBadge';
import { AvailableDriver } from '@/lib/types/driver';
import { RESCHEDULABLE_TRIP_STATUSES, CANCELLABLE_TRIP_STATUSES, REASSIGNABLE_TRIP_STATUSES } from '@/lib/constants/trips';
import { cn, formatCarType } from '@/lib/utils';
import { TripLog } from './TripLog';

interface TripDetailsScreenProps {
    tripId: string;
    onBack: () => void;
}

export function TripDetailsScreen({ tripId, onBack }: TripDetailsScreenProps) {
    const [trip, setTrip] = useState<TripResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAssignDriver, setShowAssignDriver] = useState(false);
    const [showReassignDriver, setShowReassignDriver] = useState(false);
    const [availableDrivers, setAvailableDrivers] = useState<AvailableDriver[]>([]);
    const [loadingDrivers, setLoadingDrivers] = useState(false);
    const [assigningDriver, setAssigningDriver] = useState<string | null>(null);
    const [reassigningDriver, setReassigningDriver] = useState<string | null>(null);
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [rescheduleDate, setRescheduleDate] = useState('');
    const [rescheduleTime, setRescheduleTime] = useState('');
    const [cancelBy, setCancelBy] = useState<'OFFICE' | 'CUSTOMER'>('OFFICE');
    const [cancelReason, setCancelReason] = useState('');

    useEffect(() => {
        fetchTripDetails();
    }, [tripId]);

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

    const handleShowAssignDriver = async () => {
        if (showAssignDriver) {
            setShowAssignDriver(false);
            return;
        }

        try {
            setLoadingDrivers(true);
            setError(null);
            const drivers = await getAvailableDriversForTrip(tripId);
            
            // Filter for GREEN performance only and map to AvailableDriver format
            const greenDrivers: AvailableDriver[] = drivers
                .filter((driver: any) => driver.performance?.category === 'GREEN')
                .map((driver: any) => ({
                    id: driver.id,
                    firstName: driver.firstName,
                    lastName: driver.lastName,
                    phone: driver.phone,
                    driverCode: driver.driverCode,
                    status: driver.status,
                    currentRating: driver.currentRating,
                    performance: driver.performance,
                    matchScore: driver.matchScore || 0,
                }));
            
            setAvailableDrivers(greenDrivers);
            setShowAssignDriver(true);
        } catch (err: any) {
            setError(
                err?.response?.data?.error ||
                    err?.message ||
                    'Failed to fetch available drivers'
            );
        } finally {
            setLoadingDrivers(false);
        }
    };

    const handleAssignDriver = async (driverId: string) => {
        try {
            setAssigningDriver(driverId);
            await assignDriverToTrip(tripId, driverId);
            await fetchTripDetails();
            setShowAssignDriver(false);
            setAvailableDrivers([]);
        } catch (err: any) {
            const errorMsg = err?.response?.data?.error || err?.message || 'Failed to assign driver';
            alert(errorMsg);
        } finally {
            setAssigningDriver(null);
        }
    };

    const handleShowReassignDriver = async () => {
        if (showReassignDriver) {
            setShowReassignDriver(false);
            return;
        }
        try {
            setLoadingDrivers(true);
            setError(null);
            const drivers = await getAvailableDriversForTrip(tripId);
            const greenDrivers: AvailableDriver[] = drivers
                .filter((d: any) => d.performance?.category === 'GREEN')
                .map((d: any) => ({
                    id: d.id,
                    firstName: d.firstName,
                    lastName: d.lastName,
                    phone: d.phone,
                    driverCode: d.driverCode,
                    status: d.status,
                    currentRating: d.currentRating,
                    performance: d.performance,
                    matchScore: d.matchScore || 0,
                }));
            setAvailableDrivers(greenDrivers);
            setShowReassignDriver(true);
        } catch (err: any) {
            setError(err?.response?.data?.error || err?.message || 'Failed to fetch available drivers');
        } finally {
            setLoadingDrivers(false);
        }
    };

    const handleReassignDriver = async (driverId: string) => {
        try {
            setReassigningDriver(driverId);
            await reassignDriverToTripApi(tripId, {
                driverId,
                franchiseId: trip?.franchiseId,
            });
            await fetchTripDetails();
            setShowReassignDriver(false);
            setAvailableDrivers([]);
        } catch (err: any) {
            alert(err?.response?.data?.error || err?.message || 'Failed to reassign driver');
        } finally {
            setReassigningDriver(null);
        }
    };

    const handleRescheduleSubmit = async () => {
        if (!rescheduleDate || !rescheduleTime) {
            alert('Please set date and time.');
            return;
        }
        try {
            await rescheduleTripApi(tripId, {
                tripDate: rescheduleDate,
                tripTime: rescheduleTime,
            });
            await fetchTripDetails();
            setShowRescheduleModal(false);
            setRescheduleDate('');
            setRescheduleTime('');
        } catch (err: any) {
            alert(err?.response?.data?.error || err?.message || 'Failed to reschedule trip');
        }
    };

    const handleCancelSubmit = async () => {
        try {
            await cancelTripApi(tripId, {
                cancelledBy: cancelBy,
                reason: cancelReason.trim() || undefined,
            });
            await fetchTripDetails();
            setShowCancelModal(false);
            setCancelReason('');
        } catch (err: any) {
            alert(err?.response?.data?.error || err?.message || 'Failed to cancel trip');
        }
    };

    const canReschedule = trip && (RESCHEDULABLE_TRIP_STATUSES as readonly string[]).includes(trip.status);
    const canCancel = trip && (CANCELLABLE_TRIP_STATUSES as readonly string[]).includes(trip.status);
    const canReassign = trip && trip.driverId && (REASSIGNABLE_TRIP_STATUSES as readonly string[]).includes(trip.status);

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
        <div className="flex flex-col h-full animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 text-[#49659c] hover:text-[#0d121c] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white">
                            Trip Details
                        </h2>
                        <p className="text-sm text-[#49659c] dark:text-gray-400">
                            Trip ID: #{tripId}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {trip && !trip.driverId && (
                        <button
                            onClick={handleShowAssignDriver}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-500/20 active:scale-95"
                        >
                            <UserPlus size={18} />
                            <span>{showAssignDriver ? 'Hide' : 'Assign'} Driver</span>
                        </button>
                    )}
                    {canReassign && (
                        <button
                            onClick={handleShowReassignDriver}
                            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700 transition-all active:scale-95"
                        >
                            <UserMinus size={18} />
                            <span>{showReassignDriver ? 'Hide' : 'Reassign'} Driver</span>
                        </button>
                    )}
                    {canReschedule && (
                        <button
                            onClick={() => {
                                if (trip?.scheduledAt) {
                                    const d = new Date(trip.scheduledAt);
                                    setRescheduleDate(d.toISOString().slice(0, 10));
                                    setRescheduleTime(d.toTimeString().slice(0, 5));
                                } else {
                                    const n = new Date();
                                    setRescheduleDate(n.toISOString().slice(0, 10));
                                    setRescheduleTime('12:00');
                                }
                                setShowRescheduleModal(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all active:scale-95"
                        >
                            <CalendarClock size={18} />
                            Reschedule
                        </button>
                    )}
                    {canCancel && (
                        <button
                            onClick={() => setShowCancelModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-all active:scale-95"
                        >
                            <Ban size={18} />
                            Cancel Trip
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900/50">
                {isLoading ? (
                    <div className="py-20 text-center">
                        <Loader2 className="size-8 animate-spin text-[#0d59f2] mx-auto mb-4" />
                        <p className="text-[#49659c]">Loading trip details...</p>
                    </div>
                ) : error ? (
                    <div className="py-20 text-center">
                        <AlertCircle className="size-8 text-red-500 mx-auto mb-4" />
                        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                        <button
                            onClick={fetchTripDetails}
                            className="px-4 py-2 bg-[#0d59f2] text-white rounded-lg font-bold hover:bg-[#0d59f2]/90 transition-all"
                        >
                            Retry
                        </button>
                    </div>
                ) : trip ? (
                    <div className="max-w-6xl mx-auto space-y-6">
                        {/* Assign Driver Section */}
                        {showAssignDriver && (
                            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
                                <h3 className="text-lg font-bold text-[#0d121c] dark:text-white mb-4 flex items-center gap-2">
                                    <UserPlus size={20} />
                                    Available Drivers (GREEN Performance Only)
                                </h3>
                                {loadingDrivers ? (
                                    <div className="text-center py-8">
                                        <Loader2 className="size-6 animate-spin text-[#0d59f2] mx-auto mb-2" />
                                        <p className="text-sm text-[#49659c]">Loading available drivers...</p>
                                    </div>
                                ) : availableDrivers.length === 0 ? (
                                    <div className="text-center py-8">
                                        <AlertCircle className="size-8 text-[#49659c] opacity-50 mx-auto mb-2" />
                                        <p className="text-sm text-[#49659c]">No GREEN performance drivers available for this trip</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {availableDrivers.map((driver) => (
                                            <div
                                                key={driver.id}
                                                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                            >
                                                <div className="flex items-center gap-4 flex-1">
                                                    <PerformanceBadge
                                                        category={driver.performance.category}
                                                        score={driver.performance.score}
                                                        showScore={true}
                                                        size="sm"
                                                    />
                                                    <div className="flex-1">
                                                        <p className="font-medium text-sm text-[#0d121c] dark:text-white">
                                                            {driver.firstName} {driver.lastName}
                                                        </p>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <p className="text-xs text-[#49659c] dark:text-gray-400">
                                                                Code: {driver.driverCode}
                                                            </p>
                                                            <div className="flex items-center gap-1 text-xs text-[#49659c] dark:text-gray-400">
                                                                <Phone size={12} />
                                                                {driver.phone}
                                                            </div>
                                                            <p className="text-xs text-[#49659c] dark:text-gray-400">
                                                                Rating: {driver.currentRating?.toFixed(1) || "N/A"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleAssignDriver(driver.id)}
                                                    disabled={assigningDriver === driver.id}
                                                    className="px-4 py-2 bg-[#0d59f2] text-white rounded-lg text-sm font-medium hover:bg-[#0d59f2]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                                                >
                                                    {assigningDriver === driver.id ? (
                                                        <>
                                                            <Loader2 className="size-4 animate-spin" />
                                                            Assigning...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CheckCircle size={16} />
                                                            Assign
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Reassign Driver Section */}
                        {showReassignDriver && (
                            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
                                <h3 className="text-lg font-bold text-[#0d121c] dark:text-white mb-4 flex items-center gap-2">
                                    <UserMinus size={20} />
                                    Reassign Driver (GREEN Performance Only)
                                </h3>
                                {loadingDrivers ? (
                                    <div className="text-center py-8">
                                        <Loader2 className="size-6 animate-spin text-[#0d59f2] mx-auto mb-2" />
                                        <p className="text-sm text-[#49659c]">Loading available drivers...</p>
                                    </div>
                                ) : availableDrivers.filter((d) => d.id !== trip?.driverId).length === 0 ? (
                                    <div className="text-center py-8">
                                        <AlertCircle className="size-8 text-[#49659c] opacity-50 mx-auto mb-2" />
                                        <p className="text-sm text-[#49659c]">No other GREEN drivers available to reassign</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {availableDrivers
                                            .filter((d) => d.id !== trip?.driverId)
                                            .map((driver) => (
                                                <div
                                                    key={driver.id}
                                                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                                >
                                                    <div className="flex items-center gap-4 flex-1">
                                                        <PerformanceBadge
                                                            category={driver.performance.category}
                                                            score={driver.performance.score}
                                                            showScore={true}
                                                            size="sm"
                                                        />
                                                        <div className="flex-1">
                                                            <p className="font-medium text-sm text-[#0d121c] dark:text-white">
                                                                {driver.firstName} {driver.lastName}
                                                            </p>
                                                            <div className="flex items-center gap-3 mt-1">
                                                                <p className="text-xs text-[#49659c] dark:text-gray-400">
                                                                    Code: {driver.driverCode}
                                                                </p>
                                                                <div className="flex items-center gap-1 text-xs text-[#49659c] dark:text-gray-400">
                                                                    <Phone size={12} />
                                                                    {driver.phone}
                                                                </div>
                                                                <p className="text-xs text-[#49659c] dark:text-gray-400">
                                                                    Rating: {driver.currentRating?.toFixed(1) || "N/A"}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleReassignDriver(driver.id)}
                                                        disabled={reassigningDriver === driver.id}
                                                        className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                                                    >
                                                        {reassigningDriver === driver.id ? (
                                                            <>
                                                                <Loader2 className="size-4 animate-spin" />
                                                                Reassigning...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <CheckCircle size={16} />
                                                                Reassign
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </div>
                        )}

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
                        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
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
                        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
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
                            </div>
                        </div>

                        {/* Trip Details */}
                        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
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
                            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
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
                        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
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
                            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
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
                            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
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
                            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
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
                        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
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

                        {/* Trip Activity Log */}
                        <TripLog tripId={tripId} />
                    </div>
                ) : null}
            </div>

            {/* Reschedule Modal */}
            {showRescheduleModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold text-[#0d121c] dark:text-white mb-4">Reschedule Trip</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[#49659c] dark:text-gray-400 mb-1">Date</label>
                                <input
                                    type="date"
                                    value={rescheduleDate}
                                    onChange={(e) => setRescheduleDate(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#49659c] dark:text-gray-400 mb-1">Time</label>
                                <input
                                    type="time"
                                    value={rescheduleTime}
                                    onChange={(e) => setRescheduleTime(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowRescheduleModal(false)}
                                className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 font-medium text-[#0d121c] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRescheduleSubmit}
                                className="flex-1 px-4 py-2 rounded-lg bg-[#0d59f2] text-white font-bold hover:bg-[#0d59f2]/90"
                            >
                                Reschedule
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Trip Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold text-[#0d121c] dark:text-white mb-4">Cancel Trip</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[#49659c] dark:text-gray-400 mb-1">Cancelled by</label>
                                <select
                                    value={cancelBy}
                                    onChange={(e) => setCancelBy(e.target.value as 'OFFICE' | 'CUSTOMER')}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white"
                                >
                                    <option value="OFFICE">Office</option>
                                    <option value="CUSTOMER">Customer</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#49659c] dark:text-gray-400 mb-1">Reason (optional)</label>
                                <textarea
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    rows={3}
                                    placeholder="Optional reason..."
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white resize-none"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowCancelModal(false)}
                                className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 font-medium text-[#0d121c] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleCancelSubmit}
                                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700"
                            >
                                Cancel Trip
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
