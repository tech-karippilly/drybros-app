"use client";

import React, { useState, useRef, useCallback } from 'react';
import { useAppDispatch } from '@/lib/hooks';
import { createFranchise, fetchFranchises } from '@/lib/features/franchise/franchiseSlice';
import { setFranchiseList, setSelectedFranchise } from '@/lib/features/auth/authSlice';
import { useToast } from '@/components/ui/toast';
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

const STORE_IMAGE_ACCEPT = 'image/png,image/jpeg,image/jpg';
const STORE_IMAGE_MAX_MB = 5;
const STORE_IMAGE_MAX_BYTES = STORE_IMAGE_MAX_MB * 1024 * 1024;

interface CreateFranchiseFormProps {
    onClose: () => void;
}

export function CreateFranchiseForm({ onClose }: CreateFranchiseFormProps) {
    const dispatch = useAppDispatch();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState({
        name: '',
        region: '',
        address: '',
        phone: '',
        inchargeName: '',
        managerEmail: '',
        managerPhone: '',
        storeImage: null as string | null,
        legalDocumentsCollected: false,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Create franchise using API
            await dispatch(createFranchise(formData)).unwrap();
            
            // Fetch updated franchise list
            const franchises = await dispatch(fetchFranchises()).unwrap();
            
            // Sync to auth slice and set first franchise as active
            if (franchises.length > 0) {
                dispatch(setFranchiseList(franchises));
                // If no franchise is currently selected, select the newly created one
                const newFranchise = franchises[franchises.length - 1];
                dispatch(setSelectedFranchise(newFranchise));
            }

            toast({
                title: "Success",
                description: "Franchise created successfully!",
                variant: "success",
            });

            onClose();
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Failed to create franchise';
            toast({
                title: "Error",
                description: errorMessage,
                variant: "error",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleStoreImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) {
            toast({ title: 'Invalid format', description: 'Use PNG or JPG only.', variant: 'error' });
            return;
        }
        if (file.size > STORE_IMAGE_MAX_BYTES) {
            toast({ title: 'File too large', description: `Max ${STORE_IMAGE_MAX_MB}MB.`, variant: 'error' });
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result as string;
            setFormData(prev => ({ ...prev, storeImage: dataUrl }));
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    }, [toast]);

    const handleRemoveStoreImage = useCallback((_e: React.MouseEvent) => {
        setFormData(prev => ({ ...prev, storeImage: null }));
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, []);

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
                        {/* Image Upload */}
                        <div className="md:col-span-2 group">
                            <label className="text-xs font-black text-[#49659c] uppercase tracking-widest mb-2 block">Franchise Branding</label>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept={STORE_IMAGE_ACCEPT}
                                onChange={handleStoreImageChange}
                                className="hidden"
                                id="franchise-store-image"
                            />
                            <div
                                role="button"
                                tabIndex={0}
                                onClick={() => fileInputRef.current?.click()}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click(); } }}
                                className="h-32 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-[#0d59f2]/40 hover:bg-[#0d59f2]/5 transition-all cursor-pointer relative overflow-hidden"
                            >
                                {formData.storeImage ? (
                                    <>
                                        <img
                                            src={formData.storeImage}
                                            alt="Store image"
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); handleRemoveStoreImage(e); }}
                                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity focus:opacity-100"
                                            aria-label="Remove image"
                                        >
                                            <X size={20} className="text-white" />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Upload size={24} className="text-[#49659c] group-hover:text-[#0d59f2] transition-colors pointer-events-none" />
                                        <span className="text-sm font-bold text-[#49659c] group-hover:text-[#0d121c] dark:group-hover:text-white pointer-events-none">Upload Store Image</span>
                                        <span className="text-[10px] text-[#49659c] pointer-events-none">PNG, JPG up to 5MB</span>
                                    </>
                                )}
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
                                Region/Area *
                            </label>
                            <input
                                required
                                name="region"
                                value={formData.region}
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
                                Manager Email *
                            </label>
                            <input
                                required
                                type="email"
                                name="managerEmail"
                                value={formData.managerEmail}
                                onChange={handleChange}
                                placeholder="manager@franchise.com"
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-medium"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-[#49659c] uppercase tracking-widest flex items-center gap-2">
                                <Phone size={14} />
                                Contact Number *
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

                        <div className="space-y-2">
                            <label className="text-xs font-black text-[#49659c] uppercase tracking-widest flex items-center gap-2">
                                <Phone size={14} />
                                Manager Phone *
                            </label>
                            <input
                                required
                                name="managerPhone"
                                value={formData.managerPhone}
                                onChange={handleChange}
                                placeholder="+1 000 000 0000"
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-medium"
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-black text-[#49659c] uppercase tracking-widest flex items-center gap-2">
                                <User size={14} />
                                In-charge Name *
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

                        <div className="md:col-span-2 flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                            <input
                                type="checkbox"
                                id="legalDocuments"
                                name="legalDocumentsCollected"
                                checked={formData.legalDocumentsCollected}
                                onChange={handleChange}
                                className="w-4 h-4 text-[#0d59f2] bg-gray-100 border-gray-300 rounded focus:ring-[#0d59f2] focus:ring-2"
                            />
                            <label htmlFor="legalDocuments" className="text-sm text-[#49659c] dark:text-gray-400">
                                Legal documents have been collected for this franchise
                            </label>
                        </div>
                    </div>

                    <div className="mt-10 flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="flex-1 py-4 border border-gray-200 dark:border-gray-800 rounded-2xl text-sm font-bold text-[#49659c] hover:bg-gray-50 dark:hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel Project
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-2 flex-[2] bg-[#0d59f2] text-white py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#0d59f2]/90 shadow-xl shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Creating...</span>
                                </>
                            ) : (
                                <>
                                    <Save size={20} />
                                    <span>Establish Franchise</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
