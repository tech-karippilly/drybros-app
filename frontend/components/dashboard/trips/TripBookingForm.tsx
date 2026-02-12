"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { createTripPhase1 } from "@/lib/features/trip/tripApi";
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
    Zap,
    Loader2,
    CheckCircle,
    AlertCircle,
    ChevronRight,
    Navigation,
    Flag,
} from "lucide-react";
import {
    CAR_GEAR_TYPES,
    CAR_TYPE_CATEGORIES,
    BOOKING_STRINGS,
} from "@/lib/constants";
import { DASHBOARD_ROUTES } from "@/lib/constants/routes";

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { TripMap } from "./TripMap";

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

export function TripBookingForm() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { selectedFranchise } = useAppSelector((state) => state.franchise);
    const { list: tripTypes } = useAppSelector((state) => state.tripType);
    const { user } = useAppSelector((state) => state.auth);

    // Get current date and time
    const getCurrentDate = () => {
        const now = new Date();
        return now.toISOString().split("T")[0];
    };

    const getCurrentTime = () => {
        const now = new Date();
        return now.toTimeString().slice(0, 5);
    };

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
        tripDate: getCurrentDate(),
        tripTime: getCurrentTime(),
        isDetailsReconfirmed: false,
        isFareDiscussed: false,
        isPriceAccepted: false,
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
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

    const resetForm = () => {
        setFormData({
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
            franchiseId: formData.franchiseId,
            tripType: "",
            carGearType: CAR_GEAR_TYPES.AUTOMATIC,
            carType: CAR_TYPE_CATEGORIES.NORMAL,
            tripDate: getCurrentDate(),
            tripTime: getCurrentTime(),
            isDetailsReconfirmed: false,
            isFareDiscussed: false,
            isPriceAccepted: false,
        });
        setSuccess(null);
    };

    const handleSaveDraft = () => {
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
        <div className="max-w-[1400px] mx-auto animate-in fade-in duration-700 pb-24">
            {/* Simple Header */}
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                    <Link href={DASHBOARD_ROUTES.HOME} className="text-sm hover:text-foreground transition-colors">{BOOKING_STRINGS.BREADCRUMB_DASHBOARD}</Link>
                    <ChevronRight className="size-4" />
                    <Link href={DASHBOARD_ROUTES.TRIPS} className="text-sm hover:text-foreground transition-colors">{BOOKING_STRINGS.BREADCRUMB_TRIPS}</Link>
                    <ChevronRight className="size-4" />
                    <span className="text-sm font-medium text-foreground">{BOOKING_STRINGS.BREADCRUMB_BOOK}</span>
                </div>
                <h1 className="text-2xl font-bold">{BOOKING_STRINGS.PAGE_TITLE}</h1>
                <p className="text-muted-foreground">{BOOKING_STRINGS.PAGE_SUBTITLE}</p>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg mb-6 flex items-start gap-3 shadow-sm animate-in slide-in-from-top-2">
                    <div className="p-1 bg-red-100 rounded-full">
                        <AlertCircle className="size-4 text-red-600" />
                    </div>
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
            )}
            {success && (
                <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg mb-6 flex items-start gap-3 shadow-sm animate-in slide-in-from-top-2">
                    <div className="p-1 bg-green-100 rounded-full">
                        <CheckCircle className="size-4 text-green-600" />
                    </div>
                    <p className="text-sm text-green-700 font-medium">{success}</p>
                </div>
            )}



            <form onSubmit={handleSubmit} className="relative">
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    {/* Left Side: Form Sections */}
                    <div className="xl:col-span-8 flex flex-col gap-6">
                        {/* Customer Details Card */}
                        <Card className="border-0 shadow-sm">
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <User className="size-5 text-primary" />
                                    {BOOKING_STRINGS.CUSTOMER_INFO}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="customerName">
                                        {BOOKING_STRINGS.CUSTOMER_FULL_NAME} <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="customerName"
                                        required
                                        name="customerName"
                                        value={formData.customerName}
                                        onChange={handleChange}
                                        placeholder={BOOKING_STRINGS.CUSTOMER_FULL_NAME_PLACEHOLDER}
                                        disabled={isSubmitting}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="customerPhone">
                                        {BOOKING_STRINGS.PHONE_NUMBER} <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="customerPhone"
                                        required
                                        type="tel"
                                        name="customerPhone"
                                        value={formData.customerPhone}
                                        onChange={handleChange}
                                        placeholder={BOOKING_STRINGS.PHONE_PLACEHOLDER}
                                        disabled={isSubmitting}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="customerEmail">{BOOKING_STRINGS.EMAIL_ADDRESS}</Label>
                                    <Input
                                        id="customerEmail"
                                        type="email"
                                        name="customerEmail"
                                        value={formData.customerEmail}
                                        onChange={handleChange}
                                        placeholder={BOOKING_STRINGS.EMAIL_PLACEHOLDER}
                                        disabled={isSubmitting}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="alternatePhone">{BOOKING_STRINGS.ALTERNATE_PHONE}</Label>
                                    <Input
                                        id="alternatePhone"
                                        type="tel"
                                        name="alternatePhone"
                                        placeholder="Alternate Phone"
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Trip Route Card */}
                        <Card className="border-0 shadow-sm">
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <MapPin className="size-5 text-primary" />
                                    {BOOKING_STRINGS.TRIP_ROUTE}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Pickup Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-green-600 font-medium">
                                        <Navigation className="size-4" />
                                        Pickup Location
                                    </div>
                                    
                                    {/* Pickup Location - For Lat/Lng */}
                                    <div className="space-y-2">
                                        <Label>
                                            Search Location <span className="text-red-500">*</span>
                                            <span className="text-xs text-muted-foreground font-normal ml-2">(Select to get coordinates)</span>
                                        </Label>
                                        <PlacesAutocomplete
                                            value={formData.pickupLocationSearch}
                                            onChange={handlePickupPlaceSelect}
                                            placeholder="Search for pickup location..."
                                            required
                                            disabled={isSubmitting}
                                            onError={setError}
                                        />
                                    </div>
                                    
                                    {/* Pickup Address */}
                                    <div className="space-y-2">
                                        <Label htmlFor="pickupAddress">
                                            Address <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="pickupAddress"
                                            name="pickupAddress"
                                            value={formData.pickupAddress}
                                            onChange={handleChange}
                                            placeholder="Enter complete address"
                                            required
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                    
                                    {/* Pickup Notes - Textarea */}
                                    <div className="space-y-2">
                                        <Label htmlFor="pickupLocationNote">
                                            Location Details
                                            <span className="text-xs text-muted-foreground font-normal ml-2">(Landmarks, building name, floor, etc.)</span>
                                        </Label>
                                        <textarea
                                            id="pickupLocationNote"
                                            name="pickupLocationNote"
                                            value={formData.pickupLocationNote}
                                            onChange={handleChange}
                                            placeholder="e.g., Near HDFC Bank, 3rd Floor, Opposite City Mall..."
                                            disabled={isSubmitting}
                                            rows={3}
                                            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                                        />
                                    </div>
                                </div>

                                <div className="h-px bg-border" />

                                {/* Destination Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-red-600 font-medium">
                                        <Flag className="size-4" />
                                        Destination Location
                                    </div>
                                    
                                    {/* Destination Location - For Lat/Lng */}
                                    <div className="space-y-2">
                                        <Label>
                                            Search Location <span className="text-red-500">*</span>
                                            <span className="text-xs text-muted-foreground font-normal ml-2">(Select to get coordinates)</span>
                                        </Label>
                                        <PlacesAutocomplete
                                            value={formData.destinationLocationSearch}
                                            onChange={handleDestinationPlaceSelect}
                                            placeholder="Search for destination location..."
                                            required
                                            disabled={isSubmitting}
                                            onError={setError}
                                        />
                                    </div>
                                    
                                    {/* Destination Address */}
                                    <div className="space-y-2">
                                        <Label htmlFor="destinationAddress">
                                            Address <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="destinationAddress"
                                            name="destinationAddress"
                                            value={formData.destinationAddress}
                                            onChange={handleChange}
                                            placeholder="Enter complete address"
                                            required
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                    
                                    {/* Destination Notes - Textarea */}
                                    <div className="space-y-2">
                                        <Label htmlFor="destinationNote">
                                            Location Details
                                            <span className="text-xs text-muted-foreground font-normal ml-2">(Landmarks, building name, floor, etc.)</span>
                                        </Label>
                                        <textarea
                                            id="destinationNote"
                                            name="destinationNote"
                                            value={formData.destinationNote}
                                            onChange={handleChange}
                                            placeholder="e.g., Near HDFC Bank, 3rd Floor, Opposite City Mall..."
                                            disabled={isSubmitting}
                                            rows={3}
                                            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Car Details Card */}
                        <Card className="border-0 shadow-sm">
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Car className="size-5 text-primary" />
                                    {BOOKING_STRINGS.CAR_DETAILS}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="carModel">{BOOKING_STRINGS.CAR_MODEL_NAME}</Label>
                                    <Input
                                        id="carModel"
                                        name="carModel"
                                        value={formData.carModel}
                                        onChange={handleChange}
                                        placeholder={BOOKING_STRINGS.CAR_MODEL_PLACEHOLDER}
                                        disabled={isSubmitting}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="carGearType">{BOOKING_STRINGS.TRANSMISSION_TYPE}</Label>
                                    <Select
                                        id="carGearType"
                                        name="carGearType"
                                        value={formData.carGearType}
                                        onChange={handleChange}
                                        disabled={isSubmitting}
                                    >
                                        <option value={CAR_GEAR_TYPES.AUTOMATIC}>{BOOKING_STRINGS.TRANSMISSION_AUTOMATIC}</option>
                                        <option value={CAR_GEAR_TYPES.MANUAL}>{BOOKING_STRINGS.TRANSMISSION_MANUAL}</option>
                                        <option value={CAR_GEAR_TYPES.EV}>{BOOKING_STRINGS.TRANSMISSION_EV}</option>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="carType">{BOOKING_STRINGS.VEHICLE_CATEGORY}</Label>
                                    <Select
                                        id="carType"
                                        name="carType"
                                        value={formData.carType}
                                        onChange={handleChange}
                                        disabled={isSubmitting}
                                    >
                                        <option value={CAR_TYPE_CATEGORIES.NORMAL}>{BOOKING_STRINGS.VEHICLE_NORMAL}</option>
                                        <option value={CAR_TYPE_CATEGORIES.PREMIUM}>{BOOKING_STRINGS.VEHICLE_PREMIUM}</option>
                                        <option value={CAR_TYPE_CATEGORIES.LUXURY}>{BOOKING_STRINGS.VEHICLE_LUXURY}</option>
                                        <option value={CAR_TYPE_CATEGORIES.SPORTS}>{BOOKING_STRINGS.VEHICLE_SPORTS}</option>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Operation Details Card */}
                        <Card className="border-0 shadow-sm">
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Settings className="size-5 text-primary" />
                                    {BOOKING_STRINGS.OPERATIONAL_DETAILS}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="franchiseId">
                                        {BOOKING_STRINGS.FRANCHISE_OFFICE} <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        id="franchiseId"
                                        required
                                        name="franchiseId"
                                        value={formData.franchiseId}
                                        onChange={handleChange}
                                        disabled={isSubmitting || loadingFranchises}
                                    >
                                        <option value="">{loadingFranchises ? BOOKING_STRINGS.LOADING_FRANCHISES : BOOKING_STRINGS.SELECT_FRANCHISE}</option>
                                        {activeFranchises.map((f) => (<option key={f.id} value={f.id}>{f.code} - {f.name}</option>))}
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tripType">
                                        {BOOKING_STRINGS.TRIP_TYPE} <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        id="tripType"
                                        required
                                        name="tripType"
                                        value={formData.tripType}
                                        onChange={handleChange}
                                        disabled={isSubmitting || loadingTripTypes}
                                    >
                                        <option value="">{loadingTripTypes ? "Loading trip types..." : BOOKING_STRINGS.SELECT_TRIP_TYPE}</option>
                                        {filteredTripTypes.map((t) => (<option key={t.id} value={t.name}>{t.name}</option>))}
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tripDate">
                                        {BOOKING_STRINGS.SCHEDULED_DATE} <span className="text-red-500">*</span>
                                    </Label>
                                    <input
                                        id="tripDate"
                                        required
                                        type="date"
                                        name="tripDate"
                                        value={formData.tripDate}
                                        onChange={handleChange}
                                        min={new Date().toISOString().split("T")[0]}
                                        disabled={isSubmitting}
                                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tripTime">
                                        {BOOKING_STRINGS.SCHEDULED_TIME} <span className="text-red-500">*</span>
                                    </Label>
                                    <input
                                        id="tripTime"
                                        required
                                        type="time"
                                        name="tripTime"
                                        value={formData.tripTime}
                                        onChange={handleChange}
                                        disabled={isSubmitting}
                                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Confirmation */}
                        <div className="flex justify-end">
                            <label className="flex items-center gap-3 cursor-pointer p-4 rounded-lg hover:bg-muted/50 transition-colors">
                                <input
                                    type="checkbox"
                                    name="isDetailsReconfirmed"
                                    checked={formData.isDetailsReconfirmed}
                                    onChange={handleChange}
                                    className="w-5 h-5 rounded border-input bg-background text-primary focus:ring-primary"
                                />
                                <span className="text-sm font-medium">{BOOKING_STRINGS.DETAILS_RECONFIRMED}</span>
                            </label>
                        </div>
                    </div>

                    {/* Right Side: Map Preview */}
                    <div className="xl:col-span-4">
                        <div className="sticky top-6 space-y-4">
                            {/* Map Card */}
                            <Card className="border-0 shadow-sm">
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <MapPin className="size-4 text-primary" />
                                        Route Preview
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="w-full h-[300px] bg-muted/20">
                                        {(formData.pickupLat && formData.pickupLng && formData.destinationLat && formData.destinationLng) ? (
                                            <TripMap
                                                pickupLat={formData.pickupLat}
                                                pickupLng={formData.pickupLng}
                                                dropLat={formData.destinationLat}
                                                dropLng={formData.destinationLng}
                                                pickupLocation={formData.pickupAddress || formData.pickupLocationSearch}
                                                dropLocation={formData.destinationAddress || formData.destinationLocationSearch}
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground p-6">
                                                <MapPin className="size-8 opacity-30" />
                                                <span className="text-sm font-medium">{BOOKING_STRINGS.MAP_PREVIEW}</span>
                                                <p className="text-xs text-center">Enter pickup and destination locations to view the route</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Quick Info */}
                            {(formData.pickupAddress || formData.destinationAddress) && (
                                <Card className="bg-muted/30 border-0">
                                    <CardContent className="p-4 space-y-3">
                                        {formData.pickupAddress && (
                                            <div className="flex items-start gap-2">
                                                <Navigation className="size-4 text-green-600 mt-0.5 shrink-0" />
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Pickup</p>
                                                    <p className="text-sm font-medium line-clamp-2">{formData.pickupAddress}</p>
                                                </div>
                                            </div>
                                        )}
                                        {formData.destinationAddress && (
                                            <div className="flex items-start gap-2">
                                                <Flag className="size-4 text-red-600 mt-0.5 shrink-0" />
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Destination</p>
                                                    <p className="text-sm font-medium line-clamp-2">{formData.destinationAddress}</p>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sticky Bottom Action Bar */}
                <div className="fixed bottom-0 left-0 lg:left-64 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 flex justify-end gap-4 z-40">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={resetForm}
                        disabled={isSubmitting}
                    >
                        {BOOKING_STRINGS.CANCEL}
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="min-w-[140px]"
                    >
                        {isSubmitting ? (
                            <><Loader2 className="mr-2 size-4 animate-spin" />{BOOKING_STRINGS.CREATING}</>
                        ) : (
                            <><Zap className="mr-2 size-4" />{BOOKING_STRINGS.BOOK_TRIP_NOW}</>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
