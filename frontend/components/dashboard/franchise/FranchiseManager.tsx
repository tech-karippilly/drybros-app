"use client";

import React from "react";
import { useAppSelector } from "@/lib/hooks";
import { FranchiseList } from "./FranchiseList";
import { FranchiseDetails } from "./FranchiseDetails";

export function FranchiseManager() {
    const { selectedFranchise } = useAppSelector((state) => state.franchise);

    if (selectedFranchise) {
        return <FranchiseDetails />;
    }

    return <FranchiseList />;
}
