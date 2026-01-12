import React from 'react';
import { Text } from '@/components/ui/text';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4 relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-theme-blue/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-theme-orange/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="w-full max-w-md space-y-8 relative z-10">
                <div className="flex flex-col items-center">
                    <div className="h-16 w-16 bg-theme-blue rounded-2xl flex items-center justify-center shadow-lg shadow-theme-blue/20 mb-4 transition-transform hover:rotate-3">
                        <span className="text-white text-3xl font-bold italic tracking-tighter">D</span>
                    </div>
                    <Text variant="h2" className="border-none pb-0 tracking-tight font-black text-theme-blue">
                        DRybros
                    </Text>
                    <Text variant="muted" className="mt-1">
                        Staff Portal
                    </Text>
                </div>

                <div className="bg-white dark:bg-gray-900 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-800 rounded-2xl p-8">
                    {children}
                </div>

                <Text variant="small" className="text-center text-gray-500">
                    &copy; {new Date().getFullYear()} DRybros Inc. All rights reserved.
                </Text>
            </div>
        </div>
    );
}
