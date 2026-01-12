"use client";

import React from 'react';
import { Text } from '@/components/ui/text';
import { LucideIcon } from 'lucide-react';

interface PlaceholderScreenProps {
    title: string;
    description: string;
    icon: LucideIcon;
}

export function PlaceholderScreen({ title, description, icon: Icon }: PlaceholderScreenProps) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-6 rounded-3xl bg-[#0d59f2]/10 text-[#0d59f2] mb-6 shadow-xl shadow-blue-500/5">
                <Icon size={64} strokeWidth={1.5} />
            </div>
            <Text variant="h2" className="border-none pb-2 font-black tracking-tight dark:text-white">
                {title}
            </Text>
            <Text variant="muted" className="max-w-md mx-auto text-lg leading-relaxed">
                {description}
            </Text>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl text-left">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm animate-pulse">
                        <div className="h-4 w-2/3 bg-gray-100 dark:bg-gray-800 rounded mb-3" />
                        <div className="h-3 w-full bg-gray-50 dark:bg-gray-800/50 rounded" />
                    </div>
                ))}
            </div>
        </div>
    );
}
