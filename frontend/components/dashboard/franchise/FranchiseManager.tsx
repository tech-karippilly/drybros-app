"use client";

import React, { useState } from 'react';
import { useAppSelector } from '@/lib/hooks';
import { FranchiseList } from './FranchiseList';
import { FranchiseDetails } from './FranchiseDetails';
import { CreateFranchiseForm } from './CreateFranchiseForm';

export function FranchiseManager() {
    const { selectedFranchise } = useAppSelector((state) => state.franchise);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // If a franchise is selected, show details view
    if (selectedFranchise) {
        return <FranchiseDetails />;
    }

    return (
        <div className="relative">
            <FranchiseList onCreateClick={() => setIsCreateOpen(true)} />

            {isCreateOpen && (
                <CreateFranchiseForm onClose={() => setIsCreateOpen(false)} />
            )}
        </div>
    );
}
