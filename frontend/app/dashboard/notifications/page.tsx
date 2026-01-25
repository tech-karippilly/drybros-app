"use client";

import React from 'react';
import { Bell } from 'lucide-react';
import { PlaceholderScreen } from '@/components/dashboard/PlaceholderScreen';

export default function NotificationsPage() {
    return (
        <PlaceholderScreen
            icon={Bell}
            title="System Notifications"
            description="Stay updated with real-time alerts regarding system status, order updates, and administrative tasks."
        />
    );
}
