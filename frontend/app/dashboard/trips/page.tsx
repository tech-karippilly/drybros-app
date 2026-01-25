"use client";

import React from 'react';
import { Map } from 'lucide-react';
import { useAppSelector } from '@/lib/hooks';
import { TripManager } from '@/components/dashboard/trips/TripManager';
import { PlaceholderScreen } from '@/components/dashboard/PlaceholderScreen';
import { USER_ROLES } from '@/lib/constants/roles';

export default function TripsPage() {
    const { user } = useAppSelector((state) => state.auth);
    const role = user?.role || USER_ROLES.ADMIN;

    if (role === USER_ROLES.DRIVER) {
        return (
            <PlaceholderScreen
                icon={Map}
                title="Trip History"
                description="A complete log of all your past deliveries and route performance."
            />
        );
    }

    return <TripManager tab="all-trips" />;
}
