"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { CreateStaffForm } from "@/components/dashboard/staff/CreateStaffForm";
import { DASHBOARD_ROUTES } from "@/lib/constants/routes";

export default function StaffOnboardingPage() {
    const router = useRouter();

    const handleClose = () => {
        router.push(DASHBOARD_ROUTES.STAFF);
    };

    return <CreateStaffForm onClose={handleClose} variant="page" />;
}
