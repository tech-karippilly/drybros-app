"use client";

import React, { useState } from 'react';
import { PenaltiesList } from './PenaltiesList';
import { PenaltyForm } from './PenaltyForm';
import { ApplyPenaltyModal } from './ApplyPenaltyModal';
import { Penalty } from '@/lib/types/penalties';

export function PenaltiesManager() {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
    const [selectedPenalty, setSelectedPenalty] = useState<Penalty | null>(null);

    const handleCreateClick = () => {
        setSelectedPenalty(null);
        setIsFormOpen(true);
    };

    const handleEditClick = (penalty: Penalty) => {
        setSelectedPenalty(penalty);
        setIsFormOpen(true);
    };

    const handleApplyClick = (penalty: Penalty) => {
        setSelectedPenalty(penalty);
        setIsApplyModalOpen(true);
    };

    const handleFormClose = () => {
        setIsFormOpen(false);
        setSelectedPenalty(null);
    };

    const handleApplyModalClose = () => {
        setIsApplyModalOpen(false);
        setSelectedPenalty(null);
    };

    return (
        <>
            <PenaltiesList
                onCreateClick={handleCreateClick}
                onEditClick={handleEditClick}
                onApplyClick={handleApplyClick}
            />
            <PenaltyForm
                isOpen={isFormOpen}
                onClose={handleFormClose}
                penalty={selectedPenalty}
            />
            <ApplyPenaltyModal
                isOpen={isApplyModalOpen}
                onClose={handleApplyModalClose}
                penalty={selectedPenalty}
            />
        </>
    );
}
