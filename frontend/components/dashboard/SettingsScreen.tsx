"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Settings, LogOut, User, Shield, Bell, Palette } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/lib/hooks';
import { logout } from '@/lib/features/auth/authSlice';
import { handleLogout } from '@/lib/utils/auth';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

export function SettingsScreen() {
    const { user } = useAppSelector((state) => state.auth);
    const dispatch = useAppDispatch();
    const router = useRouter();

    const settingsSections = [
        {
            icon: User,
            title: 'Profile Settings',
            description: 'Update your personal information and contact details',
            action: 'Edit Profile',
        },
        {
            icon: Shield,
            title: 'Security',
            description: 'Manage your password and security preferences',
            action: 'Change Password',
        },
        {
            icon: Bell,
            title: 'Notifications',
            description: 'Configure how you receive alerts and updates',
            action: 'Manage Notifications',
        },
        {
            icon: Palette,
            title: 'Appearance',
            description: 'Customize theme and display preferences',
            action: 'Theme Settings',
        },
    ];

    return (
        <div className="flex-1 p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 rounded-xl bg-[#0d59f2]/10 text-[#0d59f2]">
                            <Settings size={24} />
                        </div>
                        <div>
                            <Text variant="h2" className="border-none font-black tracking-tight dark:text-white">
                                Account Settings
                            </Text>
                            <Text variant="muted" className="text-sm">
                                Manage your account preferences and security settings
                            </Text>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {settingsSections.map((section, index) => (
                        <div
                            key={index}
                            className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-[#0d59f2]/30 dark:hover:border-[#0d59f2]/30 transition-all cursor-pointer group"
                        >
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-xl bg-[#0d59f2]/10 text-[#0d59f2] group-hover:bg-[#0d59f2]/20 transition-colors">
                                    <section.icon size={20} />
                                </div>
                                <div className="flex-1">
                                    <Text variant="subheading" className="border-none mb-1 font-semibold dark:text-white">
                                        {section.title}
                                    </Text>
                                    <Text variant="small" className="text-[#49659c] dark:text-gray-400 mb-3">
                                        {section.description}
                                    </Text>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-xs"
                                        onClick={() => {
                                            // Placeholder for future implementation
                                            console.log(`Navigate to ${section.title}`);
                                        }}
                                    >
                                        {section.action}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-red-200 dark:border-red-800/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                                <LogOut size={20} />
                            </div>
                            <div>
                                <Text variant="subheading" className="border-none mb-1 font-semibold text-red-600 dark:text-red-400">
                                    Sign Out
                                </Text>
                                <Text variant="small" className="text-[#49659c] dark:text-gray-400">
                                    Sign out of your account. You'll need to log in again to access the portal.
                                </Text>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="lg"
                            className="border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={async () => {
                                await handleLogout(dispatch, logout, router);
                            }}
                        >
                            <LogOut size={18} className="mr-2" />
                            Logout
                        </Button>
                    </div>
                </div>

                <div className="mt-6 p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-[#0d59f2]/10 flex items-center justify-center text-[#0d59f2] font-bold text-sm">
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                            <Text variant="small" className="font-semibold dark:text-white">
                                {user?.name || 'User'}
                            </Text>
                            <Text variant="small" className="text-[#49659c] dark:text-gray-400 capitalize">
                                {user?.role || 'User'} • {user?.email || 'No email'}
                            </Text>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
