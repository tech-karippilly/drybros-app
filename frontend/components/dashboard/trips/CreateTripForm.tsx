"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, ArrowRight, ArrowLeft, User, Phone, Mail, MapPin, Car, CheckCircle, Calendar, DollarSign } from 'lucide-react';
import { CreateTripStep1Input, CarType, CAR_TYPE_LABELS } from '@/lib/types/trips';
import { useAppSelector, useAppDispatch } from '@/lib/hooks';
import { fetchTripTypeDetails } from '@/lib/features/tripTypeDetail/tripTypeDetailSlice';
import { useToast } from '@/components/ui/toast';
import { TRIPS_STRINGS } from '@/lib/constants/trips';
import { TripTypeStatus } from '@/lib/types/tripTypes';
import { DatePicker } from '@/components/ui/date-picker';
import { PlacesAutocomplete } from '@/components/ui/places-autocomplete';

interface CreateTripFormProps {
    isOpen: boolean;
    onClose: () => void;
    onStep1Complete: (data: CreateTripStep1Input) => void;
}

const INITIAL_STEP1_DATA: CreateTripStep1Input = {
    customerName: '',
    phone: '',
    alternativePhone: '',
    email: '',
    tripTypeId: 0,
    pickupLocation: '',
    pickupNote: '',
    destinationLocation: '',
    destinationNote: '',
    carType: CarType.STANDARD,
    scheduledAt: null,
    isDetailsReconfirmed: false,
    isFareDiscussed: false,
    isPriceAccepted: false,
};

const INPUT_CLASSES = "w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-medium";
const TEXTAREA_CLASSES = `${INPUT_CLASSES} text-sm resize-none`;

