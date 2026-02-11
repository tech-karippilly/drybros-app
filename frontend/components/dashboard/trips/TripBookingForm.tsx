"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { createTripPhase1, assignDriverToTrip } from "@/lib/features/trip/tripApi";
import {
    getDriversByFranchises,
    DriverByFranchiseResponse,
} from "@/lib/features/drivers/driverApi";
import { PerformanceBadge } from "@/components/ui/PerformanceBadge";
import { fetchTripTypesPaginated } from "@/lib/features/tripType/tripTypeSlice";
import { getTripTypesByCarCategory, CarType } from "@/lib/features/tripType/tripTypeApi";
import {
    getFranchiseList,
    type FranchiseResponse,
} from "@/lib/features/franchise/franchiseApi";
import { PlacesAutocomplete, PlaceDetails } from "@/components/ui/PlacesAutocomplete";
import {
    User,
    Car,
    MapPin,
    Settings,
    Calendar,
    Clock,
    Zap,
    Flag,
    Loader2,
    UserPlus,
    CheckCircle,
    AlertCircle,
    Phone,
} from "lucide-react";
import {
    CAR_GEAR_TYPES,
    CAR_TYPE_CATEGORIES,
    BOOKING_STRINGS,
} from "@/lib/constants";
import { DASHBOARD_ROUTES } from "@/lib/constants/routes";
import { cn } from "@/lib/utils";

interface TripBookingFormData {
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    carModel: string;
    pickupLocation: string;
    pickupLocationSearch: string;
    pickupAddress: string;
    pickupLat?: number | null;
    pickupLng?: number | null;
    pickupLocationNote: string;
    destinationLocation: string;
    destinationLocationSearch: string;
    destinationAddress: string;
    destinationLat?: number | null;
    destinationLng?: number | null;
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

const inputBaseClass =
    "form-input w-full rounded-lg text-slate-900 dark:text-white border border-slate-300 dark:border-[#324d67] bg-white dark:bg-[#111a22] focus:border-theme-blue focus:ring-1 focus:ring-theme-blue h-12 placeholder:text-slate-400 dark:placeholder:text-[#526d87] px-4 text-base font-normal";
const labelClass = "text-slate-700 dark:text-white text-sm font-medium pb-2";
const sectionTitleClass =
    "text-slate-900 dark:text-white text-xl font-bold leading-tight tracking-[-0.015em]";

export function TripBookingForm() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { selectedFranchise } = useAppSelector((state) => state.franchise);
    const { list: tripTypes } = useAppSelector((state) => state.tripType);
    const { user } = useAppSelector((state) => state.auth);

