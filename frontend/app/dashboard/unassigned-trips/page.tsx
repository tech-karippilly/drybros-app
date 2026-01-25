"use client";

import React from 'react';
import { TripManager } from '@/components/dashboard/trips/TripManager';

export default function UnassignedTripsPage() {
    return <TripManager tab="unassigned-trips" />;
}
