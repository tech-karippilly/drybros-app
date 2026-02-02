"use client";

import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DASHBOARD_ROUTES } from "@/lib/constants/routes";
import { REQUEST_DRIVERS_STRINGS } from "@/lib/constants/trips";
import { RequestDriversScreen } from "@/components/dashboard/trips/RequestDriversScreen";

export default function RequestDriversPage() {
    const params = useParams();
    const tripId = typeof params.tripId === "string" ? params.tripId : params.tripId?.[0];

    if (!tripId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6">
                <p className="text-slate-500 dark:text-slate-400">{REQUEST_DRIVERS_STRINGS.INVALID_TRIP}</p>
                <Link
                    href={DASHBOARD_ROUTES.BOOKING}
                    className="px-4 py-2 bg-theme-blue text-white rounded-lg font-medium hover:bg-theme-blue/90"
                >
                    {REQUEST_DRIVERS_STRINGS.BACK_TO_BOOKING}
                </Link>
            </div>
        );
    }

    return <RequestDriversScreen tripId={tripId} />;
}

