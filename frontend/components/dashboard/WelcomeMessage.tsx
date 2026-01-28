"use client";

import React from 'react';
import { useAppSelector } from '@/lib/hooks';
import { cn } from '@/lib/utils';

export function WelcomeMessage() {
    const { user } = useAppSelector((state) => state.auth);
    
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const userName = user?.name || 'User';
    const greeting = getGreeting();

    return (
        <div className="mb-6">
            <h1 className="text-3xl font-bold text-[#0d121c] dark:text-white mb-2">
                {greeting}, {userName.split(' ')[0]}! 👋
            </h1>
            <p className="text-[#49659c] dark:text-gray-400">
                Welcome back to your dashboard. Here's what's happening today.
            </p>
        </div>
    );
}
