"use client";

import React, { useState } from 'react';
import { TripTypeList } from './TripTypeList';
import { TripTypeCreateForm } from './TripTypeCreateForm';
import { TripTypeResponse } from '@/lib/features/tripType/tripTypeApi';
import { useAppSelector } from '@/lib/hooks';

export function TripManager() {
    const { activeTab } = useAppSelector((state) => state.auth);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingTripType, setEditingTripType] = useState<TripTypeResponse | null>(null);

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

    return (
        <div className="relative">
            {activeTab === 'trip-types' && (
                <TripTypeList
                    onCreateClick={handleCreateClick}
                    onEditClick={handleEditClick}
                />
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
