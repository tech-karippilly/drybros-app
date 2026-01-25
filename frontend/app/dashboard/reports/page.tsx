"use client";

import React from 'react';
import { BarChart3 } from 'lucide-react';
import { PlaceholderScreen } from '@/components/dashboard/PlaceholderScreen';

export default function ReportsPage() {
    return (
        <PlaceholderScreen
            icon={BarChart3}
            title="Business Analytics"
            description="Generate detailed reports on revenue, operational efficiency, and customer satisfaction metrics."
        />
    );
}
