"use client";

import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, CheckCircle, Loader2, MapPin, Search, Send, Navigation, CircleDot, CircleOff, RefreshCw, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { DASHBOARD_ROUTES } from "@/lib/constants/routes";
import { REQUEST_DRIVERS_STRINGS } from "@/lib/constants/trips";
import { getTripById, requestTripDrivers, getAvailableDriversForTrip, TripResponse } from "@/lib/features/trip/tripApi";
import type { AvailableDriver } from "@/lib/types/driver";
import { useSocket } from "@/lib/hooks/useSocket";
import { SOCKET_EVENTS } from "@/lib/constants/socket";

/**
 * Calculate time remaining for an offer (in seconds)
 */
function calculateOfferTimeRemaining(offeredAt: Date): number {
    const OFFER_TTL_MS = 5 * 60 * 1000; // 5 minutes
    const elapsed = Date.now() - offeredAt.getTime();
    const remaining = OFFER_TTL_MS - elapsed;
    return Math.max(0, Math.ceil(remaining / 1000));
}

/**
 * Format time remaining in MM:SS format
 */
function formatTimeRemaining(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
}

/**
 * Format distance for display
 */
function formatDistance(distanceKm: number | null | undefined): string {
    if (distanceKm === null || distanceKm === undefined) return "Distance unknown";
    if (distanceKm < 1) {
        return `${Math.round(distanceKm * 1000)} m away`;
    }
    return `${distanceKm.toFixed(1)} km away`;
}

/**
 * Get distance color based on proximity
 */
function getDistanceColor(distanceKm: number | null | undefined): string {
    if (distanceKm === null || distanceKm === undefined) return "text-slate-400";
    if (distanceKm < 2) return "text-green-600 dark:text-green-400";
    if (distanceKm < 5) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
}

interface RequestDriversScreenProps {
    tripId: string;
}

function formatDateTime(d: Date | string | null): { date: string; time: string } {
    if (!d) return { date: REQUEST_DRIVERS_STRINGS.PLACEHOLDER_DASH, time: REQUEST_DRIVERS_STRINGS.PLACEHOLDER_DASH };
    const dt = new Date(d);
    return {
        date: new Intl.DateTimeFormat(undefined, {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }).format(dt),
        time: new Intl.DateTimeFormat(undefined, {
            hour: "2-digit",
            minute: "2-digit",
        }).format(dt),
    };
}

function formatRequestedCount(count: number): string {
    return REQUEST_DRIVERS_STRINGS.REQUESTED_COUNT_TEMPLATE.replace("{count}", String(count));
}

