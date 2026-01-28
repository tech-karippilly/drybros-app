"use client";

import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    return (
        <div className="flex h-screen overflow-hidden bg-[#f5f6f8] dark:bg-[#101622]">
            <Sidebar />

            <main className="flex-1 flex flex-col overflow-hidden">
                <Header />

                <div className="custom-scrollbar flex-1 overflow-y-auto p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