export function CreateTripForm({ isOpen, onClose, onStep1Complete }: CreateTripFormProps) {
    const dispatch = useAppDispatch();
    const { toast } = useToast();
    const { list: tripTypes } = useAppSelector((state) => state.tripTypeDetail);

    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [step1Data, setStep1Data] = useState<CreateTripStep1Input>(INITIAL_STEP1_DATA);
    const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
    const [scheduledTime, setScheduledTime] = useState<string>('');

    useEffect(() => {
        if (isOpen) {
            dispatch(fetchTripTypeDetails());
            setCurrentStep(1);
            setStep1Data(INITIAL_STEP1_DATA);
            setScheduledDate(undefined);
            setScheduledTime('');
        }
    }, [isOpen, dispatch]);

    const validateStep1 = useCallback((): boolean => {
        const validations = [
            { condition: !step1Data.customerName.trim(), message: 'Customer name is required' },
            { condition: !step1Data.phone.trim(), message: 'Phone number is required' },
            { condition: !step1Data.tripTypeId || step1Data.tripTypeId === 0, message: 'Trip type is required' },
            { condition: !step1Data.pickupLocation.trim(), message: 'Pickup location is required' },
            { condition: !step1Data.destinationLocation.trim(), message: 'Destination location is required' },
            { condition: !step1Data.isDetailsReconfirmed, message: 'Please confirm that details are reconfirmed' },
            { condition: !step1Data.isFareDiscussed, message: 'Please confirm that fare has been discussed' },
            { condition: !step1Data.isPriceAccepted, message: 'Please confirm that price has been accepted' },
        ];

        for (const { condition, message } of validations) {
            if (condition) {
                toast({ title: 'Validation Error', description: message, variant: 'error' });
                return false;
            }
        }
        return true;
    }, [step1Data, toast]);

    // Combine date and time into scheduledAt
    useEffect(() => {
        if (scheduledDate && scheduledTime) {
            const [hours, minutes] = scheduledTime.split(':');
            const combinedDate = new Date(scheduledDate);
            combinedDate.setHours(parseInt(hours) || 0, parseInt(minutes) || 0, 0, 0);
            setStep1Data(prev => ({ ...prev, scheduledAt: combinedDate }));
        } else if (scheduledDate) {
            setStep1Data(prev => ({ ...prev, scheduledAt: scheduledDate }));
        } else {
            setStep1Data(prev => ({ ...prev, scheduledAt: null }));
        }
    }, [scheduledDate, scheduledTime]);

    const handleStep1Next = useCallback(() => {
        if (validateStep1()) {
            onStep1Complete(step1Data);
            setCurrentStep(2);
        }
    }, [validateStep1, step1Data, onStep1Complete]);

    const activeTripTypes = useMemo(
        () => tripTypes.filter(t => t.status === TripTypeStatus.ACTIVE || t.status === 'ACTIVE'),
        [tripTypes]
    );

    const selectedTripType = useMemo(
        () => tripTypes.find(t => t.id === step1Data.tripTypeId),
        [tripTypes, step1Data.tripTypeId]
    );

    const isPremiumCar = useMemo(
        () => step1Data.carType === CarType.PREMIUM || step1Data.carType === CarType.LUXURY,
        [step1Data.carType]
    );

    const baseFare = useMemo(() => {
        if (!selectedTripType) return 0;
        return isPremiumCar ? selectedTripType.forPremiumCars.basePrice : selectedTripType.basePricePerHour;
    }, [selectedTripType, isPremiumCar]);

    const extraFare = useMemo(() => {
        if (!selectedTripType) return 0;
        return isPremiumCar ? selectedTripType.forPremiumCars.extraPerHour : selectedTripType.extraPerHour;
    }, [selectedTripType, isPremiumCar]);

    const showFareInfo = useMemo(
        () => selectedTripType && step1Data.pickupLocation.trim() && step1Data.destinationLocation.trim() && step1Data.carType,
        [selectedTripType, step1Data.pickupLocation, step1Data.destinationLocation, step1Data.carType]
    );

    const handleFieldChange = useCallback((field: keyof CreateTripStep1Input, value: any) => {
        setStep1Data(prev => ({ ...prev, [field]: value }));
    }, []);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-[#0d121c]/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#101622] w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 z-10 px-8 py-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white/80 dark:bg-gray-800/80 backdrop-blur-md">
                    <div>
                        <h3 className="text-xl font-bold dark:text-white">
                            {currentStep === 1 ? TRIPS_STRINGS.STEP_1_TITLE : TRIPS_STRINGS.STEP_2_TITLE}
                        </h3>
                        <p className="text-xs text-[#49659c] font-medium uppercase tracking-wider mt-1">
                            Step {currentStep} of 2
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all text-[#49659c]"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Step Indicator */}
                <div className="px-8 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex items-center gap-4">
                        <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-[#0d59f2]' : 'text-[#49659c]'}`}>
                            <div className={`size-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                currentStep >= 1 ? 'bg-[#0d59f2] text-white' : 'bg-gray-200 dark:bg-gray-800 text-[#49659c]'
                            }`}>
                                {currentStep > 1 ? <CheckCircle size={16} /> : '1'}
                            </div>
                            <span className="text-sm font-medium">Customer Data</span>
                        </div>
                        <div className="flex-1 h-0.5 bg-gray-200 dark:bg-gray-800">
                            <div className={`h-full transition-all ${currentStep >= 2 ? 'bg-[#0d59f2]' : ''}`} style={{ width: currentStep >= 2 ? '100%' : '0%' }} />
                        </div>
                        <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-[#0d59f2]' : 'text-[#49659c]'}`}>
                            <div className={`size-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                currentStep >= 2 ? 'bg-[#0d59f2] text-white' : 'bg-gray-200 dark:bg-gray-800 text-[#49659c]'
                            }`}>
                                2
                            </div>
                            <span className="text-sm font-medium">Assignment</span>
                        </div>
                    </div>
                </div>

                {/* Step 1 Content */}
                {currentStep === 1 && (
                    <form onSubmit={(e) => { e.preventDefault(); handleStep1Next(); }} className="p-8" noValidate>
                        <div className="space-y-6">
                            {/* Customer Information Section */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-[#49659c] mb-4">
                                    <User size={16} />
                                    <h4 className="text-sm font-bold uppercase tracking-widest">Customer Information</h4>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-[#49659c] uppercase tracking-widest flex items-center gap-2">
                                            <User size={14} /> {TRIPS_STRINGS.CUSTOMER_NAME} *
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            value={step1Data.customerName}
                                            onChange={(e) => handleFieldChange('customerName', e.target.value)}
                                            placeholder={TRIPS_STRINGS.CUSTOMER_NAME_PLACEHOLDER}
                                            className={INPUT_CLASSES}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-[#49659c] uppercase tracking-widest flex items-center gap-2">
                                            <Phone size={14} /> {TRIPS_STRINGS.PHONE} *
                                        </label>
                                        <input
                                            required
                                            type="tel"
                                            value={step1Data.phone}
                                            onChange={(e) => handleFieldChange('phone', e.target.value)}
                                            placeholder={TRIPS_STRINGS.PHONE_PLACEHOLDER}
                                            className={INPUT_CLASSES}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-[#49659c] uppercase tracking-widest flex items-center gap-2">
                                            <Phone size={14} /> {TRIPS_STRINGS.ALTERNATIVE_PHONE}
                                        </label>
                                        <input
                                            type="tel"
                                            value={step1Data.alternativePhone}
                                            onChange={(e) => handleFieldChange('alternativePhone', e.target.value)}
                                            placeholder={TRIPS_STRINGS.ALTERNATIVE_PHONE_PLACEHOLDER}
                                            className={INPUT_CLASSES}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-[#49659c] uppercase tracking-widest flex items-center gap-2">
                                            <Mail size={14} /> {TRIPS_STRINGS.EMAIL}
                                        </label>
                                        <input
                                            type="email"
                                            value={step1Data.email}
                                            onChange={(e) => handleFieldChange('email', e.target.value)}
                                            placeholder={TRIPS_STRINGS.EMAIL_PLACEHOLDER}
                                            className={INPUT_CLASSES}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Trip Details Section */}
                            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-4">
                                <div className="flex items-center gap-2 text-[#49659c] mb-4">
                                    <MapPin size={16} />
                                    <h4 className="text-sm font-bold uppercase tracking-widest">Trip Details</h4>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-[#49659c] uppercase tracking-widest">
                                            {TRIPS_STRINGS.TRIP_TYPE} *
                                        </label>
                                        <select
                                            required
                                            value={step1Data.tripTypeId}
                                            onChange={(e) => handleFieldChange('tripTypeId', Number(e.target.value))}
                                            className={INPUT_CLASSES}
                                        >
                                            <option value={0}>Select Trip Type</option>
                                            {activeTripTypes.map((tripType) => (
                                                <option key={tripType.id} value={tripType.id}>
                                                    {tripType.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-[#49659c] uppercase tracking-widest flex items-center gap-2">
                                            <Car size={14} /> {TRIPS_STRINGS.CAR_TYPE} *
                                        </label>
                                        <select
                                            required
                                            value={step1Data.carType}
                                            onChange={(e) => handleFieldChange('carType', e.target.value as CarType)}
                                            className={INPUT_CLASSES}
                                        >
                                            {Object.values(CarType).map((type) => (
                                                <option key={type} value={type}>
                                                    {CAR_TYPE_LABELS[type]}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Scheduled Date & Time */}
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-[#49659c] uppercase tracking-widest flex items-center gap-2">
                                        <Calendar size={14} /> {TRIPS_STRINGS.SCHEDULED_AT}
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-[#49659c] uppercase tracking-widest">
                                                {TRIPS_STRINGS.SCHEDULED_DATE}
                                            </label>
                                            <DatePicker
                                                date={scheduledDate}
                                                setDate={setScheduledDate}
                                                placeholder={TRIPS_STRINGS.SCHEDULED_DATE}
                                                className="w-full"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-[#49659c] uppercase tracking-widest">
                                                {TRIPS_STRINGS.SCHEDULED_TIME}
                                            </label>
                                            <input
                                                type="time"
                                                value={scheduledTime}
                                                onChange={(e) => setScheduledTime(e.target.value)}
                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-medium"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-[#49659c] uppercase tracking-widest">
                                        {TRIPS_STRINGS.PICKUP_LOCATION} *
                                    </label>
                                    <PlacesAutocomplete
                                        value={step1Data.pickupLocation}
                                        onChange={(value) => setStep1Data((prev) => ({ ...prev, pickupLocation: value }))}
                                        placeholder={TRIPS_STRINGS.PICKUP_LOCATION_PLACEHOLDER}
                                    />
                                    <textarea
                                        value={step1Data.pickupNote}
                                        onChange={(e) => handleFieldChange('pickupNote', e.target.value)}
                                        placeholder={TRIPS_STRINGS.PICKUP_NOTE_PLACEHOLDER}
                                        rows={3}
                                        className={TEXTAREA_CLASSES}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-[#49659c] uppercase tracking-widest">
                                        {TRIPS_STRINGS.DESTINATION_LOCATION} *
                                    </label>
                                    <PlacesAutocomplete
                                        value={step1Data.destinationLocation}
                                        onChange={(value) => setStep1Data((prev) => ({ ...prev, destinationLocation: value }))}
                                        placeholder={TRIPS_STRINGS.DESTINATION_LOCATION_PLACEHOLDER}
                                    />
                                    <textarea
                                        value={step1Data.destinationNote}
                                        onChange={(e) => handleFieldChange('destinationNote', e.target.value)}
                                        placeholder={TRIPS_STRINGS.DESTINATION_NOTE_PLACEHOLDER}
                                        rows={3}
                                        className={TEXTAREA_CLASSES}
                                    />
                                </div>
                            </div>

                            {/* Fare Information Section */}
                            {showFareInfo && (
                                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-4">
                                    <div className="flex items-center gap-2 text-[#49659c] mb-4">
                                        <DollarSign size={16} />
                                        <h4 className="text-sm font-bold uppercase tracking-widest">Fare Information</h4>
                                    </div>
                                    <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-[#0d121c] dark:text-white">Base Fare:</span>
                                            <span className="text-lg font-bold text-[#0d59f2]">₹{baseFare}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-[#0d121c] dark:text-white">Extra Fare (per hour):</span>
                                            <span className="text-lg font-bold text-[#0d59f2]">₹{extraFare}</span>
                                        </div>
                                        <div className="pt-3 border-t border-blue-200 dark:border-blue-700">
                                            <p className="text-xs text-[#49659c] dark:text-gray-300">
                                                <strong>Note:</strong> This is the base fare and extra fare per hour. Total amount may vary based on trip duration.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Confirmation Section */}
                            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-4">
                                <h4 className="text-sm font-bold uppercase tracking-widest text-[#49659c]">Confirmations</h4>
                                <div className="space-y-3">
                                    <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl cursor-pointer hover:border-[#0d59f2]/40 transition-all">
                                        <input
                                            type="checkbox"
                                            checked={step1Data.isDetailsReconfirmed}
                                            onChange={(e) => handleFieldChange('isDetailsReconfirmed', e.target.checked)}
                                            className="size-4 rounded border-gray-300 text-[#0d59f2] focus:ring-[#0d59f2]"
                                        />
                                        <span className="text-sm font-medium dark:text-white">{TRIPS_STRINGS.IS_DETAILS_RECONFIRMED} *</span>
                                    </label>

                                    <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl cursor-pointer hover:border-[#0d59f2]/40 transition-all">
                                        <input
                                            type="checkbox"
                                            checked={step1Data.isFareDiscussed}
                                            onChange={(e) => handleFieldChange('isFareDiscussed', e.target.checked)}
                                            className="size-4 rounded border-gray-300 text-[#0d59f2] focus:ring-[#0d59f2]"
                                        />
                                        <span className="text-sm font-medium dark:text-white">{TRIPS_STRINGS.IS_FARE_DISCUSSED} *</span>
                                    </label>

                                    <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl cursor-pointer hover:border-[#0d59f2]/40 transition-all">
                                        <input
                                            type="checkbox"
                                            checked={step1Data.isPriceAccepted}
                                            onChange={(e) => handleFieldChange('isPriceAccepted', e.target.checked)}
                                            className="size-4 rounded border-gray-300 text-[#0d59f2] focus:ring-[#0d59f2]"
                                        />
                                        <span className="text-sm font-medium dark:text-white">{TRIPS_STRINGS.IS_PRICE_ACCEPTED} *</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="mt-8 flex gap-4 bg-gray-50 dark:bg-gray-900/50 p-6 rounded-3xl border border-gray-100 dark:border-gray-800">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-2xl text-sm font-bold text-[#49659c] hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-[2] bg-[#0d59f2] text-white py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#0d59f2]/90 shadow-xl shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span>{TRIPS_STRINGS.NEXT_STEP}</span>
                                <ArrowRight size={20} />
                            </button>
                        </div>
                    </form>
                )}

                {/* Step 2 Content - Placeholder for now */}
                {currentStep === 2 && (
                    <div className="p-8">
                        <div className="text-center py-12">
                            <p className="text-[#49659c] dark:text-gray-400">Step 2: Trip Assignment</p>
                            <p className="text-sm text-[#49659c] dark:text-gray-400 mt-2">This step will be implemented next</p>
                        </div>
                        <div className="mt-8 flex gap-4 bg-gray-50 dark:bg-gray-900/50 p-6 rounded-3xl border border-gray-100 dark:border-gray-800">
                            <button
                                type="button"
                                onClick={() => setCurrentStep(1)}
                                className="flex-1 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-2xl text-sm font-bold text-[#49659c] hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm flex items-center justify-center gap-2"
                            >
                                <ArrowLeft size={20} />
                                <span>{TRIPS_STRINGS.PREVIOUS_STEP}</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
