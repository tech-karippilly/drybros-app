"use client";

import React, { useState, useEffect } from 'react';
import { User, Edit2, Save, X, Mail, Phone, Building, Shield, Palette, Moon, Sun } from 'lucide-react';
import { useAppSelector } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type TabType = 'profile' | 'appearance' | 'security';

interface ProfileFormData {
    name: string;
    email: string;
    phone: string;
    franchise: string;
}

export function ProfileSettings() {
    const { user } = useAppSelector((state) => state.auth);
    const [activeTab, setActiveTab] = useState<TabType>('profile');
    const [isEditing, setIsEditing] = useState(false);
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [profileData, setProfileData] = useState<ProfileFormData>({
        name: user?.name || '',
        email: user?.email || '',
        phone: '',
        franchise: user?.franchise_name || '',
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);

    // Load theme from localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const currentTheme = savedTheme || (prefersDark ? 'dark' : 'light');
            setTheme(currentTheme);
            applyTheme(currentTheme);
        }
    }, []);

    const applyTheme = (newTheme: 'light' | 'dark') => {
        if (typeof window === 'undefined') return;
        const root = document.documentElement;
        if (newTheme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('theme', newTheme);
    };

    const handleThemeChange = (newTheme: 'light' | 'dark') => {
        
        setTheme(newTheme);
        applyTheme(newTheme);
    };

    const handleProfileSave = async () => {
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            console.log('Saving profile:', profileData);
            setIsEditing(false);
            setLoading(false);
            // In real app, dispatch action to update user
        }, 500);
    };

    const handlePasswordChange = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert('New passwords do not match');
            return;
        }
        if (passwordData.newPassword.length < 6) {
            alert('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            console.log('Changing password');
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });
            setLoading(false);
            alert('Password changed successfully');
        }, 500);
    };

    const tabs = [
        { id: 'profile' as TabType, label: 'Profile', icon: User },
        { id: 'appearance' as TabType, label: 'Appearance', icon: Palette },
        { id: 'security' as TabType, label: 'Security', icon: Shield },
    ];

    return (
        <div className="animate-in fade-in duration-500">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white">Profile Settings</h2>
                <p className="text-[#49659c] dark:text-gray-400">Manage your account information and preferences</p>
            </div>

            {/* Tabs */}
            <div className="mb-6 border-b border-gray-200 dark:border-gray-800">
                <div className="flex gap-2">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    'flex items-center gap-2 px-4 py-3 font-semibold text-sm transition-all border-b-2',
                                    activeTab === tab.id
                                        ? 'border-[#0d59f2] text-[#0d59f2] dark:text-[#0d59f2]'
                                        : 'border-transparent text-[#49659c] dark:text-gray-400 hover:text-[#0d121c] dark:hover:text-white'
                                )}
                            >
                                <Icon size={18} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-[#0d121c] dark:text-white">Basic Details</h3>
                            <p className="text-sm text-[#49659c] dark:text-gray-400">Your personal information</p>
                        </div>
                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-[#0d59f2] text-white rounded-lg hover:bg-[#0d59f2]/90 transition-all"
                            >
                                <Edit2 size={16} />
                                Edit
                            </button>
                        )}
                    </div>

                    {isEditing ? (
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="name" className="text-sm font-semibold text-[#0d121c] dark:text-white">
                                    Full Name
                                </Label>
                                <Input
                                    id="name"
                                    value={profileData.name}
                                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="email" className="text-sm font-semibold text-[#0d121c] dark:text-white">
                                    Email
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={profileData.email}
                                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="phone" className="text-sm font-semibold text-[#0d121c] dark:text-white">
                                    Phone
                                </Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={profileData.phone}
                                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="franchise" className="text-sm font-semibold text-[#0d121c] dark:text-white">
                                    Franchise
                                </Label>
                                <Input
                                    id="franchise"
                                    value={profileData.franchise}
                                    onChange={(e) => setProfileData({ ...profileData, franchise: e.target.value })}
                                    className="mt-1"
                                    disabled
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <Button
                                    onClick={handleProfileSave}
                                    disabled={loading}
                                    className="flex items-center gap-2 bg-[#0d59f2] hover:bg-[#0d59f2]/90"
                                >
                                    <Save size={16} />
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </Button>
                                <Button
                                    onClick={() => {
                                        setIsEditing(false);
                                        setProfileData({
                                            name: user?.name || '',
                                            email: user?.email || '',
                                            phone: '',
                                            franchise: user?.franchise_name || '',
                                        });
                                    }}
                                    variant="outline"
                                    className="flex items-center gap-2"
                                >
                                    <X size={16} />
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="p-3 bg-[#0d59f2]/10 rounded-lg">
                                    <User size={20} className="text-[#0d59f2]" />
                                </div>
                                <div>
                                    <p className="text-xs text-[#49659c] dark:text-gray-400 uppercase tracking-wider">Full Name</p>
                                    <p className="font-semibold text-[#0d121c] dark:text-white">{profileData.name || '—'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="p-3 bg-[#0d59f2]/10 rounded-lg">
                                    <Mail size={20} className="text-[#0d59f2]" />
                                </div>
                                <div>
                                    <p className="text-xs text-[#49659c] dark:text-gray-400 uppercase tracking-wider">Email</p>
                                    <p className="font-semibold text-[#0d121c] dark:text-white">{profileData.email || '—'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="p-3 bg-[#0d59f2]/10 rounded-lg">
                                    <Phone size={20} className="text-[#0d59f2]" />
                                </div>
                                <div>
                                    <p className="text-xs text-[#49659c] dark:text-gray-400 uppercase tracking-wider">Phone</p>
                                    <p className="font-semibold text-[#0d121c] dark:text-white">{profileData.phone || '—'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="p-3 bg-[#0d59f2]/10 rounded-lg">
                                    <Building size={20} className="text-[#0d59f2]" />
                                </div>
                                <div>
                                    <p className="text-xs text-[#49659c] dark:text-gray-400 uppercase tracking-wider">Franchise</p>
                                    <p className="font-semibold text-[#0d121c] dark:text-white">{profileData.franchise || '—'}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-[#0d121c] dark:text-white">Theme Settings</h3>
                        <p className="text-sm text-[#49659c] dark:text-gray-400">Choose your preferred theme</p>
                    </div>

                    <div className="space-y-4">
                        <div
                            onClick={() => handleThemeChange('light')}
                            className={cn(
                                'flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all',
                                theme === 'light'
                                    ? 'border-[#0d59f2] bg-[#0d59f2]/5 dark:bg-[#0d59f2]/10'
                                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                            )}
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                                    <Sun size={24} className="text-yellow-600 dark:text-yellow-400" />
                                </div>
                                <div>
                                    <p className="font-semibold text-[#0d121c] dark:text-white">Light Mode</p>
                                    <p className="text-sm text-[#49659c] dark:text-gray-400">Bright and clean interface</p>
                                </div>
                            </div>
                            {theme === 'light' && (
                                <div className="w-5 h-5 rounded-full bg-[#0d59f2] flex items-center justify-center">
                                    <div className="w-2 h-2 rounded-full bg-white" />
                                </div>
                            )}
                        </div>

                        <div
                            onClick={() => handleThemeChange('dark')}
                            className={cn(
                                'flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all',
                                theme === 'dark'
                                    ? 'border-[#0d59f2] bg-[#0d59f2]/5 dark:bg-[#0d59f2]/10'
                                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                            )}
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gray-800 dark:bg-gray-700 rounded-lg">
                                    <Moon size={24} className="text-gray-300" />
                                </div>
                                <div>
                                    <p className="font-semibold text-[#0d121c] dark:text-white">Dark Mode</p>
                                    <p className="text-sm text-[#49659c] dark:text-gray-400">Easy on the eyes, especially at night</p>
                                </div>
                            </div>
                            {theme === 'dark' && (
                                <div className="w-5 h-5 rounded-full bg-[#0d59f2] flex items-center justify-center">
                                    <div className="w-2 h-2 rounded-full bg-white" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-[#0d121c] dark:text-white">Change Password</h3>
                        <p className="text-sm text-[#49659c] dark:text-gray-400">Update your password to keep your account secure</p>
                    </div>

                    <div className="space-y-4 max-w-md">
                        <div>
                            <Label htmlFor="currentPassword" className="text-sm font-semibold text-[#0d121c] dark:text-white">
                                Current Password
                            </Label>
                            <Input
                                id="currentPassword"
                                type="password"
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                className="mt-1"
                                placeholder="Enter current password"
                            />
                        </div>
                        <div>
                            <Label htmlFor="newPassword" className="text-sm font-semibold text-[#0d121c] dark:text-white">
                                New Password
                            </Label>
                            <Input
                                id="newPassword"
                                type="password"
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                className="mt-1"
                                placeholder="Enter new password"
                            />
                            <p className="text-xs text-[#49659c] dark:text-gray-400 mt-1">Must be at least 6 characters</p>
                        </div>
                        <div>
                            <Label htmlFor="confirmPassword" className="text-sm font-semibold text-[#0d121c] dark:text-white">
                                Confirm New Password
                            </Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                className="mt-1"
                                placeholder="Confirm new password"
                            />
                        </div>
                        <div className="pt-4">
                            <Button
                                onClick={handlePasswordChange}
                                disabled={loading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                                className="w-full bg-[#0d59f2] hover:bg-[#0d59f2]/90"
                            >
                                {loading ? 'Changing Password...' : 'Change Password'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
