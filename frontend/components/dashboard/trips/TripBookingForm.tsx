"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { createTripPhase1 } from '@/lib/features/trip/tripApi';
import { fetchTripTypesPaginated } from '@/lib/features/tripType/tripTypeSlice';
import { fetchFranchises } from '@/lib/features/franchise/franchiseSlice';
import { PlacesAutocomplete, PlaceDetails } from '@/components/ui/PlacesAutocomplete';
import { X, Save, Loader2, User, Phone, Mail, MapPin, Calendar, Clock, Car, CheckCircle2, Store } from 'lucide-react';

const CAR_GEAR_TYPES = {
    MANUAL: "MANUAL",
    AUTOMATIC: "AUTOMATIC",
} as const;

const CAR_TYPE_CATEGORIES = {
    PREMIUM: "PREMIUM",
    LUXURY: "LUXURY",
    NORMAL: "NORMAL",
} as const;

interface TripBookingFormData {
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    pickupLocation: string; // Google Place ID
    pickupLocationSearch: string; // What user types/searches
    pickupAddress: string; // Formatted address
    pickupLocationNote: string;
    destinationLocation: string; // Google Place ID
    destinationLocationSearch: string; // What user types/searches
    destinationAddress: string; // Formatted address
    destinationNote: string;
    franchiseId: string;
    tripType: string;
    carGearType: string;
    carType: string;
    tripDate: string;
    tripTime: string;
    isDetailsReconfirmed: boolean;
    isFareDiscussed: boolean;
    isPriceAccepted: boolean;
}

