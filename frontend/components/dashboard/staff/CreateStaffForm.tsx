"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { createStaffMember, updateStaffMember } from '@/lib/features/staff/staffSlice';
import { useToast } from '@/components/ui/toast';
import {
    X,
    Upload,
    Save,
    User,
    Mail,
    Phone,
    MapPin,
    Building,
    Shield,
    RotateCcw,
    FileText,
    Users,
    AlertCircle
} from 'lucide-react';
import { Staff } from '@/lib/types/staff';
import { generateStaffPassword } from '@/lib/utils/staff-utils';
import { DEFAULT_FRANCHISE_ID } from '@/lib/constants/auth';

// Constants
const DOCUMENT_TYPES = ['Govt Identity', 'Address Proof', 'Educational Certificates', 'Previous Experience', 'Police Verification'] as const;

const INPUT_CLASSES = "w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-medium";

interface CreateStaffFormProps {
    onClose: () => void;
    editingStaff?: Staff | null;
}

export function CreateStaffForm({ onClose, editingStaff }: CreateStaffFormProps) {
    const dispatch = useAppDispatch();
    const { list: franchises } = useAppSelector((state) => state.franchise);
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Helper function to get initial form data
    const getInitialFormData = useCallback((): Partial<Staff> => {
        if (editingStaff) {
            return {
                ...editingStaff,
                name: editingStaff.name || '',
                email: editingStaff.email || '',
                phone: editingStaff.phone || '',
                password: editingStaff.password || generateStaffPassword(),
                franchiseId: editingStaff.franchiseId || '',
                salary: editingStaff.monthlySalary || editingStaff.salary || 0,
                monthlySalary: editingStaff.monthlySalary || editingStaff.salary || 0,
                address: editingStaff.address || '',
                emergencyContact: editingStaff.emergencyContact || '',
                relationship: editingStaff.emergencyContactRelation || editingStaff.relationship || '',
                emergencyContactRelation: editingStaff.emergencyContactRelation || editingStaff.relationship || '',
                documentsCollected: [
                    editingStaff.govtId ? 'Govt Identity' : '',
                    editingStaff.addressProof ? 'Address Proof' : '',
                    editingStaff.certificates ? 'Educational Certificates' : '',
                    editingStaff.previousExperienceCert ? 'Previous Experience' : '',
                ].filter(Boolean),
                status: editingStaff.status || 'active',
            };
        }

        return {
            name: '',
            email: '',
            phone: '',
            password: generateStaffPassword(),
            franchiseId: '',
            salary: 0,
            monthlySalary: 0,
            address: '',
            emergencyContact: '',
            relationship: '',
            emergencyContactRelation: '',
            documentsCollected: [],
            status: 'active'
        };
    }, [editingStaff]);

    const [formData, setFormData] = useState<Partial<Staff>>(() => getInitialFormData());

    const handleGeneratePassword = useCallback(() => {
        setFormData(prev => ({ ...prev, password: generateStaffPassword() }));
    }, []);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const docFlags = buildDocumentFlags(formData.documentsCollected);
            const staffId = editingStaff?.id || editingStaff?._id || '';

            if (editingStaff) {
                // Update existing staff
                const updateData = {
                    name: formData.name || '',
                    email: formData.email || '',
                    phone: formData.phone || '',
                    franchiseId: DEFAULT_FRANCHISE_ID,
                    monthlySalary: Number(formData.salary) || formData.monthlySalary || 0,
                    address: formData.address || '',
                    emergencyContact: formData.emergencyContact || '',
                    emergencyContactRelation: formData.relationship || formData.emergencyContactRelation || '',
                    ...docFlags,
                    profilePic: formData.profilePic || null,
                };

                await dispatch(updateStaffMember({ id: staffId, data: updateData })).unwrap();
                
                toast({
                    title: 'Success',
                    description: 'Staff member updated successfully',
                    variant: 'success',
                });
            } else {
                // Create new staff
                if (!formData.password) {
                    toast({
                        title: 'Error',
                        description: 'Password is required',
                        variant: 'error',
                    });
                    setIsSubmitting(false);
                    return;
                }

                const createData = {
                    name: formData.name || '',
                    email: formData.email || '',
                    phone: formData.phone || '',
                    password: formData.password || '',
                    franchiseId: DEFAULT_FRANCHISE_ID,
                    monthlySalary: Number(formData.salary) || 0,
                    address: formData.address || '',
                    emergencyContact: formData.emergencyContact || '',
                    emergencyContactRelation: formData.relationship || '',
                    ...docFlags,
                    profilePic: formData.profilePic || null,
                };

                await dispatch(createStaffMember(createData)).unwrap();
                
                toast({
                    title: 'Success',
                    description: 'Staff member created successfully',
                    variant: 'success',
                });
            }
            onClose();
        } catch (error: any) {
            const errorMessage = getErrorMessage(
                error,
                editingStaff ? 'Failed to update staff member' : 'Failed to create staff member'
            );
            
            toast({
                title: 'Error',
                description: errorMessage,
                variant: 'error',
            });
        } finally {
            setIsSubmitting(false);
        }
    }, [formData, editingStaff, dispatch, toast, onClose, buildDocumentFlags, getErrorMessage]);

    const handleDocToggle = useCallback((doc: string) => {
        setFormData(prev => {
            const docs = prev.documentsCollected || [];
            if (docs.includes(doc)) {
                return { ...prev, documentsCollected: docs.filter(d => d !== doc) };
            } else {
                return { ...prev, documentsCollected: [...docs, doc] };
            }
        });
    }, []);

    // Helper function to extract error message
    const getErrorMessage = useCallback((error: any, defaultMessage: string): string => {
        if (error?.response?.data?.error) {
            return error.response.data.error;
        }
        if (error?.response?.data?.message) {
            return error.response.data.message;
        }
        if (error?.message) {
            return error.message;
        }
        return defaultMessage;
    }, []);

    // Helper function to build document flags
    const buildDocumentFlags = useCallback((documentsCollected: string[] = []) => {
        return {
            govtId: documentsCollected.includes('Govt Identity'),
            addressProof: documentsCollected.includes('Address Proof'),
            certificates: documentsCollected.includes('Educational Certificates'),
            previousExperienceCert: documentsCollected.includes('Previous Experience'),
        };
    }, []);

    // Memoize form field handlers
    const handleFieldChange = useCallback((field: keyof Staff) => (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const value = field === 'salary' ? Number(e.target.value) : e.target.value;
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    return (
        <div className="fixed inset-0 bg-[#0d121c]/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#101622] w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 z-10 px-8 py-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white/80 dark:bg-gray-800/80 backdrop-blur-md">
                    <div>
                        <h3 className="text-xl font-bold dark:text-white">{editingStaff ? 'Update Staff Member' : 'New Staff Enrollment'}</h3>
                        <p className="text-xs text-[#49659c] font-medium uppercase tracking-wider mt-1">Personnel management & operational setup</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all text-[#49659c]">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Profile Photo Upload */}
                        <div className="md:col-span-2 flex items-center gap-6">
                            <div className="size-24 rounded-2xl bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-200 dark:border-gray-800 flex items-center justify-center text-[#49659c] hover:border-[#0d59f2]/40 hover:bg-[#0d59f2]/5 transition-all cursor-pointer group">
                                <Upload size={24} className="group-hover:text-[#0d59f2] transition-colors" />
                            </div>
                            <div>
                                <h4 className="font-bold dark:text-white">Profile Picture</h4>
                                <p className="text-sm text-[#49659c]">PNG, JPG up to 5MB. Square aspect ratio preferred.</p>
                            </div>
                        </div>

                        {/* Basic Info */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-[#49659c] uppercase tracking-widest flex items-center gap-2">
                                    <User size={14} /> Full Name
                                </label>
                                <input
                                    required
                                    value={formData.name || ''}
                                    onChange={handleFieldChange('name')}
                                    placeholder="e.g. Rahul Sharma"
                                    className={INPUT_CLASSES}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-[#49659c] uppercase tracking-widest flex items-center gap-2">
                                    <Mail size={14} /> Email Address
                                </label>
                                <input
                                    required
                                    type="email"
                                    value={formData.email || ''}
                                    onChange={handleFieldChange('email')}
                                    placeholder="rahul@example.com"
                                    className={INPUT_CLASSES}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-[#49659c] uppercase tracking-widest flex items-center gap-2">
                                    <Phone size={14} /> Phone Number
                                </label>
                                <input
                                    required
                                    value={formData.phone || ''}
                                    onChange={handleFieldChange('phone')}
                                    placeholder="+91 00000 00000"
                                    className={INPUT_CLASSES}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-[#49659c] uppercase tracking-widest flex items-center gap-2">
                                    <Shield size={14} /> Assigned Password
                                </label>
                                <div className="relative">
                                    <input
                                        required
                                        readOnly={!editingStaff}
                                        value={formData.password || ''}
                                        onChange={handleFieldChange('password')}
                                        className="w-full pl-4 pr-12 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-mono text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleGeneratePassword}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[#0d59f2] hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                                    >
                                        <RotateCcw size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Professional Setup */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-[#49659c] uppercase tracking-widest flex items-center gap-2">
                                    <Building size={14} /> Franchise Branch
                                </label>
                                <select
                                    required
                                    value={formData.franchiseId || ''}
                                    onChange={handleFieldChange('franchiseId')}
                                    className={INPUT_CLASSES}
                                >
                                    <option value="">Select Franchise</option>
                                    {franchises.map(f => (
                                        <option key={f._id} value={f._id}>{f.name} ({f.code})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-[#49659c] uppercase tracking-widest flex items-center gap-2">
                                    <div className="font-bold text-green-600">₹</div> Monthly Salary (INR)
                                </label>
                                <input
                                    required
                                    type="number"
                                    value={formData.salary || 0}
                                    onChange={handleFieldChange('salary')}
                                    placeholder="e.g. 25000"
                                    className={INPUT_CLASSES}
                                />
                            </div>
                        </div>

                        <div className="md:col-span-2 space-y-2">
                            <label className="text-xs font-black text-[#49659c] uppercase tracking-widest flex items-center gap-2">
                                <MapPin size={14} /> Residential Address
                            </label>
                            <input
                                required
                                value={formData.address || ''}
                                onChange={handleFieldChange('address')}
                                placeholder="House no, Street, Locality, City, State"
                                className={INPUT_CLASSES}
                            />
                        </div>

                        {/* Emergency Contact */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-[#49659c] uppercase tracking-widest flex items-center gap-2">
                                <AlertCircle size={14} /> Emergency Contact
                            </label>
                            <input
                                value={formData.emergencyContact || ''}
                                onChange={handleFieldChange('emergencyContact')}
                                placeholder="+91 00000 00000"
                                className={INPUT_CLASSES}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-[#49659c] uppercase tracking-widest flex items-center gap-2">
                                <Users size={14} /> Relationship
                            </label>
                            <input
                                value={formData.relationship || ''}
                                onChange={handleFieldChange('relationship')}
                                placeholder="e.g. Father, Spouse"
                                className={INPUT_CLASSES}
                            />
                        </div>

                        {/* Document Collection */}
                        <div className="md:col-span-2 space-y-4">
                            <label className="text-xs font-black text-[#49659c] uppercase tracking-widest flex items-center gap-2">
                                <FileText size={14} /> Documents Verified
                            </label>
                            <div className="flex flex-wrap gap-3">
                                {DOCUMENT_TYPES.map(doc => (
                                    <label key={doc} className="flex items-center gap-3 px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl cursor-pointer hover:border-[#0d59f2]/40 transition-all group">
                                        <input
                                            type="checkbox"
                                            checked={formData.documentsCollected?.includes(doc)}
                                            onChange={() => handleDocToggle(doc)}
                                            className="size-4 rounded border-gray-300 text-[#0d59f2] focus:ring-[#0d59f2]"
                                        />
                                        <span className="text-sm font-bold text-[#49659c] group-hover:text-[#0d121c] dark:group-hover:text-white transition-colors">{doc}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 flex gap-4 bg-gray-50 dark:bg-gray-900/50 p-6 rounded-3xl border border-gray-100 dark:border-gray-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-2xl text-sm font-bold text-[#49659c] hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-[2] bg-[#0d59f2] text-white py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#0d59f2]/90 shadow-xl shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save size={20} />
                            <span>{isSubmitting ? 'Saving...' : (editingStaff ? 'Update Profile' : 'Confirm Enrollment')}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
