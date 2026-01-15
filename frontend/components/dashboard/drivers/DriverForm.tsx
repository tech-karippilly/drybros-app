"use client";

import React, { useState } from 'react';
import {
    X, Upload, Save, User, Phone, MapPin, Briefcase, CreditCard, 
    FileText, RotateCcw, Shield, Mail, Calendar, AlertCircle, Users
} from 'lucide-react';
import { GetDriver, CreateDriverInput, UpdateDriverInput, DriverStatus, GenderType, EmploymentType } from '@/lib/types/drivers';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { createDriver, updateDriver } from '@/lib/features/drivers/driverSlice';
import { useToast } from '@/components/ui/toast';
import { generateDriverPassword } from '@/lib/utils/driver-utils';

interface DriverFormProps {
    isOpen: boolean;
    onClose: () => void;
    driver: GetDriver | null;
}

const DOCUMENT_OPTIONS = ['Govt Identity', 'Address Proof', 'Educational Certificates', 'Previous Experience', 'Police Verification'];

// Moved outside component to prevent recreation on every render
const getInitialFormData = (driver: GetDriver | null): Partial<Omit<CreateDriverInput, 'franchiseId'>> & { franchiseId?: string | number, password?: string, email?: string, status?: DriverStatus } => {
    if (driver) {
         return { 
             ...driver,
             contactName: driver.contactName || '',
             contactNumber: driver.contactNumber || '',
             relationship: driver.relationship || '',
             driverAltPhone: driver.driverAltPhone || '',
             documentsCollected: driver.documentsCollected || [],
             // Ensure we have defaults for controlled inputs
             firstName: driver.firstName || '',
             lastName: driver.lastName || '',
             driverPhone: driver.driverPhone || '',
             city: driver.city || '',
             state: driver.state || '',
             address: driver.address || '',
             pincode: driver.pincode || '',
             licenseNumber: driver.licenseNumber || '',
             franchiseId: driver.franchiseId || '',
             status: driver.status,
             // Ensure email and password are always defined for controlled inputs
             email: (driver as any).email || '',
             password: ''
         };
    }
    return {
        firstName: '', lastName: '', driverPhone: '', driverAltPhone: '',
        email: '', password: generateDriverPassword(), userId: 0,
        gender: GenderType.MALE, employmentType: EmploymentType.FULL_TIME, status: DriverStatus.ACTIVE,
        licenseType: 'LMV', state: '', city: '', assignedCity: '',
        address: '', pincode: '', licenseNumber: '', licenseExpiryDate: '',
        dateOfBirth: '', dateOfJoining: new Date().toISOString().split('T')[0],
        bankAccountNumber: '', accountHolderName: '', ifscCode: '', upiId: '',
        contactName: '', contactNumber: '', relationship: '', profilePhoto: null,
        documentsCollected: [],
        franchiseId: ''
    };
};

