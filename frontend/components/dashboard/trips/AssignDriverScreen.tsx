"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getTripById, assignDriverToTrip, TripResponse } from "@/lib/features/trip/tripApi";
import { getDrivers } from "@/lib/features/drivers/driverApi";
import { DASHBOARD_ROUTES } from "@/lib/constants/routes";
import { ASSIGN_DRIVER_STRINGS } from "@/lib/constants/trips";
import { cn } from "@/lib/utils";
import {
    ArrowLeft,
    MapPin,
    Loader2,
    AlertCircle,
    Search,
    Info,
    History,
    Star,
    CheckCircle,
} from "lucide-react";
import type { AvailableDriver } from "@/lib/types/driver";

interface AssignDriverScreenProps {
    tripId: string;
}

function formatDate(d: Date | string | null): string {
    if (!d) return "—";
    const date = new Date(d);
    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function formatTime(d: Date | string | null): string {
    if (!d) return "—";
    const date = new Date(d);
    return date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function AssignDriverScreen({ tripId }: AssignDriverScreenProps) {
    const router = useRouter();
    const [trip, setTrip] = useState<TripResponse | null>(null);
    const [drivers, setDrivers] = useState<AvailableDriver[]>([]);
    const [loadingTrip, setLoadingTrip] = useState(true);
    const [loadingDrivers, setLoadingDrivers] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [assigningDriver, setAssigningDriver] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [driverAssigned, setDriverAssigned] = useState(false);

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
                    setError(
                        ex?.response?.data?.error ||
                            ex?.message ||
                            "Failed to load trip details"
                    );
                }
            })
            .finally(() => {
                if (!cancelled) setLoadingTrip(false);
            });
        return () => {
            cancelled = true;
        };
    }, [tripId]);

    // Fetch drivers via drivers API (by franchise) once trip is loaded
    useEffect(() => {
        if (!trip?.franchiseId) {
            if (trip && !trip.franchiseId) setLoadingDrivers(false);
            return;
        }
        let cancelled = false;
        setLoadingDrivers(true);
        getDrivers({
            franchiseId: trip.franchiseId,
            includePerformance: true,
        })
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

    const handleAssign = async (driverId: string) => {
        try {
            setAssigningDriver(driverId);
            await assignDriverToTrip(tripId, driverId);
            setDriverAssigned(true);
            router.push(DASHBOARD_ROUTES.TRIPS);
        } catch (err: unknown) {
            const ex = err as { response?: { data?: { error?: string } }; message?: string };
            setError(
                ex?.response?.data?.error ||
                    ex?.message ||
                    "Failed to assign driver"
            );
        } finally {
            setAssigningDriver(null);
        }
    };

    const handleSkip = () => {
        router.push(DASHBOARD_ROUTES.BOOKING);
    };

    if (loadingTrip && !trip) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="size-10 animate-spin text-theme-blue" />
                <p className="text-slate-500 dark:text-slate-400">
                    {ASSIGN_DRIVER_STRINGS.LOADING_TRIP}
                </p>
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
                    {ASSIGN_DRIVER_STRINGS.BACK_TO_BOOKING}
                </Link>
            </div>
        );
    }

    const scheduledAt = trip?.scheduledAt;
    const scheduledTime = scheduledAt ? formatTime(scheduledAt) : "—";
    const scheduledDate = scheduledAt ? formatDate(scheduledAt) : "—";

    return (
        <div className="flex flex-1 overflow-hidden bg-slate-50 dark:bg-[#101922]">
            {/* Left Sidebar: Trip Summary */}
            <aside className="w-80 border-r border-slate-200 dark:border-slate-800 flex-shrink-0 bg-white dark:bg-[#101922] overflow-y-auto hidden xl:flex flex-col">
                <div className="p-6 space-y-6">
                    <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">
                            {ASSIGN_DRIVER_STRINGS.TRIP_DETAILS} #{tripId.slice(0, 8)}
                        </h3>
                        <div className="rounded-xl bg-slate-50 dark:bg-[#192633] overflow-hidden border border-slate-200 dark:border-slate-700">
                            <div className="h-32 bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                                <MapPin className="size-10 text-slate-400 dark:text-slate-500" />
                            </div>
                            <div className="p-4 space-y-4">
                                <div className="relative pl-6 border-l-2 border-theme-blue/30 py-1">
                                    <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-theme-blue" />
                                    <div className="absolute -left-[5px] bottom-0 w-2 h-2 rounded-full bg-slate-400" />
                                    <div className="mb-4">
                                        <p className="text-[10px] text-slate-400 uppercase font-bold">
                                            {ASSIGN_DRIVER_STRINGS.PICKUP}
                                        </p>
                                        <p className="text-xs font-medium text-slate-900 dark:text-slate-200 truncate">
                                            {trip?.pickupAddress || trip?.pickupLocation || "—"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase font-bold">
                                            {ASSIGN_DRIVER_STRINGS.DESTINATION}
                                        </p>
                                        <p className="text-xs font-medium text-slate-900 dark:text-slate-200 truncate">
                                            {trip?.dropAddress || trip?.dropLocation || "—"}
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase font-bold">
                                            {ASSIGN_DRIVER_STRINGS.DATE}
                                        </p>
                                        <p className="text-xs font-semibold text-slate-900 dark:text-white">
                                            {scheduledDate}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase font-bold">
                                            {ASSIGN_DRIVER_STRINGS.TIME}
                                        </p>
                                        <p className="text-xs font-semibold text-slate-900 dark:text-white">
                                            {scheduledTime}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            {ASSIGN_DRIVER_STRINGS.QUICK_ACTIONS}
                        </h3>
                        <button
                            type="button"
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-theme-blue/10 text-theme-blue text-sm font-medium border border-theme-blue/20"
                        >
                            <Info className="size-5" />
                            {ASSIGN_DRIVER_STRINGS.CURRENT_TRIP_MANIFEST}
                        </button>
                        <button
                            type="button"
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-medium"
                        >
                            <MapPin className="size-5" />
                            {ASSIGN_DRIVER_STRINGS.FULL_ROUTE_MAP}
                        </button>
                        <button
                            type="button"
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-medium"
                        >
                            <History className="size-5" />
                            {ASSIGN_DRIVER_STRINGS.TRIP_LOGS}
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main: Driver Selection */}
            <section className="flex-1 flex flex-col overflow-y-auto">
                <div className="px-8 pt-8 pb-4">
                    <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
                        <div className="flex items-center gap-4">
                            <Link
                                href={DASHBOARD_ROUTES.BOOKING}
                                className="p-2 text-slate-500 hover:text-theme-blue hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="size-6" />
                            </Link>
                            <div>
                                <h1 className="text-slate-900 dark:text-white text-3xl font-black leading-tight tracking-tight">
                                    {ASSIGN_DRIVER_STRINGS.PAGE_TITLE}
                                </h1>
                                <p className="text-slate-500 dark:text-slate-400 text-base mt-0.5">
                                    {ASSIGN_DRIVER_STRINGS.PAGE_SUBTITLE}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="bg-theme-blue/20 text-theme-blue px-3 py-1 rounded-full text-xs font-bold uppercase">
                                {ASSIGN_DRIVER_STRINGS.SCHEDULED}: {scheduledTime}
                            </span>
                            <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1 rounded-full text-xs font-bold uppercase">
                                {ASSIGN_DRIVER_STRINGS.TRIP_ID}: #{tripId.slice(0, 8)}
                            </span>
                            <button
                                type="button"
                                onClick={handleSkip}
                                className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                {ASSIGN_DRIVER_STRINGS.SKIP_FOR_NOW}
                            </button>
                        </div>
                    </div>

                    {/* Search and Filters */}
                    <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-[#192633] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder={ASSIGN_DRIVER_STRINGS.SEARCH_PLACEHOLDER}
                                className="w-full bg-slate-100 dark:bg-[#101922] border-none rounded-lg pl-10 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-theme-blue"
                            />
                        </div>
                        <div className="flex gap-2">
                            <select className="bg-slate-100 dark:bg-[#101922] border-none rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-theme-blue min-w-[140px] px-3 py-2">
                                <option>{ASSIGN_DRIVER_STRINGS.DISTANCE_CLOSEST}</option>
                            </select>
                            <select className="bg-slate-100 dark:bg-[#101922] border-none rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-theme-blue min-w-[140px] px-3 py-2">
                                <option>{ASSIGN_DRIVER_STRINGS.RATING_ANY}</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Driver List */}
                <div className="px-8 pb-10 space-y-4">
                    <h2 className="text-slate-900 dark:text-white text-lg font-bold px-1">
                        {ASSIGN_DRIVER_STRINGS.AVAILABLE_DRIVERS} ({filteredDrivers.length})
                    </h2>

                    {loadingDrivers ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="size-10 animate-spin text-theme-blue" />
                            <p className="text-slate-500 dark:text-slate-400">
                                {ASSIGN_DRIVER_STRINGS.LOADING_DRIVERS}
                            </p>
                        </div>
                    ) : filteredDrivers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white dark:bg-[#192633] rounded-xl border border-slate-200 dark:border-slate-800">
                            <AlertCircle className="size-12 text-slate-400" />
                            <p className="text-slate-600 dark:text-slate-300 font-medium">
                                {ASSIGN_DRIVER_STRINGS.NO_DRIVERS}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredDrivers.map((driver) => (
                                <div
                                    key={driver.id}
                                    className="group flex items-center justify-between p-4 bg-white dark:bg-[#192633] rounded-xl border border-slate-200 dark:border-slate-800 hover:border-theme-blue transition-colors shadow-sm"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <div className="size-14 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold text-lg">
                                                {driver.firstName?.[0]}
                                                {driver.lastName?.[0]}
                                            </div>
                                            <div
                                                className={cn(
                                                    "absolute bottom-0 right-0 size-4 rounded-full border-2 border-white dark:border-[#192633]",
                                                    driver.performance?.category === "GREEN"
                                                        ? "bg-green-500"
                                                        : driver.performance?.category === "YELLOW"
                                                        ? "bg-amber-500"
                                                        : "bg-slate-400"
                                                )}
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <p className="text-slate-900 dark:text-white font-bold">
                                                    {driver.firstName} {driver.lastName}
                                                </p>
                                                <div className="flex items-center gap-1 text-xs text-yellow-500 font-bold">
                                                    <Star className="size-3.5 fill-current" />
                                                    {driver.currentRating?.toFixed(1) ?? "—"}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-[#101922] text-[10px] text-slate-500 dark:text-slate-400 rounded font-bold uppercase">
                                                    {driver.driverCode}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <button
                                            type="button"
                                            onClick={() => handleAssign(driver.id)}
                                            disabled={assigningDriver === driver.id}
                                            className="flex min-w-[140px] items-center justify-center rounded-lg h-10 px-6 bg-theme-blue text-white text-sm font-bold hover:bg-theme-blue/90 transition-all shadow-lg shadow-theme-blue/20 disabled:opacity-50 disabled:cursor-not-allowed gap-2"
                                        >
                                            {assigningDriver === driver.id ? (
                                                <>
                                                    <Loader2 className="size-4 animate-spin" />
                                                    {ASSIGN_DRIVER_STRINGS.ASSIGNING}
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle className="size-4" />
                                                    {ASSIGN_DRIVER_STRINGS.ASSIGN_TO_TRIP}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-2">
                            <AlertCircle className="size-5 text-red-500 shrink-0" />
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
