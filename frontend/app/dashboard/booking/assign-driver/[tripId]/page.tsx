"use client";

import React from "react";
import { useParams } from "next/navigation";
import { AssignDriverScreen } from "@/components/dashboard/trips/AssignDriverScreen";

export default function AssignDriverPage() {
    const params = useParams();
    const tripId = typeof params.tripId === "string" ? params.tripId : params.tripId?.[0];

    if (!tripId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6">
                <p className="text-slate-500 dark:text-slate-400">Invalid trip. Missing trip ID.</p>
                <a
                    href="/dashboard/booking"
                    className="px-4 py-2 bg-theme-blue text-white rounded-lg font-medium hover:bg-theme-blue/90"
                >
                    Back to Booking
                </a>
            </div>
        );
    }

    return <AssignDriverScreen tripId={tripId} />;
}