export function DriverForm({ isOpen, onClose, driver }: DriverFormProps) {
    const dispatch = useAppDispatch();
    const { toast } = useToast();
    const franchiseList = useAppSelector(state => state.franchise.list);
    
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState(getInitialFormData(driver));

    React.useEffect(() => {
        if (isOpen) {
            setFormData(getInitialFormData(driver));
        }
    }, [isOpen, driver]);

    const handleGeneratePassword = React.useCallback(() => {
        setFormData(prev => ({ ...prev, password: generateDriverPassword() }));
    }, []);

    const handleDocToggle = (doc: string) => {
        setFormData(prev => {
            const docs = prev.documentsCollected || [];
            if (docs.includes(doc)) {
                return { ...prev, documentsCollected: docs.filter(d => d !== doc) };
            } else {
                return { ...prev, documentsCollected: [...docs, doc] };
            }
        });
    };

    const validateForm = () => {
        if (!formData.firstName?.trim()) return false;
        if (!formData.lastName?.trim()) return false;
        if (!formData.email?.trim()) return false;
        if (!formData.driverPhone?.trim()) return false;
        if (!formData.licenseNumber?.trim()) return false;
        if (!formData.franchiseId) return false;
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) { 
            toast({ title: 'Validation Error', description: 'Please check required fields.', variant: 'error' }); 
            return; 
        }
        setIsSubmitting(true);
        try {
            if (driver) {
                const updatePayload: UpdateDriverInput = {
                    _id: driver._id, userId: driver.userId,
                    firstName: formData.firstName || null, lastName: formData.lastName || null,
                    email: formData.email || null,
                    driverPhone: formData.driverPhone || null, driverAltPhone: formData.driverAltPhone || null,
                    dateOfBirth: formData.dateOfBirth || null, gender: formData.gender || null,
                    profilePhoto: formData.profilePhoto || null, licenseNumber: formData.licenseNumber || null,
                    licenseType: formData.licenseType || null, licenseExpiryDate: formData.licenseExpiryDate || null,
                    address: formData.address || null, city: formData.city || null,
                    state: formData.state || null, pincode: formData.pincode || null,
                    franchiseId: formData.franchiseId ? Number(formData.franchiseId) : null, dateOfJoining: formData.dateOfJoining || null,
                    assignedCity: formData.assignedCity || null, employmentType: formData.employmentType || null,
                    bankAccountNumber: formData.bankAccountNumber || null, accountHolderName: formData.accountHolderName || null,
                    ifscCode: formData.ifscCode || null, upiId: formData.upiId || null,
                    contactName: formData.contactName || null, contactNumber: formData.contactNumber || null,
                    relationship: formData.relationship || null,
                    documentsCollected: formData.documentsCollected || null
                };
                await dispatch(updateDriver({ id: driver._id, data: updatePayload })).unwrap();
                toast({ title: 'Success', description: 'Driver updated successfully', variant: 'success' });
            } else {
                const payload = { ...formData, franchiseId: Number(formData.franchiseId) } as CreateDriverInput;
                await dispatch(createDriver(payload)).unwrap();
                toast({ title: 'Success', description: 'Driver onboarded successfully', variant: 'success' });
            }
            onClose();
        } catch (error: any) {
            toast({ title: 'Error', description: error.message || 'Failed to save driver.', variant: 'error' });
        } finally { setIsSubmitting(false); }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-[#0d121c]/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#101622] w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 z-10 px-8 py-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white/80 dark:bg-gray-800/80 backdrop-blur-md">
                    <div>
                        <h3 className="text-xl font-bold dark:text-white">{driver ? 'Update Driver Profile' : 'Onboard New Driver'}</h3>
                        <p className="text-xs text-[#49659c] font-medium uppercase tracking-wider mt-1">{driver ? `ID: ${driver._id}` : 'Fleet personnel management'}</p>
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
                                    <User size={14} /> First Name *
                                </label>
                                <input
                                    required
                                    value={formData.firstName}
                                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                    placeholder="e.g. Rahul"
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-medium"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-[#49659c] uppercase tracking-widest flex items-center gap-2">
                                    <User size={14} /> Last Name *
                                </label>
                                <input
                                    required
                                    value={formData.lastName}
                                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                    placeholder="e.g. Sharma"
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-medium"
                                />
                            </div>
                             <div className="space-y-2">
                                <label className="text-xs font-black text-[#49659c] uppercase tracking-widest flex items-center gap-2">
                                    <Mail size={14} /> Email Address *
                                </label>
                                <input
                                    required
                                    type="email"
                                    value={formData.email || ''}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="driver@example.com"
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                             <div className="space-y-2">
                                <label className="text-xs font-black text-[#49659c] uppercase tracking-widest flex items-center gap-2">
                                    <Phone size={14} /> Phone Number *
                                </label>
                                <input
                                    required
                                    value={formData.driverPhone}
                                    onChange={e => setFormData({ ...formData, driverPhone: e.target.value })}
                                    placeholder="+91 00000 00000"
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-medium"
                                />
                            </div>
                             <div className="space-y-2">
                                <label className="text-xs font-black text-[#49659c] uppercase tracking-widest flex items-center gap-2">
                                    <Phone size={14} /> Alt Phone
                                </label>
                                <input
                                    value={formData.driverAltPhone || ''}
                                    onChange={e => setFormData({ ...formData, driverAltPhone: e.target.value })}
                                    placeholder="Alternative contact"
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-medium"
                                />
                            </div>
                             <div className="space-y-2">
                                <label className="text-xs font-black text-[#49659c] uppercase tracking-widest flex items-center gap-2">
                                    <Shield size={14} /> Assigned Password
                                </label>
                                <div className="relative">
                                    <input
                                        readOnly={!driver}
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
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

                         {/* Emergency Contact */}
                         <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                             <div className="space-y-2">
                                <label className="text-xs font-black text-[#49659c] uppercase tracking-widest flex items-center gap-2">
                                    <AlertCircle size={14} /> Emergency Contact
                                </label>
                                <input
                                    value={formData.contactName || ''}
                                    onChange={e => setFormData({ ...formData, contactName: e.target.value })}
                                    placeholder="Name"
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-medium"
                                />
                            </div>
                             <div className="space-y-2">
                                <label className="text-xs font-black text-[#49659c] uppercase tracking-widest flex items-center gap-2">
                                    <Phone size={14} /> Emergency Number
                                </label>
                                <input
                                    value={formData.contactNumber || ''}
                                    onChange={e => setFormData({ ...formData, contactNumber: e.target.value })}
                                    placeholder="+91..."
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-medium"
                                />
                            </div>
                             <div className="space-y-2">
                                <label className="text-xs font-black text-[#49659c] uppercase tracking-widest flex items-center gap-2">
                                    <Users size={14} /> Relationship
                                </label>
                                <input
                                    value={formData.relationship || ''}
                                    onChange={e => setFormData({ ...formData, relationship: e.target.value })}
                                    placeholder="e.g. Spouse"
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-medium"
                                />
                            </div>
                        </div>

                        {/* Professional Info */}
                         <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-[#49659c] uppercase tracking-widest flex items-center gap-2">
                                        <Briefcase size={14} /> Franchise *
                                    </label>
                                    <select
                                        required
                                        value={formData.franchiseId?.toString() || ''}
                                        onChange={e => setFormData({ ...formData, franchiseId: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-medium"
                                    >
                                        <option value="">Select Franchise</option>
                                        {franchiseList.map(f => (
                                            <option key={f._id} value={f._id}>{f.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-[#49659c] uppercase tracking-widest flex items-center gap-2">
                                        <Calendar size={14} /> Date of Joining
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.dateOfJoining || ''}
                                        onChange={e => setFormData({ ...formData, dateOfJoining: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-medium"
                                    />
                                </div>
                             </div>
                             <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-[#49659c] uppercase tracking-widest flex items-center gap-2">
                                        <Briefcase size={14} /> Employment Type
                                    </label>
                                    <select
                                        value={formData.employmentType}
                                        onChange={e => setFormData({ ...formData, employmentType: Number(e.target.value) })}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-medium"
                                    >
                                        <option value={EmploymentType.FULL_TIME}>Full Time</option>
                                        <option value={EmploymentType.PART_TIME}>Part Time</option>
                                        <option value={EmploymentType.CONTRACT}>Contract</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-[#49659c] uppercase tracking-widest flex items-center gap-2">
                                        <MapPin size={14} /> Assigned City
                                    </label>
                                    <input
                                        value={formData.assignedCity || ''}
                                        onChange={e => setFormData({ ...formData, assignedCity: e.target.value })}
                                        placeholder="City assigned for duty"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-medium"
                                    />
                                </div>
                             </div>
                         </div>
                        
                        {/* Address */}
                        <div className="md:col-span-2 space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                             <div className="space-y-2">
                                <label className="text-xs font-black text-[#49659c] uppercase tracking-widest flex items-center gap-2">
                                    <MapPin size={14} /> Residential Address *
                                </label>
                                <input
                                    required
                                    value={formData.address || ''}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    placeholder="Full address"
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-medium"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-[#49659c] uppercase tracking-widest">City</label>
                                    <input
                                        value={formData.city || ''}
                                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                                        placeholder="City"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-medium"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-[#49659c] uppercase tracking-widest">State</label>
                                    <input
                                        value={formData.state || ''}
                                        onChange={e => setFormData({ ...formData, state: e.target.value })}
                                        placeholder="State"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-medium"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-[#49659c] uppercase tracking-widest">Pincode</label>
                                    <input
                                        value={formData.pincode || ''}
                                        onChange={e => setFormData({ ...formData, pincode: e.target.value })}
                                        placeholder="000000"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-medium"
                                    />
                                </div>
                            </div>
                        </div>

                         {/* Legal & Bank */}
                         <div className="md:col-span-2 space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800 grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div className="space-y-4">
                                  <label className="text-xs font-black text-[#49659c] uppercase tracking-widest flex items-center gap-2">
                                    <FileText size={14} /> License Details
                                </label>
                                 <div className="space-y-2">
                                    <input
                                        required
                                        value={formData.licenseNumber || ''}
                                        onChange={e => setFormData({ ...formData, licenseNumber: e.target.value })}
                                        placeholder="License Number *"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-medium"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                     <input
                                        value={formData.licenseType || ''}
                                        onChange={e => setFormData({ ...formData, licenseType: e.target.value })}
                                        placeholder="Type (LMV)"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-medium"
                                    />
                                     <input
                                        type="date"
                                        value={formData.licenseExpiryDate || ''}
                                        onChange={e => setFormData({ ...formData, licenseExpiryDate: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-medium"
                                    />
                                </div>
                             </div>
                             <div className="space-y-4">
                                  <label className="text-xs font-black text-[#49659c] uppercase tracking-widest flex items-center gap-2">
                                    <CreditCard size={14} /> Bank Information
                                </label>
                                <input
                                    value={formData.accountHolderName || ''}
                                    onChange={e => setFormData({ ...formData, accountHolderName: e.target.value })}
                                    placeholder="Account Holder Name"
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-medium"
                                />
                                <div className="grid grid-cols-2 gap-4">
                                     <input
                                        value={formData.bankAccountNumber || ''}
                                        onChange={e => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                                        placeholder="Account Number"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-medium"
                                    />
                                     <input
                                        value={formData.ifscCode || ''}
                                        onChange={e => setFormData({ ...formData, ifscCode: e.target.value })}
                                        placeholder="IFSC Code"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-medium"
                                    />
                                </div>
                             </div>
                         </div>
                        
                        {/* Documents */}
                        <div className="md:col-span-2 space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                             <label className="text-xs font-black text-[#49659c] uppercase tracking-widest flex items-center gap-2">
                                <FileText size={14} /> Documents Verified
                            </label>
                            <div className="flex flex-wrap gap-3">
                                {DOCUMENT_OPTIONS.map(doc => (
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
                            <span>{driver ? 'Update Driver Profile' : 'Confirm Onboarding'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
