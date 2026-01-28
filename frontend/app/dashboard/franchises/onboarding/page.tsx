"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { CreateFranchiseForm } from "@/components/dashboard/franchise/CreateFranchiseForm";
import { DASHBOARD_ROUTES } from "@/lib/constants/routes";

export default function FranchiseOnboardingPage() {
    const router = useRouter();

    const handleClose = () => {
        router.push(DASHBOARD_ROUTES.FRANCHISES);
    };

    return <CreateFranchiseForm onClose={handleClose} />;
}
