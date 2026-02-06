"use client";

import React, { useState } from 'react';
import { TripTypeList } from './TripTypeList';
import { TripBookingForm } from './TripBookingForm';
import { TripList } from './TripList';
import { TripDetailsScreen } from './TripDetailsScreen';
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
    const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

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
                <TripTypeList />
            )}

            {tab === 'trip-booking' && (
                <TripBookingForm />
            )}
        </div>
    );
}
