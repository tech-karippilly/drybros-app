"use client";

import React, { useState } from 'react';
import { useAppDispatch } from '@/lib/hooks';
import { addFranchise } from '@/lib/features/franchise/franchiseSlice';
import {
    X,
    Upload,
    Save,
    Building,
    Mail,
    Phone,
    MapPin,
    Navigation,
    User
} from 'lucide-react';

interface CreateFranchiseFormProps {
    onClose: () => void;
}

export function CreateFranchiseForm({ onClose }: CreateFranchiseFormProps) {
    const dispatch = useAppDispatch();
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        location: '',
        email: '',
        phone: '',
        inchargeName: '',
        description: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Form a new franchise object
        const newFranchise = {
            _id: `fran_${Math.random().toString(36).substr(2, 9)}`,
            code: `DB-${formData.location.toUpperCase().substring(0, 3)}-${Math.floor(Math.random() * 1000)}`,
            ...formData,
            staffCount: 0,
            driverCount: 0,
            staff: [],
            drivers: [],
            status: 'active' as const
        };

        dispatch(addFranchise(newFranchise));
        onClose();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="fixed inset-0 bg-[#0d121c]/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#101622] w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                    <div>
                        <h3 className="text-xl font-bold dark:text-white">New Franchise Enrollment</h3>
                        <p className="text-xs text-[#49659c] font-medium uppercase tracking-wider mt-1">Onboard a new location to the Drybros network</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-all text-[#49659c]">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Image Upload Placeholder */}
                        <div className="md:col-span-2 group">
                            <label className="text-xs font-black text-[#49659c] uppercase tracking-widest mb-2 block">Franchise Branding</label>
                            <div className="h-32 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-[#0d59f2]/40 hover:bg-[#0d59f2]/5 transition-all cursor-pointer">
                                <Upload size={24} className="text-[#49659c] group-hover:text-[#0d59f2] transition-colors" />
                                <span className="text-sm font-bold text-[#49659c] group-hover:text-[#0d121c] dark:group-hover:text-white">Upload Store Image</span>
                                <span className="text-[10px] text-[#49659c]">PNG, JPG up to 5MB</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-[#49659c] uppercase tracking-widest flex items-center gap-2">
                                <Building size={14} />
                                Franchise Name
                            </label>
                            <input
                                required
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g. South Side Hub"
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-medium"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-[#49659c] uppercase tracking-widest flex items-center gap-2">
                                <Navigation size={14} />
                                Region/Area
                            </label>
                            <input
                                required
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                placeholder="e.g. South District"
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-medium"
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-black text-[#49659c] uppercase tracking-widest flex items-center gap-2">
                                <MapPin size={14} />
                                Physical Address
                            </label>
                            <input
                                required
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="Full street address, city, and zip code"
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-medium"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-[#49659c] uppercase tracking-widest flex items-center gap-2">
                                <Mail size={14} />
                                Official Email
                            </label>
                            <input
                                required
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="office@franchise.com"
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-medium"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-[#49659c] uppercase tracking-widest flex items-center gap-2">
                                <Phone size={14} />
                                Contact Number
                            </label>
                            <input
                                required
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="+1 000 000 0000"
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-medium"
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-black text-[#49659c] uppercase tracking-widest flex items-center gap-2">
                                <User size={14} />
                                In-charge Name
                            </label>
                            <input
                                required
                                name="inchargeName"
                                value={formData.inchargeName}
                                onChange={handleChange}
                                placeholder="Name of the primary manager"
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-medium"
                            />
                        </div>
                    </div>

                    <div className="mt-10 flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 border border-gray-200 dark:border-gray-800 rounded-2xl text-sm font-bold text-[#49659c] hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                        >
                            Cancel Project
                        </button>
                        <button
                            type="submit"
                            className="flex-2 flex-[2] bg-[#0d59f2] text-white py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#0d59f2]/90 shadow-xl shadow-blue-500/20 transition-all active:scale-95"
                        >
                            <Save size={20} />
                            <span>Establish Franchise</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
