"use client";

import React from 'react';
import { ComplaintsManager } from '@/components/dashboard/complaints/ComplaintsManager';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

export default function ComplaintsPage() {
    return (
        <DashboardLayout>
            <div className="p-6">
                <ComplaintsManager />
            </div>
        </DashboardLayout>
    );
}
