"use client";

import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Truck, Navigation, Star } from 'lucide-react';

export function DriverDashboard() {
    return (
        <div className="flex h-screen overflow-hidden bg-[#f5f6f8] dark:bg-[#101622]">
            <Sidebar />

            <main className="flex-1 flex flex-col overflow-hidden">
                <Header />

                <div className="flex-1 overflow-y-auto p-8">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white">Driver Portal</h2>
                        <p className="text-[#49659c] dark:text-gray-400">Track your trips, earnings, and delivery schedules.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {[
                            { label: 'Today\'s Trips', value: '8', icon: Truck, color: 'text-[#0d59f2]' },
                            { label: 'Completed', value: '142', icon: Navigation, color: 'text-green-600' },
                            { label: 'Rating', value: '4.9', icon: Star, color: 'text-amber-500' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
                                <div className={`p-3 rounded-lg bg-gray-50 dark:bg-gray-800 ${stat.color}`}>
                                    <stat.icon size={24} />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-[#49659c] uppercase tracking-wider">{stat.label}</p>
                                    <p className="text-2xl font-bold dark:text-white">{stat.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 min-h-[400px] flex items-center justify-center border-dashed">
                        <div className="text-center">
                            <div className="p-4 rounded-full bg-gray-50 dark:bg-gray-800 inline-block mb-4">
                                <Navigation size={48} className="text-[#49659c]" />
                            </div>
                            <h3 className="text-lg font-bold dark:text-white">Driver Dashboard Content</h3>
                            <p className="text-[#49659c] max-w-sm mt-2">Trip logs, live navigation, and route optimization tools will be available here.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