export function TripBookingForm() {
    const dispatch = useAppDispatch();
    const { selectedFranchise, list: franchises } = useAppSelector((state) => state.franchise);
    const { list: tripTypes } = useAppSelector((state) => state.tripType);
    const { user } = useAppSelector((state) => state.auth);
    
    const [formData, setFormData] = useState<TripBookingFormData>({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        pickupLocation: '',
        pickupLocationSearch: '',
        pickupAddress: '',
        pickupLocationNote: '',
        destinationLocation: '',
        destinationLocationSearch: '',
        destinationAddress: '',
        destinationNote: '',
        franchiseId: selectedFranchise?._id || user?.franchise_id || '',
        tripType: '',
        carGearType: CAR_GEAR_TYPES.MANUAL,
        carType: CAR_TYPE_CATEGORIES.NORMAL,
        tripDate: '',
        tripTime: '',
        isDetailsReconfirmed: false,
        isFareDiscussed: false,
        isPriceAccepted: false,
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        // Fetch trip types if not already loaded
        if (tripTypes.length === 0) {
            dispatch(fetchTripTypesPaginated({ page: 1, limit: 100 }));
        }
        
        // Fetch franchises if not already loaded
        if (franchises.length === 0) {
            dispatch(fetchFranchises());
        }
        
        // Set franchise ID
        const franchiseId = selectedFranchise?._id || user?.franchise_id || '';
        if (franchiseId) {
            setFormData(prev => ({ ...prev, franchiseId }));
        }
    }, [dispatch, tripTypes.length, franchises.length, selectedFranchise, user]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData((prev) => ({ ...prev, [name]: checked }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
        setError(null);
        setSuccess(null);
    };

    const handlePickupPlaceSelect = (placeDetails: PlaceDetails) => {
        console.log('Pickup place selected:', placeDetails);
        setFormData((prev) => ({
            ...prev,
            pickupLocation: placeDetails.placeId || '',
            pickupLocationSearch: placeDetails.name || placeDetails.formattedAddress || '',
            pickupAddress: placeDetails.formattedAddress || '',
        }));
        setError(null);
        setSuccess(null);
    };

    const handleDestinationPlaceSelect = (placeDetails: PlaceDetails) => {
        console.log('Destination place selected:', placeDetails);
        setFormData((prev) => ({
            ...prev,
            destinationLocation: placeDetails.placeId || '',
            destinationLocationSearch: placeDetails.name || placeDetails.formattedAddress || '',
            destinationAddress: placeDetails.formattedAddress || '',
        }));
        setError(null);
        setSuccess(null);
    };

    const validateForm = (): boolean => {
        if (!formData.customerName.trim()) {
            setError('Customer name is required');
            return false;
        }
        if (!formData.customerPhone.trim()) {
            setError('Customer phone number is required');
            return false;
        }
        // Check if pickup address exists
        if (!formData.pickupAddress || !formData.pickupAddress.trim()) {
            setError('Pickup address is required. Please enter or select a pickup address.');
            return false;
        }
        // Note: Place ID is optional - user can enter address manually
        // If address exists but no place ID, that's okay (manual entry)
        console.log('Form validation - Pickup:', {
            address: formData.pickupAddress,
            placeId: formData.pickupLocation,
        });
        
        // Check if destination address exists
        if (!formData.destinationAddress || !formData.destinationAddress.trim()) {
            setError('Destination address is required. Please enter or select a destination address.');
            return false;
        }
        // Note: Place ID is optional - user can enter address manually
        console.log('Form validation - Destination:', {
            address: formData.destinationAddress,
            placeId: formData.destinationLocation,
        });
        if (!formData.tripType) {
            setError('Trip type is required');
            return false;
        }
        if (!formData.franchiseId) {
            setError('Franchise is required');
            return false;
        }
        if (!formData.tripDate || !formData.tripTime) {
            setError('Trip date and time are required');
            return false;
        }
        if (!formData.isDetailsReconfirmed || !formData.isFareDiscussed || !formData.isPriceAccepted) {
            setError('Please confirm all required checkboxes');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            const payload = {
                customerName: formData.customerName.trim(),
                customerPhone: formData.customerPhone.trim(),
                customerEmail: formData.customerEmail.trim() || undefined,
                // Use place ID if available, otherwise use address as location (manual entry)
                pickupLocation: formData.pickupLocation || formData.pickupAddress,
                pickupAddress: formData.pickupAddress,
                pickupLocationNote: formData.pickupLocationNote.trim() || undefined,
                // Use place ID if available, otherwise use address as location (manual entry)
                destinationLocation: formData.destinationLocation || formData.destinationAddress,
                destinationAddress: formData.destinationAddress,
                destinationNote: formData.destinationNote.trim() || undefined,
                franchiseId: formData.franchiseId,
                tripType: formData.tripType,
                carGearType: formData.carGearType,
                carType: formData.carType,
                tripDate: formData.tripDate,
                tripTime: formData.tripTime,
                isDetailsReconfirmed: formData.isDetailsReconfirmed,
                isFareDiscussed: formData.isFareDiscussed,
                isPriceAccepted: formData.isPriceAccepted,
            };

            const response = await createTripPhase1(payload);
            
            setSuccess(`Trip created successfully! Trip ID: ${response.data.trip.id}`);
            
            // Reset form after 2 seconds
            setTimeout(() => {
                setFormData({
                    customerName: '',
                    customerPhone: '',
                    customerEmail: '',
                    pickupLocation: '',
                    pickupLocationSearch: '',
                    pickupAddress: '',
                    pickupLocationNote: '',
                    destinationLocation: '',
                    destinationLocationSearch: '',
                    destinationAddress: '',
                    destinationNote: '',
                    franchiseId: formData.franchiseId,
                    tripType: '',
                    carGearType: CAR_GEAR_TYPES.MANUAL,
                    carType: CAR_TYPE_CATEGORIES.NORMAL,
                    tripDate: '',
                    tripTime: '',
                    isDetailsReconfirmed: false,
                    isFareDiscussed: false,
                    isPriceAccepted: false,
                });
                setSuccess(null);
            }, 3000);
        } catch (err: any) {
            setError(
                err?.response?.data?.error ||
                err?.message ||
                'Failed to create trip booking'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const activeTripTypes = useMemo(
        () => tripTypes.filter(t => t.status === 'ACTIVE'),
        [tripTypes]
    );

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white">
                        Create Trip Booking (Phase 1)
                    </h2>
                    <p className="text-[#49659c] dark:text-gray-400">
                        Book a new trip for a customer. Driver will be assigned later.
                    </p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-8">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </div>
                )}

                {success && (
                    <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
                    </div>
                )}

                <div className="space-y-8">
                    {/* Customer Information */}
                    <div>
                        <h3 className="text-lg font-bold text-[#0d121c] dark:text-white mb-4 flex items-center gap-2">
                            <User size={20} />
                            Customer Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-[#49659c] uppercase tracking-widest">
                                    Customer Name *
                                </label>
                                <input
                                    required
                                    type="text"
                                    name="customerName"
                                    value={formData.customerName}
                                    onChange={handleChange}
                                    placeholder="Enter customer name"
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-medium"
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-[#49659c] uppercase tracking-widest flex items-center gap-2">
                                    <Phone size={14} />
                                    Phone Number *
                                </label>
                                <input
                                    required
                                    type="tel"
                                    name="customerPhone"
                                    value={formData.customerPhone}
                                    onChange={handleChange}
                                    placeholder="Enter phone number"
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-medium"
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-[#49659c] uppercase tracking-widest flex items-center gap-2">
                                    <Mail size={14} />
                                    Email (Optional)
                                </label>
                                <input
                                    type="email"
                                    name="customerEmail"
                                    value={formData.customerEmail}
                                    onChange={handleChange}
                                    placeholder="Enter email address"
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-medium"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Location Information */}
                    <div>
                        <h3 className="text-lg font-bold text-[#0d121c] dark:text-white mb-4 flex items-center gap-2">
                            <MapPin size={20} />
                            Location Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-[#49659c] uppercase tracking-widest">
                                        Pickup Location *
                                    </label>
                                    <PlacesAutocomplete
                                        value={formData.pickupLocationSearch}
                                        onChange={handlePickupPlaceSelect}
                                        placeholder="Search for pickup location..."
                                        required
                                        disabled={isSubmitting}
                                        onError={(error) => setError(error)}
                                    />
                                    <p className="text-xs text-[#49659c] dark:text-gray-400">
                                        Search and select a location. The address will be auto-filled below.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-[#49659c] uppercase tracking-widest">
                                        Pickup Address *
                                    </label>
                                    <textarea
                                        required
                                        name="pickupAddress"
                                        value={formData.pickupAddress}
                                        onChange={handleChange}
                                        placeholder="Address will be auto-filled from location search"
                                        rows={3}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-medium resize-none"
                                        disabled={isSubmitting}
                                    />
                                    <p className="text-xs text-[#49659c] dark:text-gray-400">
                                        Address is automatically filled when you select a location. You can edit if needed.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-[#49659c] uppercase tracking-widest">
                                        Pickup Location Note (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        name="pickupLocationNote"
                                        value={formData.pickupLocationNote}
                                        onChange={handleChange}
                                        placeholder="e.g. Near main gate, Building A"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-medium"
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-[#49659c] uppercase tracking-widest">
                                        Destination Location *
                                    </label>
                                    <PlacesAutocomplete
                                        value={formData.destinationLocationSearch}
                                        onChange={handleDestinationPlaceSelect}
                                        placeholder="Search for destination location..."
                                        required
                                        disabled={isSubmitting}
                                        onError={(error) => setError(error)}
                                    />
                                    <p className="text-xs text-[#49659c] dark:text-gray-400">
                                        Search and select a location. The address will be auto-filled below.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-[#49659c] uppercase tracking-widest">
                                        Destination Address *
                                    </label>
                                    <textarea
                                        required
                                        name="destinationAddress"
                                        value={formData.destinationAddress}
                                        onChange={handleChange}
                                        placeholder="Address will be auto-filled from location search"
                                        rows={3}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-medium resize-none"
                                        disabled={isSubmitting}
                                    />
                                    <p className="text-xs text-[#49659c] dark:text-gray-400">
                                        Address is automatically filled when you select a location. You can edit if needed.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-[#49659c] uppercase tracking-widest">
                                        Destination Note (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        name="destinationNote"
                                        value={formData.destinationNote}
                                        onChange={handleChange}
                                        placeholder="e.g. Drop at reception"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-medium"
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Franchise Selection */}
                    <div>
                        <h3 className="text-lg font-bold text-[#0d121c] dark:text-white mb-4 flex items-center gap-2">
                            <Store size={20} />
                            Franchise Selection
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-[#49659c] uppercase tracking-widest flex items-center gap-2">
                                    <Store size={14} />
                                    Franchise *
                                </label>
                                <select
                                    required
                                    name="franchiseId"
                                    value={formData.franchiseId}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-medium"
                                    disabled={isSubmitting}
                                >
                                    <option value="">Select Franchise</option>
                                    {franchises
                                        .filter((f) => f.status === 'active')
                                        .map((franchise) => (
                                            <option key={franchise._id} value={franchise._id}>
                                                {franchise.code} - {franchise.name} ({franchise.location})
                                            </option>
                                        ))}
                                </select>
                                {!formData.franchiseId && (
                                    <p className="text-xs text-amber-600 dark:text-amber-400">
                                        Please select a franchise to continue
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Trip Details */}
                    <div>
                        <h3 className="text-lg font-bold text-[#0d121c] dark:text-white mb-4 flex items-center gap-2">
                            <Car size={20} />
                            Trip Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-[#49659c] uppercase tracking-widest">
                                    Trip Type *
                                </label>
                                <select
                                    required
                                    name="tripType"
                                    value={formData.tripType}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-medium"
                                    disabled={isSubmitting}
                                >
                                    <option value="">Select Trip Type</option>
                                    {activeTripTypes.map((tripType) => (
                                        <option key={tripType.id} value={tripType.name}>
                                            {tripType.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-[#49659c] uppercase tracking-widest">
                                    Car Gear Type *
                                </label>
                                <select
                                    required
                                    name="carGearType"
                                    value={formData.carGearType}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-medium"
                                    disabled={isSubmitting}
                                >
                                    <option value={CAR_GEAR_TYPES.MANUAL}>Manual</option>
                                    <option value={CAR_GEAR_TYPES.AUTOMATIC}>Automatic</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-[#49659c] uppercase tracking-widest">
                                    Car Type *
                                </label>
                                <select
                                    required
                                    name="carType"
                                    value={formData.carType}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-medium"
                                    disabled={isSubmitting}
                                >
                                    <option value={CAR_TYPE_CATEGORIES.NORMAL}>Normal</option>
                                    <option value={CAR_TYPE_CATEGORIES.PREMIUM}>Premium</option>
                                    <option value={CAR_TYPE_CATEGORIES.LUXURY}>Luxury</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-[#49659c] uppercase tracking-widest flex items-center gap-2">
                                    <Calendar size={14} />
                                    Trip Date *
                                </label>
                                <input
                                    required
                                    type="date"
                                    name="tripDate"
                                    value={formData.tripDate}
                                    onChange={handleChange}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-medium"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>
                        <div className="mt-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-[#49659c] uppercase tracking-widest flex items-center gap-2">
                                    <Clock size={14} />
                                    Trip Time *
                                </label>
                                <input
                                    required
                                    type="time"
                                    name="tripTime"
                                    value={formData.tripTime}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-medium"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Confirmation Checkboxes */}
                    <div>
                        <h3 className="text-lg font-bold text-[#0d121c] dark:text-white mb-4 flex items-center gap-2">
                            <CheckCircle2 size={20} />
                            Confirmation
                        </h3>
                        <div className="space-y-4">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="isDetailsReconfirmed"
                                    checked={formData.isDetailsReconfirmed}
                                    onChange={handleChange}
                                    className="w-5 h-5 rounded border-gray-300 text-[#0d59f2] focus:ring-[#0d59f2]"
                                    disabled={isSubmitting}
                                />
                                <span className="text-sm text-[#0d121c] dark:text-white">
                                    I have reconfirmed all trip details with the customer *
                                </span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="isFareDiscussed"
                                    checked={formData.isFareDiscussed}
                                    onChange={handleChange}
                                    className="w-5 h-5 rounded border-gray-300 text-[#0d59f2] focus:ring-[#0d59f2]"
                                    disabled={isSubmitting}
                                />
                                <span className="text-sm text-[#0d121c] dark:text-white">
                                    Fare has been discussed with the customer *
                                </span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="isPriceAccepted"
                                    checked={formData.isPriceAccepted}
                                    onChange={handleChange}
                                    className="w-5 h-5 rounded border-gray-300 text-[#0d59f2] focus:ring-[#0d59f2]"
                                    disabled={isSubmitting}
                                />
                                <span className="text-sm text-[#0d121c] dark:text-white">
                                    Customer has accepted the price *
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-100 dark:border-gray-800">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-6 py-2.5 bg-[#0d59f2] text-white rounded-xl font-bold hover:bg-[#0d59f2]/90 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span>Creating...</span>
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    <span>Create Trip Booking</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