export function RequestDriversScreen({ tripId }: RequestDriversScreenProps) {
    const router = useRouter();
    const [trip, setTrip] = useState<TripResponse | null>(null);
    const [drivers, setDrivers] = useState<AvailableDriver[]>([]);
    const [loadingTrip, setLoadingTrip] = useState(true);
    const [loadingDrivers, setLoadingDrivers] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [requestingAll, setRequestingAll] = useState(false);
    const [requestingDriverId, setRequestingDriverId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [rejectedDriverIds, setRejectedDriverIds] = useState<Set<string>>(new Set());
    const [acceptedDriverId, setAcceptedDriverId] = useState<string | null>(null);
    const [tripStatus, setTripStatus] = useState<string | null>(null);
    const [socketConnected, setSocketConnected] = useState(false);
    const [offeredDriverIds, setOfferedDriverIds] = useState<Map<string, Date>>(new Map());
    const [autoRedirectTimer, setAutoRedirectTimer] = useState<number | null>(null);
    const [, setOfferTimerTick] = useState(0); // Force re-render for offer timers
    const autoRedirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const tripStatusCheckRef = useRef<NodeJS.Timeout | null>(null);
    const offerTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Setup socket connection and listeners
    const { joinRoom, leaveRoom, isConnected, socket } = useSocket({
        [SOCKET_EVENTS.CONNECT]: () => {
            console.log("🔌 Socket connected with tripId:", tripId);
            setSocketConnected(true);
        },
        [SOCKET_EVENTS.DISCONNECT]: () => {
            console.log("🔌 Socket disconnected");
            setSocketConnected(false);
        },
        [SOCKET_EVENTS.TRIP_REQUEST_ACCEPT]: (payload: { tripId: string; driverId: string; status: string; acceptedAt: string }) => {
            console.log("🎯 Trip request accepted by driver:", payload);
            if (payload.tripId === tripId) {
                setAcceptedDriverId(payload.driverId);
                setTripStatus("ACCEPTED");
                
                // Find driver name
                const driver = drivers.find(d => d.id === payload.driverId);
                const driverName = driver ? `${driver.firstName} ${driver.lastName}` : "Driver";
                setSuccess(`✅ ${driverName} accepted the trip!`);
                
                // Disconnect socket and redirect to trip details
                setTimeout(() => {
                    console.log("🔌 Disconnecting socket and redirecting to trip details");
                    leaveRoom(`trip:${tripId}`);
                    if (socket) {
                        socket.disconnect();
                    }
                    router.push(`${DASHBOARD_ROUTES.TRIPS}/${tripId}`);
                }, 1500);
            }
        },
        [SOCKET_EVENTS.TRIP_REQUEST_REJECT]: (payload: { tripId: string; driverId: string; status: string; rejectedAt: string }) => {
            console.log("❌ Trip request rejected by driver:", payload);
            if (payload.tripId === tripId) {
                setRejectedDriverIds(prev => new Set(prev).add(payload.driverId));
                
                // Find driver name
                const driver = drivers.find(d => d.id === payload.driverId);
                if (driver) {
                    setError(`❌ ${driver.firstName} ${driver.lastName} rejected the trip`);
                    // Clear error after 5 seconds
                    setTimeout(() => setError(null), 5000);
                }
            }
        },
        [SOCKET_EVENTS.TRIP_OFFER]: (payload: { tripId: string; driverId: string; offeredAt: string }) => {
            console.log("📤 Trip offer sent:", payload);
            if (payload.tripId === tripId) {
                console.log("Trip offer sent to driver:", payload.driverId);
                // Track which drivers have been offered
                setOfferedDriverIds(prev => new Map(prev).set(payload.driverId, new Date(payload.offeredAt)));
            }
        },
    }, [tripId, drivers, router]);

    // Cleanup timers on unmount
    useEffect(() => {
        return () => {
            if (autoRedirectTimeoutRef.current) {
                clearTimeout(autoRedirectTimeoutRef.current);
            }
            if (tripStatusCheckRef.current) {
                clearInterval(tripStatusCheckRef.current);
            }
            if (offerTimerRef.current) {
                clearInterval(offerTimerRef.current);
            }
        };
    }, []);

    // Update offer timers every second
    useEffect(() => {
        if (offeredDriverIds.size === 0) return;

        offerTimerRef.current = setInterval(() => {
            setOfferTimerTick(prev => prev + 1);
        }, 1000);

        return () => {
            if (offerTimerRef.current) {
                clearInterval(offerTimerRef.current);
            }
        };
    }, [offeredDriverIds.size]);

    // Background check for trip status every 5 seconds
    useEffect(() => {
        if (!tripId || acceptedDriverId) return;

        const checkTripStatus = async () => {
            try {
                const tripData = await getTripById(tripId);
                
                // Check if trip has been assigned
                if (tripData.driverId && tripData.status === "ASSIGNED") {
                    setTripStatus("ASSIGNED");
                    setSuccess(`✅ Trip assigned to driver!`);
                    
                    // Redirect to trip details
                    setTimeout(() => {
                        leaveRoom(`trip:${tripId}`);
                        if (socket) {
                            socket.disconnect();
                        }
                        router.push(`${DASHBOARD_ROUTES.TRIPS}/${tripId}`);
                    }, 1500);
                }
            } catch (err) {
                console.error("Error checking trip status:", err);
            }
        };

        // Check immediately
        checkTripStatus();

        // Then check every 5 seconds
        tripStatusCheckRef.current = setInterval(checkTripStatus, 5000);

        return () => {
            if (tripStatusCheckRef.current) {
                clearInterval(tripStatusCheckRef.current);
            }
        };
    }, [tripId, acceptedDriverId, router, socket, leaveRoom]);

    // Auto-redirect timeout: if no acceptance in 10 minutes, redirect to manual assign
    useEffect(() => {
        if (!tripId || acceptedDriverId) return;

        const TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
        const startTime = Date.now();

        // Update countdown every second
        const countdownInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, TIMEOUT_MS - elapsed);
            setAutoRedirectTimer(Math.ceil(remaining / 1000));

            if (remaining <= 0) {
                clearInterval(countdownInterval);
            }
        }, 1000);

        // Set timeout for redirect
        autoRedirectTimeoutRef.current = setTimeout(() => {
            if (!acceptedDriverId) {
                setError("⏱️ No driver accepted. Redirecting to manual assignment...");
                setTimeout(() => {
                    router.push(`${DASHBOARD_ROUTES.ASSIGN_DRIVER}/${tripId}`);
                }, 2000);
            }
        }, TIMEOUT_MS);

        return () => {
            clearInterval(countdownInterval);
            if (autoRedirectTimeoutRef.current) {
                clearTimeout(autoRedirectTimeoutRef.current);
            }
        };
    }, [tripId, acceptedDriverId, router]);

    // Join trip-specific room for real-time updates
    useEffect(() => {
        if (tripId) {
            console.log("🔌 Joining trip room:", `trip:${tripId}`);
            joinRoom(`trip:${tripId}`);
            
            return () => {
                console.log("🔌 Leaving trip room:", `trip:${tripId}`);
                leaveRoom(`trip:${tripId}`);
            };
        }
    }, [tripId, joinRoom, leaveRoom]);

    // Load drivers list
    const loadDrivers = useCallback(async () => {
        if (!tripId) {
            setLoadingDrivers(false);
            return;
        }
        
        try {
            setLoadingDrivers(true);
            const list = await getAvailableDriversForTrip(tripId);
            const mapped: AvailableDriver[] = (list || []).map((d: any) => {
                const perf = d.performance;
                return {
                    id: d.id,
                    firstName: d.firstName ?? "",
                    lastName: d.lastName ?? "",
                    phone: d.phone ?? "",
                    driverCode: d.driverCode ?? "",
                    status: d.status ?? "",
                    currentRating: d.currentRating ?? null,
                    performance: perf ?? {
                        category: "GREEN" as const,
                        score: 0,
                        rating: null,
                        complaintCount: 0,
                        totalTrips: 0,
                        completedTrips: 0,
                        rejectedTrips: 0, 
                        completionRate: 0,
                        rejectionRate: 0,
                    },
                    matchScore: d.matchScore ?? 0,
                    remainingDailyLimit: d.remainingDailyLimit ?? null,
                    checkedIn: d.checkedIn ?? false,
                    attendanceStatus: d.attendanceStatus ?? null,
                    // Distance fields from API
                    distanceKm: d.distanceKm,
                    driverLocation: d.driverLocation,
                    pickupLocation: d.pickupLocation,
                };
            });
            // Sort by distance (closest first), then by performance
            mapped.sort((a, b) => {
                // If both have distance, sort by distance
                if (a.distanceKm !== null && a.distanceKm !== undefined && 
                    b.distanceKm !== null && b.distanceKm !== undefined) {
                    return a.distanceKm - b.distanceKm;
                }
                // If only one has distance, prioritize the one with distance
                if (a.distanceKm !== null && a.distanceKm !== undefined) return -1;
                if (b.distanceKm !== null && b.distanceKm !== undefined) return 1;
                // Fall back to performance score
                return (b.performance?.score ?? 0) - (a.performance?.score ?? 0);
            });
            setDrivers(mapped);
        } catch (err) {
            setDrivers([]);
        } finally {
            setLoadingDrivers(false);
        }
    }, [tripId]);

    useEffect(() => {
        loadDrivers();
    }, [loadDrivers]);

    // Refresh handler
    const handleRefresh = async () => {
        setRefreshing(true);
        await Promise.all([loadTrip(), loadDrivers()]);
        setRefreshing(false);
    };

    const filteredDrivers = useMemo(() => {
        if (!searchTerm.trim()) return drivers;
        const q = searchTerm.toLowerCase();

        console.log("drivers",drivers)
        return drivers.filter(
            (d) =>
                `${d.firstName} ${d.lastName}`.toLowerCase().includes(q) ||
                d.driverCode?.toLowerCase().includes(q) ||
                d.phone?.includes(searchTerm)
        );
    }, [drivers, searchTerm]);

    const { date: scheduledDate, time: scheduledTime } = formatDateTime(trip?.scheduledAt ?? null);

    const handleRequestAll = async () => {
        try {
            setError(null);
            setSuccess(null);
            setRequestingAll(true);
            const res = await requestTripDrivers(tripId, { mode: "ALL" });
            setSuccess(formatRequestedCount(res.requested));
        } catch (err: unknown) {
            const ex = err as { response?: { data?: { error?: string } }; message?: string };
            setError(ex?.response?.data?.error || ex?.message || REQUEST_DRIVERS_STRINGS.ERROR_REQUEST_DRIVERS);
        } finally {
            setRequestingAll(false);
        }
    };

    const handleRequestDriver = async (driverId: string) => {
        try {
            setError(null);
            setSuccess(null);
            setRequestingDriverId(driverId);
            const res = await requestTripDrivers(tripId, { mode: "SPECIFIC", driverId });
            setSuccess(formatRequestedCount(res.requested));
        } catch (err: unknown) {
            const ex = err as { response?: { data?: { error?: string } }; message?: string };
            setError(ex?.response?.data?.error || ex?.message || REQUEST_DRIVERS_STRINGS.ERROR_REQUEST_DRIVER);
        } finally {
            setRequestingDriverId(null);
        }
    };

    if (loadingTrip && !trip) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="size-10 animate-spin text-theme-blue" />
                <p className="text-slate-500 dark:text-slate-400">{REQUEST_DRIVERS_STRINGS.LOADING_TRIP}</p>
            </div>
        );
    }

    if (error && !trip) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6">
                <AlertCircle className="size-12 text-red-500" />
                <p className="text-red-600 dark:text-red-400 text-center">{error}</p>
                <Link
                    href={DASHBOARD_ROUTES.BOOKING}
                    className="px-4 py-2 bg-theme-blue text-white rounded-lg font-medium hover:bg-theme-blue/90"
                >
                    {REQUEST_DRIVERS_STRINGS.BACK_TO_BOOKING}
                </Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-5">
            <div className="flex flex-wrap justify-between items-end gap-4">
                <div className="flex items-center gap-4">
                    <Link
                        href={DASHBOARD_ROUTES.BOOKING}
                        className="p-2 text-slate-500 hover:text-theme-blue hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="size-6" />
                    </Link>
                    <div>
                        <h1 className="text-slate-900 dark:text-white text-3xl font-black leading-tight tracking-tight">
                            {REQUEST_DRIVERS_STRINGS.PAGE_TITLE}
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-base mt-0.5 flex items-center gap-2">
                            {REQUEST_DRIVERS_STRINGS.PAGE_SUBTITLE}
                            {socketConnected && (
                                <span className="inline-flex items-center gap-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
                                    <span className="size-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                    Live
                                </span>
                            )}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Auto-redirect timer */}
                    {autoRedirectTimer !== null && autoRedirectTimer > 0 && !acceptedDriverId && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm">
                            <Clock className="size-4 text-amber-600 dark:text-amber-400" />
                            <span className="text-amber-700 dark:text-amber-300 font-medium">
                                Auto-redirect in {Math.floor(autoRedirectTimer / 60)}:{String(autoRedirectTimer % 60).padStart(2, '0')}
                            </span>
                        </div>
                    )}
                    
                    {/* Refresh button */}
                    <button
                        type="button"
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="p-2 text-slate-500 dark:text-slate-400 hover:text-theme-blue hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
                        title="Refresh drivers list"
                    >
                        <RefreshCw className={cn("size-5", refreshing && "animate-spin")} />
                    </button>
                    
                    <button
                        type="button"
                        onClick={() => router.push(`${DASHBOARD_ROUTES.ASSIGN_DRIVER}/${tripId}`)}
                        className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        {REQUEST_DRIVERS_STRINGS.MANUAL_ASSIGN}
                    </button>
                    <button
                        type="button"
                        onClick={handleRequestAll}
                        disabled={requestingAll}
                        className="flex items-center justify-center rounded-lg h-10 px-4 bg-theme-blue text-white text-sm font-bold hover:bg-theme-blue/90 transition-all shadow-lg shadow-theme-blue/20 disabled:opacity-50 disabled:cursor-not-allowed gap-2"
                    >
                        {requestingAll ? (
                            <>
                                <Loader2 className="size-4 animate-spin" />
                                {REQUEST_DRIVERS_STRINGS.REQUESTING}
                            </>
                        ) : (
                            <>
                                <Send className="size-4" />
                                {REQUEST_DRIVERS_STRINGS.REQUEST_ALL}
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-[#192633] rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                <p className="text-sm text-slate-600 dark:text-slate-300">{REQUEST_DRIVERS_STRINGS.DISPATCH_NOTE}</p>
            </div>

            {/* Trip Request Status */}
            {(rejectedDriverIds.size > 0 || acceptedDriverId) && (
                <div className="bg-white dark:bg-[#192633] rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                        Trip Request Status
                    </h3>
                    <div className="flex flex-wrap gap-3">
                        {acceptedDriverId && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium">
                                <CheckCircle className="size-4" />
                                <span>1 driver accepted</span>
                            </div>
                        )}
                        {rejectedDriverIds.size > 0 && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm font-medium">
                                <AlertCircle className="size-4" />
                                <span>{rejectedDriverIds.size} driver{rejectedDriverIds.size > 1 ? 's' : ''} rejected</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-sm font-medium">
                            <Loader2 className="size-4" />
                            <span>{filteredDrivers.length - rejectedDriverIds.size - (acceptedDriverId ? 1 : 0)} drivers pending</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-[#192633] rounded-xl border border-slate-200 dark:border-slate-800 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-col gap-1">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            {REQUEST_DRIVERS_STRINGS.TRIP_DETAILS} #{tripId.slice(0, 8)}
                        </p>
                        <p className="text-sm text-slate-700 dark:text-slate-200 truncate">
                            <span className="font-semibold">{REQUEST_DRIVERS_STRINGS.PICKUP}:</span>{" "}
                            {trip?.pickupAddress || trip?.pickupLocation || REQUEST_DRIVERS_STRINGS.PLACEHOLDER_DASH}
                        </p>
                        <p className="text-sm text-slate-700 dark:text-slate-200 truncate">
                            <span className="font-semibold">{REQUEST_DRIVERS_STRINGS.DESTINATION}:</span>{" "}
                            {trip?.dropAddress || trip?.dropLocation || REQUEST_DRIVERS_STRINGS.PLACEHOLDER_DASH}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase">
                        <span className="bg-theme-blue/20 text-theme-blue px-3 py-1 rounded-full">
                            {REQUEST_DRIVERS_STRINGS.TIME}: {scheduledTime}
                        </span>
                        <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1 rounded-full">
                            {REQUEST_DRIVERS_STRINGS.DATE}: {scheduledDate}
                        </span>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-2">
                    <AlertCircle className="size-5 text-red-500 shrink-0" />
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
            )}

            {success && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-2">
                    <CheckCircle className="size-5 text-green-600 dark:text-green-400 shrink-0" />
                    <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
                </div>
            )}

            <div className="bg-white dark:bg-[#192633] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={REQUEST_DRIVERS_STRINGS.SEARCH_PLACEHOLDER}
                            className="w-full bg-slate-100 dark:bg-[#101922] border-none rounded-lg pl-10 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-theme-blue"
                        />
                    </div>
                </div>

                <div className="p-4">
                    <h2 className="text-slate-900 dark:text-white text-lg font-bold mb-3">
                        {REQUEST_DRIVERS_STRINGS.AVAILABLE_DRIVERS} ({filteredDrivers.length})
                    </h2>

                    {loadingDrivers ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-4">
                            <Loader2 className="size-10 animate-spin text-theme-blue" />
                            <p className="text-slate-500 dark:text-slate-400">{REQUEST_DRIVERS_STRINGS.LOADING_DRIVERS}</p>
                        </div>
                    ) : filteredDrivers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <AlertCircle className="size-10 text-slate-400" />
                            <p className="text-slate-600 dark:text-slate-300 font-medium">
                                {REQUEST_DRIVERS_STRINGS.NO_DRIVERS}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredDrivers.map((driver) => {
                                const isRejected = rejectedDriverIds.has(driver.id);
                                const isAccepted = acceptedDriverId === driver.id;
                                const isPending = !isRejected && !isAccepted;
                                const offerDate = offeredDriverIds.get(driver.id);
                                const hasOffer = offerDate !== undefined;
                                const offerTimeRemaining = hasOffer ? calculateOfferTimeRemaining(offerDate) : 0;
                                
                                return (
                                    <div
                                        key={driver.id}
                                        className={cn(
                                            "group flex items-center justify-between p-4 rounded-xl border transition-all",
                                            isAccepted && "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20",
                                            isRejected && "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 opacity-60",
                                            isPending && "border-slate-200 dark:border-slate-800 hover:border-theme-blue"
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "size-12 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold",
                                                isAccepted && "bg-green-200 dark:bg-green-800 text-green-700 dark:text-green-200",
                                                isRejected && "bg-red-200 dark:bg-red-800 text-red-700 dark:text-red-200",
                                                isPending && "bg-slate-200 dark:bg-slate-700"
                                            )}>
                                                {driver.firstName?.[0]}
                                                {driver.lastName?.[0]}
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <p className="text-slate-900 dark:text-white font-bold">
                                                    {driver.firstName} {driver.lastName}
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    {driver.driverCode} {driver.phone ? `• ${driver.phone}` : ""}
                                                </p>
                                                
                                                {/* Distance from pickup */}
                                                {!isRejected && !isAccepted && (
                                                    <p className={cn(
                                                        "text-xs font-medium flex items-center gap-1",
                                                        getDistanceColor(driver.distanceKm)
                                                    )}>
                                                        <Navigation className="size-3" />
                                                        {formatDistance(driver.distanceKm)}
                                                    </p>
                                                )}
                                                
                                                {/* Status badges row */}
                                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                    {/* Trip offer indicator */}
                                                    {hasOffer && isPending && offerTimeRemaining > 0 && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 animate-pulse">
                                                            <Clock className="size-3" />
                                                            Offer sent • {formatTimeRemaining(offerTimeRemaining)}
                                                        </span>
                                                    )}
                                                    
                                                    {/* Check-in status badge */}
                                                    {driver.checkedIn !== undefined && (
                                                        <span className={cn(
                                                            "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium",
                                                            driver.checkedIn
                                                                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                                                : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                                                        )}>
                                                            {driver.checkedIn ? (
                                                                <><CircleDot className="size-3" /> Checked In</>
                                                            ) : (
                                                                <><CircleOff className="size-3" /> Not Checked In</>
                                                            )}
                                                        </span>
                                                    )}
                                                    
                                                    {/* Remaining limit badge */}
                                                    {driver.remainingDailyLimit !== null && driver.remainingDailyLimit !== undefined && (
                                                        <span className={cn(
                                                            "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium",
                                                            driver.remainingDailyLimit > 0
                                                                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                                                                : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                                                        )}>
                                                            Limit: ₹{Number(driver.remainingDailyLimit).toFixed(0)}
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                {isRejected && (
                                                    <p className="text-xs text-red-600 dark:text-red-400 font-medium mt-0.5">
                                                        Rejected trip request
                                                    </p>
                                                )}
                                                {isAccepted && (
                                                    <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-0.5">
                                                        Accepted trip request
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {isAccepted ? (
                                            <div className="flex items-center justify-center rounded-lg h-10 px-4 bg-green-500 text-white text-sm font-bold gap-2">
                                                <CheckCircle className="size-4" />
                                                Accepted
                                            </div>
                                        ) : isRejected ? (
                                            <div className="flex items-center justify-center rounded-lg h-10 px-4 bg-red-500/80 text-white text-sm font-bold gap-2">
                                                <AlertCircle className="size-4" />
                                                Rejected
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => handleRequestDriver(driver.id)}
                                                disabled={requestingDriverId === driver.id}
                                                className={cn(
                                                    "flex items-center justify-center rounded-lg h-10 px-4 bg-theme-blue text-white text-sm font-bold hover:bg-theme-blue/90 transition-all shadow-lg shadow-theme-blue/20 disabled:opacity-50 disabled:cursor-not-allowed gap-2",
                                                    requestingDriverId === driver.id && "opacity-80"
                                                )}
                                            >
                                                {requestingDriverId === driver.id ? (
                                                    <>
                                                        <Loader2 className="size-4 animate-spin" />
                                                        {REQUEST_DRIVERS_STRINGS.REQUESTING}
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send className="size-4" />
                                                        {REQUEST_DRIVERS_STRINGS.REQUEST_DRIVER}
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

