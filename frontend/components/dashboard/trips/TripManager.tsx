"use client";

import React, { useState } from 'react';
import { TripTypeList } from './TripTypeList';
import { TripTypeCreateForm } from './TripTypeCreateForm';
import { TripBookingForm } from './TripBookingForm';
import { UnassignedTripsList } from './UnassignedTripsList';
import { TripDetailsScreen } from './TripDetailsScreen';
import { TripTypeResponse } from '@/lib/features/tripType/tripTypeApi';
import { useAppSelector } from '@/lib/hooks';

export function TripManager() {
    const { activeTab } = useAppSelector((state) => state.auth);
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
            {activeTab === 'trip-types' && (
                <TripTypeList
                    onCreateClick={handleCreateClick}
                    onEditClick={handleEditClick}
                />
            )}

            {activeTab === 'trip-booking' && (
                <TripBookingForm />
            )}

            {activeTab === 'unassigned-trips' && (
                <UnassignedTripsList onViewTrip={handleViewTrip} />
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
