"use client";

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { TripDetailsScreen } from '@/components/dashboard/trips/TripDetailsScreen';

export default function TripDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const tripId = params.id as string;

    const handleBack = () => {
        router.push('/dashboard/trips');
    };

    return (
        <TripDetailsScreen 
            tripId={tripId} 
            onBack={handleBack}
        />
    );
}