    const [formData, setFormData] = useState<TripBookingFormData>({
        customerName: "",
        customerPhone: "",
        customerEmail: "",
        carModel: "",
        pickupLocation: "",
        pickupLocationSearch: "",
        pickupAddress: "",
        pickupLat: null,
        pickupLng: null,
        pickupLocationNote: "",
        destinationLocation: "",
        destinationLocationSearch: "",
        destinationAddress: "",
        destinationLat: null,
        destinationLng: null,
        destinationNote: "",
        franchiseId: selectedFranchise?._id || user?.franchise_id || "",
        tripType: "",
        carGearType: CAR_GEAR_TYPES.AUTOMATIC,
        carType: CAR_TYPE_CATEGORIES.NORMAL,
        tripDate: "",
        tripTime: "",
        isDetailsReconfirmed: false,
        isFareDiscussed: false,
        isPriceAccepted: false,
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [createdTripId, setCreatedTripId] = useState<string | null>(null);
    const [availableDrivers, setAvailableDrivers] = useState<
        DriverByFranchiseResponse[]
    >([]);
    const [loadingDrivers, setLoadingDrivers] = useState(false);
    const [assigningDriver, setAssigningDriver] = useState<string | null>(null);
    const [driverAssigned, setDriverAssigned] = useState(false);
    const [franchiseList, setFranchiseList] = useState<FranchiseResponse[]>([]);
    const [loadingFranchises, setLoadingFranchises] = useState(true);
    const [filteredTripTypes, setFilteredTripTypes] = useState<any[]>([]);
    const [loadingTripTypes, setLoadingTripTypes] = useState(false);

    useEffect(() => {
        if (tripTypes.length === 0) {
            dispatch(fetchTripTypesPaginated({ page: 1, limit: 100 }));
        }
    }, [dispatch, tripTypes.length]);

    useEffect(() => {
        let cancelled = false;
        setLoadingFranchises(true);
        getFranchiseList()
            .then((list) => {
                if (!cancelled) setFranchiseList(list);
            })
            .catch(() => {
                if (!cancelled) setFranchiseList([]);
            })
            .finally(() => {
                if (!cancelled) setLoadingFranchises(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        const franchiseId = selectedFranchise?._id || user?.franchise_id || "";
        if (franchiseId) {
            setFormData((prev) => ({ ...prev, franchiseId }));
        }
    }, [selectedFranchise, user]);

    // Fetch trip types when vehicle category changes
    useEffect(() => {
        let cancelled = false;
        
        const fetchTripTypesByCategory = async () => {
            try {
                setLoadingTripTypes(true);
                setError(null);
                
                const carCategoryMap: Record<string, CarType> = {
                    [CAR_TYPE_CATEGORIES.NORMAL]: CarType.NORMAL,
                    [CAR_TYPE_CATEGORIES.PREMIUM]: CarType.PREMIUM,
                    [CAR_TYPE_CATEGORIES.LUXURY]: CarType.LUXURY,
                    [CAR_TYPE_CATEGORIES.SPORTS]: CarType.SPORTS,
                };
                
                const category = carCategoryMap[formData.carType];
                if (category) {
                    const types = await getTripTypesByCarCategory(category);
                    if (!cancelled) {
                        setFilteredTripTypes(types);
                        
                        // Reset trip type selection if current selection is not in filtered list
                        if (formData.tripType && !types.some((t: any) => t.name === formData.tripType)) {
                            setFormData((prev) => ({ ...prev, tripType: "" }));
                        }
                    }
                }
            } catch (err: unknown) {
                if (!cancelled) {
                    const ex = err as { response?: { data?: { error?: string } }; message?: string };
                    console.error("Failed to fetch trip types:", ex);
                    setFilteredTripTypes([]);
                }
            } finally {
                if (!cancelled) {
                    setLoadingTripTypes(false);
                }
            }
        };
        
        fetchTripTypesByCategory();
        
        return () => {
            cancelled = true;
        };
    }, [formData.carType]);

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        const { name, value, type } = e.target;
        if (type === "checkbox") {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData((prev) => ({ ...prev, [name]: checked }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
        setError(null);
        setSuccess(null);
    };

    const handlePickupPlaceSelect = (placeDetails: PlaceDetails) => {
        setFormData((prev) => ({
            ...prev,
            pickupLocation: placeDetails.placeId || "",
            pickupLocationSearch:
                placeDetails.name || placeDetails.formattedAddress || "",
            // Only update pickup address when a place was actually selected (has placeId).
            // If user only typed in Location and blurred, do not overwrite the Address field.
            ...(placeDetails.placeId
                ? { pickupAddress: placeDetails.formattedAddress || "" }
                : {}),
            // set geometry if available
            ...(placeDetails.geometry && placeDetails.geometry.location
                ? { pickupLat: placeDetails.geometry.location.lat, pickupLng: placeDetails.geometry.location.lng }
                : {}),
        }));
        setError(null);
        setSuccess(null);
    };

    const handleDestinationPlaceSelect = (placeDetails: PlaceDetails) => {
        setFormData((prev) => ({
            ...prev,
            destinationLocation: placeDetails.placeId || "",
            destinationLocationSearch:
                placeDetails.name || placeDetails.formattedAddress || "",
            // Only update destination address when a place was actually selected (has placeId).
            ...(placeDetails.placeId
                ? { destinationAddress: placeDetails.formattedAddress || "" }
                : {}),
            ...(placeDetails.geometry && placeDetails.geometry.location
                ? { destinationLat: placeDetails.geometry.location.lat, destinationLng: placeDetails.geometry.location.lng }
                : {}),
        }));
        setError(null);
        setSuccess(null);
    };

    const validateForm = (): boolean => {
        if (!formData.customerName.trim()) {
            setError("Customer name is required");
            return false;
        }
        if (!formData.customerPhone.trim()) {
            setError("Customer phone number is required");
            return false;
        }
        if (!formData.pickupAddress?.trim()) {
            setError("Pickup address is required.");
            return false;
        }
        if (!formData.destinationAddress?.trim()) {
            setError("Destination address is required.");
            return false;
        }
        if (!formData.tripType) {
            setError("Trip type is required");
            return false;
        }
        if (!formData.franchiseId) {
            setError("Franchise is required");
            return false;
        }
        if (!formData.tripDate || !formData.tripTime) {
            setError("Trip date and time are required");
            return false;
        }
        if (!formData.isDetailsReconfirmed) {
            setError("Please confirm details have been reconfirmed with customer");
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        if (!validateForm()) return;
        setIsSubmitting(true);
        try {
            // Helper: geocode address via Google Geocoding API if geometry not present
            const geocodeAddress = async (address: string) => {
                try {
                    const key = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
                    if (!key) return null;
                    const res = await fetch(
                        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${key}`
                    );
                    const data = await res.json();
                    if (data && data.results && data.results.length > 0) {
                        const loc = data.results[0].geometry.location;
                        return { lat: loc.lat, lng: loc.lng };
                    }
                    return null;
                } catch (err) {
                    return null;
                }
            };

            // Ensure we have lat/lng for pickup/destination (try existing geometry first, then geocode address)
            let pickupLat = formData.pickupLat ?? null;
            let pickupLng = formData.pickupLng ?? null;
            let destinationLat = formData.destinationLat ?? null;
            let destinationLng = formData.destinationLng ?? null;

            if ((pickupLat == null || pickupLng == null) && formData.pickupAddress) {
                const g = await geocodeAddress(formData.pickupAddress);
                if (g) {
                    pickupLat = g.lat;
                    pickupLng = g.lng;
                }
            }

            if ((destinationLat == null || destinationLng == null) && formData.destinationAddress) {
                const g = await geocodeAddress(formData.destinationAddress);
                if (g) {
                    destinationLat = g.lat;
                    destinationLng = g.lng;
                }
            }

            const payload = {
                customerName: formData.customerName.trim(),
                customerPhone: formData.customerPhone.trim(),
                customerEmail: formData.customerEmail.trim() || undefined,
                pickupLocation: formData.pickupLocation || formData.pickupAddress,
                pickupAddress: formData.pickupAddress,
                pickupLat,
                pickupLng,
                pickupLocationNote: formData.pickupLocationNote.trim() || undefined,
                destinationLocation:
                    formData.destinationLocation || formData.destinationAddress,
                destinationAddress: formData.destinationAddress,
                destinationLat,
                destinationLng,
                destinationNote: formData.destinationNote.trim() || undefined,
                franchiseId: formData.franchiseId,
                tripType: formData.tripType,
                carGearType: formData.carGearType,
                carType: formData.carType,
                tripDate: formData.tripDate,
                tripTime: formData.tripTime,
                isDetailsReconfirmed: formData.isDetailsReconfirmed,
                isFareDiscussed: true,
                isPriceAccepted: true,
            };
            const response = await createTripPhase1(payload);
            const tripId = response.data.trip.id;
            setSuccess(BOOKING_STRINGS.SUCCESS_CREATED_REDIRECTING_REQUEST_DRIVERS);
            setCreatedTripId(tripId);
            // Redirect to dedicated Request Drivers screen (Dybros Dispatch style)
            router.push(`${DASHBOARD_ROUTES.REQUEST_DRIVERS}/${tripId}`);
        } catch (err: unknown) {
            const ex = err as { response?: { data?: { error?: string }; status?: number }; message?: string };
            setError(
                ex?.response?.data?.error ||
                    ex?.message ||
                    "Failed to create trip booking"
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const fetchAvailableDrivers = async (franchiseId: string) => {
        try {
            setLoadingDrivers(true);
            setError(null);
            const drivers = await getDriversByFranchises(franchiseId);
            const availableGreenDrivers = drivers.filter(
                (d) =>
                    d.availableStatus === "AVAILABLE" &&
                    d.performanceStatus === "GREEN"
            );
            setAvailableDrivers(availableGreenDrivers);
        } catch (err: unknown) {
            const ex = err as { response?: { data?: { error?: string } }; message?: string };
            setError(
                ex?.response?.data?.error ||
                    ex?.message ||
                    "Failed to fetch available drivers"
            );
        } finally {
            setLoadingDrivers(false);
        }
    };

    const handleAssignDriver = async (driverId: string) => {
        if (!createdTripId) return;
        try {
            setAssigningDriver(driverId);
            await assignDriverToTrip(createdTripId, driverId);
            setDriverAssigned(true);
            setSuccess("Driver assigned successfully!");
            setTimeout(() => {
                resetForm();
            }, 3000);
        } catch (err: unknown) {
            const ex = err as { response?: { data?: { message?: string } }; message?: string };
            setError(
                ex?.response?.data?.message ||
                    ex?.message ||
                    "Failed to assign driver"
            );
        } finally {
            setAssigningDriver(null);
        }
    };

    const resetForm = () => {
        setFormData({
            customerName: "",
            customerPhone: "",
            customerEmail: "",
            carModel: "",
            pickupLocation: "",
            pickupLocationSearch: "",
            pickupAddress: "",
            pickupLocationNote: "",
            destinationLocation: "",
            destinationLocationSearch: "",
            destinationAddress: "",
            destinationNote: "",
            franchiseId: formData.franchiseId,
            tripType: "",
            carGearType: CAR_GEAR_TYPES.AUTOMATIC,
            carType: CAR_TYPE_CATEGORIES.NORMAL,
            tripDate: "",
            tripTime: "",
            isDetailsReconfirmed: false,
            isFareDiscussed: false,
            isPriceAccepted: false,
        });
        setCreatedTripId(null);
        setAvailableDrivers([]);
        setDriverAssigned(false);
        setSuccess(null);
    };

    const handleSkipAssignment = () => {
        resetForm();
    };

    const handleSaveDraft = () => {
        // Placeholder: could persist to localStorage or API later
        setSuccess("Draft saved.");
        setTimeout(() => setSuccess(null), 2000);
    };

    const activeFranchises = useMemo(
        () =>
            franchiseList.filter(
                (f) =>
                    (f.status ?? "").toUpperCase() === "ACTIVE" || f.isActive
            ),
        [franchiseList]
    );

    return (
        <div className="max-w-[1200px] mx-auto flex flex-col gap-8 animate-in fade-in duration-500">
            {/* Breadcrumbs */}
            <div className="flex flex-wrap gap-2">
                <Link
                    href={DASHBOARD_ROUTES.HOME}
                    className="text-slate-500 dark:text-[#92adc9] text-sm font-medium hover:text-theme-blue"
                >
                    {BOOKING_STRINGS.BREADCRUMB_DASHBOARD}
                </Link>
                <span className="text-slate-500 dark:text-[#92adc9] text-sm font-medium">
                    /
                </span>
                <Link
                    href={DASHBOARD_ROUTES.TRIPS}
                    className="text-slate-500 dark:text-[#92adc9] text-sm font-medium hover:text-theme-blue"
                >
                    {BOOKING_STRINGS.BREADCRUMB_TRIPS}
                </Link>
                <span className="text-slate-500 dark:text-[#92adc9] text-sm font-medium">
                    /
                </span>
                <span className="text-slate-900 dark:text-white text-sm font-medium">
                    {BOOKING_STRINGS.BREADCRUMB_BOOK}
                </span>
            </div>

            {/* Page Heading */}
            <div className="flex flex-wrap justify-between items-end gap-3">
                <div className="flex flex-col gap-1">
                    <h1 className="text-slate-900 dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
                        {BOOKING_STRINGS.PAGE_TITLE}
                    </h1>
                    <p className="text-slate-500 dark:text-[#92adc9] text-base font-normal leading-normal">
                        {BOOKING_STRINGS.PAGE_SUBTITLE}
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={handleSaveDraft}
                        className="px-5 py-2.5 rounded-lg border border-slate-300 dark:border-[#324d67] text-slate-700 dark:text-white font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        {BOOKING_STRINGS.SAVE_AS_DRAFT}
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400">
                        {error}
                    </p>
                </div>
            )}
            {success && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-sm text-green-600 dark:text-green-400">
                        {success}
                    </p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: Customer & Car Details */}
                    <div className="flex flex-col gap-8">
                        {/* Customer Information */}
                        <section className="bg-white dark:bg-[#192633] rounded-xl p-6 border border-slate-200 dark:border-[#233648] shadow-sm">
                            <div className="flex items-center gap-2 mb-6">
                                <User className="size-5 text-theme-blue" />
                                <h2 className={sectionTitleClass}>
                                    {BOOKING_STRINGS.CUSTOMER_INFO}
                                </h2>
                            </div>
                            <div className="flex flex-col gap-5">
                                <label className="flex flex-col">
                                    <p className={labelClass}>
                                        {BOOKING_STRINGS.CUSTOMER_FULL_NAME}
                                    </p>
                                    <input
                                        required
                                        type="text"
                                        name="customerName"
                                        value={formData.customerName}
                                        onChange={handleChange}
                                        placeholder={
                                            BOOKING_STRINGS.CUSTOMER_FULL_NAME_PLACEHOLDER
                                        }
                                        className={inputBaseClass}
                                        disabled={isSubmitting}
                                    />
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    <label className="flex flex-col">
                                        <p className={labelClass}>
                                            {BOOKING_STRINGS.PHONE_NUMBER}
                                        </p>
                                        <input
                                            required
                                            type="tel"
                                            name="customerPhone"
                                            value={formData.customerPhone}
                                            onChange={handleChange}
                                            placeholder={
                                                BOOKING_STRINGS.PHONE_PLACEHOLDER
                                            }
                                            className={inputBaseClass}
                                            disabled={isSubmitting}
                                        />
                                    </label>
                                    <label className="flex flex-col">
                                        <p className={labelClass}>
                                            {BOOKING_STRINGS.EMAIL_ADDRESS}
                                        </p>
                                        <input
                                            type="email"
                                            name="customerEmail"
                                            value={formData.customerEmail}
                                            onChange={handleChange}
                                            placeholder={
                                                BOOKING_STRINGS.EMAIL_PLACEHOLDER
                                            }
                                            className={inputBaseClass}
                                            disabled={isSubmitting}
                                        />
                                    </label>
                                </div>
                            </div>
                        </section>

                        {/* Car Details */}
                        <section className="bg-white dark:bg-[#192633] rounded-xl p-6 border border-slate-200 dark:border-[#233648] shadow-sm">
                            <div className="flex items-center gap-2 mb-6">
                                <Car className="size-5 text-theme-blue" />
                                <h2 className={sectionTitleClass}>
                                    {BOOKING_STRINGS.CAR_DETAILS}
                                </h2>
                            </div>
                            <div className="flex flex-col gap-5">
                                <label className="flex flex-col">
                                    <p className={labelClass}>
                                        {BOOKING_STRINGS.CAR_MODEL_NAME}
                                    </p>
                                    <input
                                        type="text"
                                        name="carModel"
                                        value={formData.carModel}
                                        onChange={handleChange}
                                        placeholder={
                                            BOOKING_STRINGS.CAR_MODEL_PLACEHOLDER
                                        }
                                        className={inputBaseClass}
                                        disabled={isSubmitting}
                                    />
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    <label className="flex flex-col">
                                        <p className={labelClass}>
                                            {BOOKING_STRINGS.TRANSMISSION_TYPE}
                                        </p>
                                        <select
                                            name="carGearType"
                                            value={formData.carGearType}
                                            onChange={handleChange}
                                            className={inputBaseClass}
                                            disabled={isSubmitting}
                                        >
                                            <option value={CAR_GEAR_TYPES.AUTOMATIC}>
                                                {BOOKING_STRINGS.TRANSMISSION_AUTOMATIC}
                                            </option>
                                            <option value={CAR_GEAR_TYPES.MANUAL}>
                                                {BOOKING_STRINGS.TRANSMISSION_MANUAL}
                                            </option>
                                            <option value={CAR_GEAR_TYPES.EV}>
                                                {BOOKING_STRINGS.TRANSMISSION_EV}
                                            </option>
                                        </select>
                                    </label>
                                    <div className="flex flex-col">
                                        <p className={labelClass}>
                                            {BOOKING_STRINGS.VEHICLE_CATEGORY}
                                        </p>
                                        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-[#111a22] rounded-lg border border-slate-300 dark:border-[#324d67]">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        carType: CAR_TYPE_CATEGORIES.NORMAL,
                                                    }))
                                                }
                                                className={cn(
                                                    "py-2 px-3 rounded-md text-sm font-medium transition-all",
                                                    formData.carType === CAR_TYPE_CATEGORIES.NORMAL
                                                        ? "bg-white dark:bg-theme-blue text-theme-blue dark:text-white shadow-sm font-bold"
                                                        : "text-slate-500 dark:text-[#92adc9] hover:bg-white/10"
                                                )}
                                            >
                                                {BOOKING_STRINGS.VEHICLE_NORMAL}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        carType: CAR_TYPE_CATEGORIES.PREMIUM,
                                                    }))
                                                }
                                                className={cn(
                                                    "py-2 px-3 rounded-md text-sm font-medium transition-all",
                                                    formData.carType === CAR_TYPE_CATEGORIES.PREMIUM
                                                        ? "bg-white dark:bg-theme-blue text-theme-blue dark:text-white shadow-sm font-bold"
                                                        : "text-slate-500 dark:text-[#92adc9] hover:bg-white/10"
                                                )}
                                            >
                                                {BOOKING_STRINGS.VEHICLE_PREMIUM}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        carType: CAR_TYPE_CATEGORIES.LUXURY,
                                                    }))
                                                }
                                                className={cn(
                                                    "py-2 px-3 rounded-md text-sm font-medium transition-all",
                                                    formData.carType === CAR_TYPE_CATEGORIES.LUXURY
                                                        ? "bg-white dark:bg-theme-blue text-theme-blue dark:text-white shadow-sm font-bold"
                                                        : "text-slate-500 dark:text-[#92adc9] hover:bg-white/10"
                                                )}
                                            >
                                                {BOOKING_STRINGS.VEHICLE_LUXURY}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        carType: CAR_TYPE_CATEGORIES.SPORTS,
                                                    }))
                                                }
                                                className={cn(
                                                    "py-2 px-3 rounded-md text-sm font-medium transition-all",
                                                    formData.carType === CAR_TYPE_CATEGORIES.SPORTS
                                                        ? "bg-white dark:bg-theme-blue text-theme-blue dark:text-white shadow-sm font-bold"
                                                        : "text-slate-500 dark:text-[#92adc9] hover:bg-white/10"
                                                )}
                                            >
                                                {BOOKING_STRINGS.VEHICLE_SPORTS}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Trip Logistics */}
                    <div className="flex flex-col gap-8">
                        <section className="bg-white dark:bg-[#192633] rounded-xl p-6 border border-slate-200 dark:border-[#233648] shadow-sm flex flex-col h-full">
                            <div className="flex items-center gap-2 mb-6">
                                <MapPin className="size-5 text-theme-blue" />
                                <h2 className={sectionTitleClass}>
                                    {BOOKING_STRINGS.TRIP_LOGISTICS}
                                </h2>
                            </div>
                            <div className="flex flex-col gap-6">
                                {/* Pickup */}
                                <div className="relative pl-8 border-l-2 border-dashed border-theme-blue/30">
                                    <div className="absolute -left-[11px] top-0 bg-theme-blue text-white rounded-full p-1 leading-[0]">
                                        <MapPin className="size-3.5" />
                                    </div>
                                    <div className="flex flex-col gap-4">
                                        <label className="flex flex-col">
                                            <p className={labelClass}>
                                                {BOOKING_STRINGS.LOCATION}
                                            </p>
                                            <PlacesAutocomplete
                                                value={formData.pickupLocationSearch}
                                                onChange={handlePickupPlaceSelect}
                                                placeholder={
                                                    BOOKING_STRINGS.LOCATION_PLACEHOLDER_PICKUP
                                                }
                                                required
                                                disabled={isSubmitting}
                                                onError={(err) => setError(err)}
                                                className={cn(
                                                    inputBaseClass,
                                                    "pl-10"
                                                )}
                                            />
                                        </label>
                                        <label className="flex flex-col">
                                            <p className={labelClass}>
                                                {BOOKING_STRINGS.PICKUP_ADDRESS}
                                            </p>
                                            <input
                                                type="text"
                                                name="pickupAddress"
                                                value={formData.pickupAddress}
                                                onChange={handleChange}
                                                placeholder={
                                                    BOOKING_STRINGS.PICKUP_ADDRESS_PLACEHOLDER
                                                }
                                                required
                                                className={inputBaseClass}
                                                disabled={isSubmitting}
                                            />
                                        </label>
                                        <label className="flex flex-col">
                                            <p className={labelClass}>
                                                {BOOKING_STRINGS.NOTE_SPECIAL_INSTRUCTIONS}
                                            </p>
                                            <input
                                                type="text"
                                                name="pickupLocationNote"
                                                value={formData.pickupLocationNote}
                                                onChange={handleChange}
                                                placeholder={
                                                    BOOKING_STRINGS.NOTE_PICKUP_PLACEHOLDER
                                                }
                                                className={inputBaseClass}
                                                disabled={isSubmitting}
                                            />
                                        </label>
                                    </div>
                                </div>
                                {/* Destination */}
                                <div className="relative pl-8">
                                    <div className="absolute -left-[11px] top-0 bg-slate-400 dark:bg-slate-600 text-white rounded-full p-1 leading-[0]">
                                        <Flag className="size-3.5" />
                                    </div>
                                    <div className="flex flex-col gap-4">
                                        <label className="flex flex-col">
                                            <p className={labelClass}>
                                                {BOOKING_STRINGS.LOCATION}
                                            </p>
                                            <PlacesAutocomplete
                                                value={formData.destinationLocationSearch}
                                                onChange={handleDestinationPlaceSelect}
                                                placeholder={
                                                    BOOKING_STRINGS.LOCATION_PLACEHOLDER_DESTINATION
                                                }
                                                required
                                                disabled={isSubmitting}
                                                onError={(err) => setError(err)}
                                                className={cn(
                                                    inputBaseClass,
                                                    "pl-10"
                                                )}
                                            />
                                        </label>
                                        <label className="flex flex-col">
                                            <p className={labelClass}>
                                                {BOOKING_STRINGS.DESTINATION_ADDRESS}
                                            </p>
                                            <input
                                                type="text"
                                                name="destinationAddress"
                                                value={formData.destinationAddress}
                                                onChange={handleChange}
                                                placeholder={
                                                    BOOKING_STRINGS.DESTINATION_ADDRESS_PLACEHOLDER
                                                }
                                                required
                                                className={inputBaseClass}
                                                disabled={isSubmitting}
                                            />
                                        </label>
                                        <label className="flex flex-col">
                                            <p className={labelClass}>
                                                {BOOKING_STRINGS.NOTE_SPECIAL_INSTRUCTIONS}
                                            </p>
                                            <input
                                                type="text"
                                                name="destinationNote"
                                                value={formData.destinationNote}
                                                onChange={handleChange}
                                                placeholder={
                                                    BOOKING_STRINGS.NOTE_DESTINATION_PLACEHOLDER
                                                }
                                                className={inputBaseClass}
                                                disabled={isSubmitting}
                                            />
                                        </label>
                                    </div>
                                </div>
                                {/* Mini Map Preview */}
                                <div className="mt-4 rounded-lg overflow-hidden border border-slate-200 dark:border-[#324d67] h-40 relative group">
                                    <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 flex items-center justify-center bg-center bg-cover">
                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                                        <span className="relative z-10 px-4 py-2 bg-white/90 dark:bg-[#111a22]/90 rounded-full text-xs font-bold shadow-lg">
                                            {BOOKING_STRINGS.MAP_PREVIEW}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>

                {/* Operational Details */}
                <section className="bg-white dark:bg-[#192633] rounded-xl p-6 border border-slate-200 dark:border-[#233648] shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <Settings className="size-5 text-theme-blue" />
                        <h2 className={sectionTitleClass}>
                            {BOOKING_STRINGS.OPERATIONAL_DETAILS}
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <label className="flex flex-col">
                            <p className={labelClass}>
                                {BOOKING_STRINGS.FRANCHISE_OFFICE}
                            </p>
                            <select
                                required
                                name="franchiseId"
                                value={formData.franchiseId}
                                onChange={handleChange}
                                className={inputBaseClass}
                                disabled={isSubmitting || loadingFranchises}
                            >
                                <option value="">
                                    {loadingFranchises
                                        ? BOOKING_STRINGS.LOADING_FRANCHISES
                                        : BOOKING_STRINGS.SELECT_FRANCHISE}
                                </option>
                                {activeFranchises.map((f) => (
                                    <option key={f.id} value={f.id}>
                                        {f.code} - {f.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="flex flex-col">
                            <p className={labelClass}>
                                {BOOKING_STRINGS.TRIP_TYPE}
                            </p>
                            <select
                                required
                                name="tripType"
                                value={formData.tripType}
                                onChange={handleChange}
                                className={inputBaseClass}
                                disabled={isSubmitting || loadingTripTypes}
                            >
                                <option value="">
                                    {loadingTripTypes 
                                        ? "Loading trip types..." 
                                        : BOOKING_STRINGS.SELECT_TRIP_TYPE}
                                </option>
                                {filteredTripTypes.map((t) => (
                                    <option key={t.id} value={t.name}>
                                        {t.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="flex flex-col">
                            <p className={labelClass}>
                                {BOOKING_STRINGS.SCHEDULED_DATE}
                            </p>
                            <div className="relative">
                                <Calendar className="absolute right-3 top-3 size-4 text-slate-400 pointer-events-none" />
                                <input
                                    required
                                    type="date"
                                    name="tripDate"
                                    value={formData.tripDate}
                                    onChange={handleChange}
                                    min={new Date().toISOString().split("T")[0]}
                                    className={inputBaseClass}
                                    disabled={isSubmitting}
                                />
                            </div>
                        </label>
                        <label className="flex flex-col">
                            <p className={labelClass}>
                                {BOOKING_STRINGS.SCHEDULED_TIME}
                            </p>
                            <div className="relative">
                                <Clock className="absolute right-3 top-3 size-4 text-slate-400 pointer-events-none" />
                                <input
                                    required
                                    type="time"
                                    name="tripTime"
                                    value={formData.tripTime}
                                    onChange={handleChange}
                                    className={inputBaseClass}
                                    disabled={isSubmitting}
                                />
                            </div>
                        </label>
                    </div>
                </section>

                {/* Form Footer */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 py-6 border-t border-slate-200 dark:border-[#233648]">
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                            type="checkbox"
                            name="isDetailsReconfirmed"
                            checked={formData.isDetailsReconfirmed}
                            onChange={handleChange}
                            className="w-5 h-5 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-theme-blue focus:ring-theme-blue focus:ring-offset-background-dark"
                        />
                        <span className="text-slate-700 dark:text-white text-sm font-medium group-hover:text-theme-blue transition-colors">
                            {BOOKING_STRINGS.DETAILS_RECONFIRMED}
                        </span>
                    </label>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={resetForm}
                            className="flex-1 sm:flex-none px-5 py-2.5 rounded-lg bg-slate-200 dark:bg-[#233648] text-slate-700 dark:text-white font-semibold text-sm hover:bg-slate-300 dark:hover:bg-[#324d67] transition-all"
                        >
                            {BOOKING_STRINGS.CANCEL}
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 sm:flex-none px-5 py-2.5 rounded-lg bg-theme-blue text-white font-semibold text-sm hover:brightness-110 shadow-md shadow-theme-blue/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    {BOOKING_STRINGS.CREATING}
                                </>
                            ) : (
                                <>
                                    <Zap className="size-4" />
                                    {BOOKING_STRINGS.BOOK_TRIP_NOW}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>

            {/* Driver Assignment (after trip created) */}
            {createdTripId && !driverAssigned && (
                <div className="bg-white dark:bg-[#192633] rounded-xl border border-slate-200 dark:border-[#233648] shadow-sm p-6 animate-in fade-in duration-500">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <UserPlus className="size-6 text-theme-blue" />
                                Assign Driver to Trip
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-[#92adc9] mt-1">
                                Select a driver from the selected franchise
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleSkipAssignment}
                            className="px-4 py-2 text-sm text-slate-500 dark:text-[#92adc9] hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#324d67] rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                        >
                            Skip for Now
                        </button>
                    </div>
                    {loadingDrivers ? (
                        <div className="text-center py-12">
                            <Loader2 className="size-8 animate-spin text-theme-blue mx-auto mb-4" />
                            <p className="text-slate-500 dark:text-[#92adc9]">
                                Loading available drivers...
                            </p>
                        </div>
                    ) : availableDrivers.length === 0 ? (
                        <div className="text-center py-12">
                            <AlertCircle className="size-8 text-slate-400 mx-auto mb-4" />
                            <p className="text-slate-600 dark:text-slate-300 font-medium">
                                No active drivers available in this franchise
                            </p>
                            <p className="text-sm text-slate-500 dark:text-[#92adc9] mt-2">
                                You can assign a driver later from the unassigned
                                trips list
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {availableDrivers.map((driver) => (
                                <div
                                    key={driver.id}
                                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-[#233648] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    <div className="flex items-center gap-4 flex-1">
                                        <PerformanceBadge
                                            category={driver.performanceStatus}
                                            size="sm"
                                        />
                                        <div className="flex-1">
                                            <p className="font-medium text-sm text-slate-900 dark:text-white">
                                                {driver.name}
                                            </p>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-[#92adc9]">
                                                    <Phone className="size-3" />
                                                    {driver.phone}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleAssignDriver(driver.id)}
                                        disabled={assigningDriver === driver.id}
                                        className="px-4 py-2 bg-theme-blue text-white rounded-lg text-sm font-medium hover:bg-theme-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                                    >
                                        {assigningDriver === driver.id ? (
                                            <>
                                                <Loader2 className="size-4 animate-spin" />
                                                Assigning...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="size-4" />
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

            {driverAssigned && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="text-green-600 dark:text-green-400 size-6" />
                        <div>
                            <p className="text-green-800 dark:text-green-300 font-bold">
                                Driver assigned successfully!
                            </p>
                            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                                The trip has been created and assigned to the
                                selected driver.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
