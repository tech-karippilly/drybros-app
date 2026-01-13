"use client";

import React from 'react';
import { PenaltiesManager } from '@/components/dashboard/penalties/PenaltiesManager';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

export default function PenaltiesPage() {
    return (
        <DashboardLayout>
            <div className="p-6">
                <PenaltiesManager />
            </div>
        </DashboardLayout>
    );
}
