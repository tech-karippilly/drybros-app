"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, CheckCircle, Loader2, Search, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { DASHBOARD_ROUTES } from "@/lib/constants/routes";
import { REQUEST_DRIVERS_STRINGS } from "@/lib/constants/trips";
import { getTripById, requestTripDrivers, TripResponse } from "@/lib/features/trip/tripApi";
import { getDrivers } from "@/lib/features/drivers/driverApi";
import type { AvailableDriver } from "@/lib/types/driver";

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
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [requestingAll, setRequestingAll] = useState(false);
    const [requestingDriverId, setRequestingDriverId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        let cancelled = false;
        setLoadingTrip(true);
        setError(null);
        getTripById(tripId)
            .then((data) => {
                if (!cancelled) setTrip(data);
            })
            .catch((err: unknown) => {
                const ex = err as { response?: { data?: { error?: string } }; message?: string };
                if (!cancelled) {
                    setError(ex?.response?.data?.error || ex?.message || REQUEST_DRIVERS_STRINGS.ERROR_LOAD_TRIP);
                }
            })
            .finally(() => {
                if (!cancelled) setLoadingTrip(false);
            });
        return () => {
            cancelled = true;
        };
    }, [tripId]);

    useEffect(() => {
        if (!trip?.franchiseId) {
            if (trip && !trip.franchiseId) setLoadingDrivers(false);
            return;
        }
        let cancelled = false;
        setLoadingDrivers(true);
        getDrivers({ franchiseId: trip.franchiseId, includePerformance: true })
            .then((list) => {
                if (cancelled) return;
                const mapped: AvailableDriver[] = (list || []).map((d) => {
                    const perf = (d as { performance?: AvailableDriver["performance"] }).performance;
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
                        matchScore: 0,
                    };
                });
                setDrivers(mapped);
            })
            .catch(() => {
                if (!cancelled) setDrivers([]);
            })
            .finally(() => {
                if (!cancelled) setLoadingDrivers(false);
            });
        return () => {
            cancelled = true;
        };
    }, [trip?.franchiseId]);

    const filteredDrivers = useMemo(() => {
        if (!searchTerm.trim()) return drivers;
        const q = searchTerm.toLowerCase();
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
                        <p className="text-slate-500 dark:text-slate-400 text-base mt-0.5">
                            {REQUEST_DRIVERS_STRINGS.PAGE_SUBTITLE}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
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
                            {filteredDrivers.map((driver) => (
                                <div
                                    key={driver.id}
                                    className="group flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-theme-blue transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="size-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold">
                                            {driver.firstName?.[0]}
                                            {driver.lastName?.[0]}
                                        </div>
                                        <div className="flex flex-col">
                                            <p className="text-slate-900 dark:text-white font-bold">
                                                {driver.firstName} {driver.lastName}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {driver.driverCode} {driver.phone ? `• ${driver.phone}` : ""}
                                            </p>
                                        </div>
                                    </div>

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
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

