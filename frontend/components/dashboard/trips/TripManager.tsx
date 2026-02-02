"use client";

import React, { useState } from 'react';
import { TripTypeList } from './TripTypeList';
import { TripTypeCreateForm } from './TripTypeCreateForm';
import { TripBookingForm } from './TripBookingForm';
import { TripList } from './TripList';
import { TripDetailsScreen } from './TripDetailsScreen';
import { TripTypeResponse } from '@/lib/features/tripType/tripTypeApi';
import { useAppSelector } from '@/lib/hooks';

export type TripManagerTab = 'all-trips' | 'trip-types' | 'trip-booking';

const DEFAULT_TAB: TripManagerTab = 'all-trips';

function normalizeTripTab(tab: unknown): TripManagerTab {
    if (tab === 'all-trips' || tab === 'trip-types' || tab === 'trip-booking') return tab;
    return DEFAULT_TAB;
}

interface TripManagerProps {
    /** When provided (e.g. from route), use this tab instead of Redux activeTab */
    tab?: TripManagerTab;
}

export function TripManager({ tab: tabProp }: TripManagerProps) {
    const { activeTab } = useAppSelector((state) => state.auth);
    const tab = normalizeTripTab(tabProp ?? activeTab);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingTripType, setEditingTripType] = useState<TripTypeResponse | null>(null);
    const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

    const handleCreateClick = () => {
        setEditingTripType(null);
        setIsCreateOpen(true);
    };

    const handleEditClick = (tripType: TripTypeResponse) => {
        setEditingTripType(tripType);
        setIsCreateOpen(true);
    };

    const handleCloseForm = () => {
        setIsCreateOpen(false);
        setEditingTripType(null);
    };

    const handleViewTrip = (tripId: string) => {
        setSelectedTripId(tripId);
    };

    const handleBackFromTrip = () => {
        setSelectedTripId(null);
    };

    // Show trip details screen if a trip is selected
    if (selectedTripId) {
        return (
            <TripDetailsScreen
                tripId={selectedTripId}
                onBack={handleBackFromTrip}
            />
        );
    }

    return (
        <div className="relative">
            {tab === 'all-trips' && (
                <TripList onViewTrip={handleViewTrip} />
            )}

            {tab === 'trip-types' && (
                <TripTypeList
                    onCreateClick={handleCreateClick}
                    onEditClick={handleEditClick}
                />
            )}

            {tab === 'trip-booking' && (
                <TripBookingForm />
            )}

            {isCreateOpen && (
                <TripTypeCreateForm
                    onClose={handleCloseForm}
                    tripType={editingTripType}
                />
            )}
        </div>
    );
}
