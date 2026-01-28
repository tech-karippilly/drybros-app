"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { EditFranchiseForm } from "@/components/dashboard/franchise/EditFranchiseForm";
import { DASHBOARD_ROUTES } from "@/lib/constants/routes";

export default function FranchiseEditPage() {
    const params = useParams();
    const router = useRouter();
    const id = typeof params.id === "string" ? params.id : params.id?.[0];

    const handleClose = () => {
        router.push(DASHBOARD_ROUTES.FRANCHISES);
    };

    if (!id) {
        return (
            <div className="max-w-5xl mx-auto p-6 md:p-8">
                <p className="text-red-500 dark:text-red-400 text-sm">Invalid franchise ID.</p>
                <button
                    type="button"
                    onClick={handleClose}
                    className="mt-4 px-5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                    Back to Franchises
                </button>
            </div>
        );
    }

    return <EditFranchiseForm franchiseId={id} onClose={handleClose} />;
}
