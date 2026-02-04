"use client";

import React, { useState } from 'react';
import {
    Upload, Save, User, Phone, MapPin, Briefcase, CreditCard,
    FileText, RotateCcw, Shield, Mail, Calendar, AlertCircle, Users, CheckCircle, Info
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

const CAR_CATEGORY = [
    { label: 'Manual', value: 'MANUAL' },
    { label: 'Automatic', value: 'AUTOMATIC' },
    { label: 'Premium', value: 'PREMIUM' },
    { label: 'Luxury', value: 'LUXURY' },
] as const;

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
            franchiseId: driver.franchiseId !== null && driver.franchiseId !== undefined ? driver.franchiseId : '',
            status: driver.status,
            // Ensure email and password are always defined for controlled inputs
            email: (driver as any).email || '',
            password: '',
            carTypes: (driver as any).carTypes || []
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
        franchiseId: '',
        carTypes: []
    };
};

export function DriverForm({ isOpen, onClose, driver }: DriverFormProps) {
    const dispatch = useAppDispatch();
    const { toast } = useToast();
    const franchiseList = useAppSelector(state => state.franchise.list);
    const [licenseList, setLicenseList] = useState<string[]>([
        'LMV', 'LMV-TR', 'HMV', 'HPV', 'MPV', 'IDP',
    ]);

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Helper to get initial form data with proper franchiseId mapping
    const getInitialFormDataWithFranchise = React.useCallback((driver: GetDriver | null) => {
        const initialData = getInitialFormData(driver);
        if (driver && driver.franchiseId) {
            const matchingFranchise = franchiseList.find(f => {
                if (typeof f._id === 'string') {
                    const numId = parseInt(f._id.replace(/-/g, '').substring(0, 10), 16);
                    return numId === driver.franchiseId;
                }
                return false;
            });
            if (matchingFranchise) {
                initialData.franchiseId = matchingFranchise._id;
            }
        }
        return initialData;
    }, [franchiseList]);

    const [formData, setFormData] = useState(getInitialFormDataWithFranchise(driver));

    React.useEffect(() => {
        if (isOpen) {
            setFormData(getInitialFormDataWithFranchise(driver));
        }
    }, [isOpen, driver, getInitialFormDataWithFranchise]);

    const handleGeneratePassword = React.useCallback(() => {
        setFormData(prev => ({ ...prev, password: generateDriverPassword() }));
    }, []);

    const handleDocToggle = React.useCallback((doc: string) => {
        setFormData(prev => {
            const docs = prev.documentsCollected || [];
            if (docs.includes(doc)) {
                return { ...prev, documentsCollected: docs.filter(d => d !== doc) };
            } else {
                return { ...prev, documentsCollected: [...docs, doc] };
            }
        });
    }, []);

    const handleCategoryToggle = React.useCallback((category: any) => {
        setFormData(prev => {
            const types = prev.carTypes || [];
            if (types.includes(category)) {
                return { ...prev, carTypes: types.filter(t => t !== category) };
            } else {
                return { ...prev, carTypes: [...types, category] };
            }
        });
    }, []);

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
                const toNull = (val: any) => (val === '' || val === undefined) ? null : val;

                const updatePayload: UpdateDriverInput = {
                    _id: driver._id, userId: driver.userId,
                    firstName: toNull(formData.firstName), lastName: toNull(formData.lastName),
                    email: toNull(formData.email),
                    driverPhone: toNull(formData.driverPhone), driverAltPhone: toNull(formData.driverAltPhone),
                    dateOfBirth: toNull(formData.dateOfBirth), gender: formData.gender || null,
                    profilePhoto: toNull(formData.profilePhoto), licenseNumber: toNull(formData.licenseNumber),
                    licenseType: toNull(formData.licenseType), licenseExpiryDate: toNull(formData.licenseExpiryDate),
                    address: toNull(formData.address), city: toNull(formData.city),
                    state: toNull(formData.state), pincode: toNull(formData.pincode),
                    franchiseId: formData.franchiseId && formData.franchiseId !== '' ? (typeof formData.franchiseId === 'string' ? formData.franchiseId : formData.franchiseId.toString()) : null,
                    dateOfJoining: toNull(formData.dateOfJoining),
                    assignedCity: toNull(formData.assignedCity), employmentType: formData.employmentType || null,
                    bankAccountNumber: toNull(formData.bankAccountNumber), accountHolderName: toNull(formData.accountHolderName),
                    ifscCode: toNull(formData.ifscCode), upiId: toNull(formData.upiId),
                    contactName: toNull(formData.contactName), contactNumber: toNull(formData.contactNumber),
                    relationship: toNull(formData.relationship),
                    documentsCollected: formData.documentsCollected && formData.documentsCollected.length > 0 ? formData.documentsCollected : null,
                    carTypes: formData.carTypes && formData.carTypes.length > 0 ? formData.carTypes : null
                };
                const driverId = (driver as any).id || driver._id;
                await dispatch(updateDriver({ id: driverId, data: updatePayload })).unwrap();
                toast({ title: 'Success', description: 'Driver updated successfully', variant: 'success' });
            } else {
                const franchiseId = typeof formData.franchiseId === 'string' ? formData.franchiseId : formData.franchiseId?.toString() || '';
                const payload = { ...formData, franchiseId } as CreateDriverInput;
                await dispatch(createDriver(payload)).unwrap();
                toast({ title: 'Success', description: 'Driver onboarded successfully', variant: 'success' });
            }
            onClose();
        } catch (error: any) {
            toast({ title: 'Error', description: error.message || 'Failed to save driver.', variant: 'error' });
        } finally { setIsSubmitting(false); }
    };

    if (!isOpen) return null;

    // Common input style class (align with dashboard forms)
    const inputClass = "w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-medium";
    const labelClass = "text-xs font-bold text-[#49659c] dark:text-gray-400 mb-2 block";
    const sectionTitleClass = "text-lg font-bold text-[#0d121c] dark:text-white mb-6 flex items-center gap-2";

    return (
        <div className="w-full min-h-screen p-8 animate-in fade-in duration-300">
            <div className="max-w-5xl mx-auto pb-20">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-[#0d121c] dark:text-white mb-2">Driver Registration</h1>
                    <p className="text-[#49659c] dark:text-gray-400">Onboard a new driver to the Dybros platform.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* 1. Personal Information */}
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
                        <h3 className={sectionTitleClass}>1. Personal Information</h3>
                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            <div className="flex-shrink-0">
                                <div className="size-24 rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-800 flex items-center justify-center text-gray-400 cursor-pointer hover:border-[#0d59f2] hover:text-[#0d59f2] transition-all group">
                                    <Upload size={24} />
                                </div>
                                <p className="text-[10px] text-[#49659c] dark:text-gray-400 mt-2 text-center">Profile Image<br/>JPG or PNG, max 5MB</p>
                            </div>

                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                                <div>
                                    <label className={labelClass}>First Name</label>
                                    <input
                                        required
                                        value={formData.firstName}
                                        onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                        placeholder="e.g. Rahul"
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Last Name</label>
                                    <input
                                        required
                                        value={formData.lastName}
                                        onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                        placeholder="e.g. Sharma"
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Phone Number</label>
                                    <input
                                        required
                                        value={formData.driverPhone}
                                        onChange={e => setFormData({ ...formData, driverPhone: e.target.value })}
                                        placeholder="+91 00000 00000"
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Alternate Phone</label>
                                    <input
                                        value={formData.driverAltPhone || ''}
                                        onChange={e => setFormData({ ...formData, driverAltPhone: e.target.value })}
                                        placeholder="+91 00000 00000"
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Email Address</label>
                                    <input
                                        required
                                        type="email"
                                        value={formData.email || ''}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="driver@example.com"
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Generated Password</label>
                                    <div className="relative">
                                        <input
                                            readOnly={!driver}
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            className={`${inputClass} font-mono`}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleGeneratePassword}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0d59f2] hover:text-white transition-colors"
                                        >
                                            <RotateCcw size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Emergency Contact & Address */}
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
                        <h3 className={sectionTitleClass}>2. Emergency Contact & Address</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div>
                                <label className={labelClass}>Contact Name</label>
                                <input
                                    value={formData.contactName || ''}
                                    onChange={e => setFormData({ ...formData, contactName: e.target.value })}
                                    placeholder="Emergency contact name"
                                    className={inputClass}
                                    required
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Contact Phone</label>
                                <input
                                    value={formData.contactNumber || ''}
                                    onChange={e => setFormData({ ...formData, contactNumber: e.target.value })}
                                    placeholder="+91 00000 00000"
                                    className={inputClass}
                                    required
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Relation</label>
                                <select 
                                    value={formData.relationship || ''}
                                    onChange={e => setFormData({ ...formData, relationship: e.target.value })}
                                    className={inputClass}
                                >
                                    <option value="">Select Relation</option>
                                    <option value="Spouse">Spouse</option>
                                    <option value="Parent">Parent</option>
                                    <option value="Sibling">Sibling</option>
                                    <option value="Friend">Friend</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className={labelClass}>Street Address</label>
                                <input
                                    value={formData.address || ''}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    placeholder="123, Street Name, Area"
                                    className={inputClass}
                                    required
                                />
                            </div>
                            <div>
                                <label className={labelClass}>City</label>
                                <input
                                    value={formData.city || ''}
                                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                                    placeholder="City"
                                    className={inputClass}
                                    required
                                />
                            </div>
                            <div>
                                <label className={labelClass}>State</label>
                                <input
                                    value={formData.state || ''}
                                    onChange={e => setFormData({ ...formData, state: e.target.value })}
                                    placeholder="State"
                                    className={inputClass}
                                    required
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Pincode</label>
                                <input
                                    value={formData.pincode || ''}
                                    onChange={e => setFormData({ ...formData, pincode: e.target.value })}
                                    placeholder="000000"
                                    className={inputClass}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* 3. Professional & Banking Details */}
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
                        <h3 className={sectionTitleClass}>3. Professional & Banking Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className={labelClass}>License Number</label>
                                <input
                                    required
                                    value={formData.licenseNumber || ''}
                                    onChange={e => setFormData({ ...formData, licenseNumber: e.target.value })}
                                    placeholder="DL-XXXXXXXXXXXX"
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>License Type</label>
                                <select
                                    required
                                    value={formData.licenseType || ''}
                                    onChange={e => setFormData({ ...formData, licenseType: e.target.value })}
                                    className={inputClass}
                                >
                                    <option value="">Select License Type</option>
                                    {licenseList.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>License Expiry Date</label>
                                <input
                                    type="date"
                                    value={formData.licenseExpiryDate || ''}
                                    onChange={e => setFormData({ ...formData, licenseExpiryDate: e.target.value })}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Bank Account Name</label>
                                <input
                                    value={formData.accountHolderName || ''}
                                    onChange={e => setFormData({ ...formData, accountHolderName: e.target.value })}
                                    placeholder="Name as per Passbook"
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Bank Account Number</label>
                                <input
                                    value={formData.bankAccountNumber || ''}
                                    onChange={e => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                                    placeholder="Account Number"
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>IFSC Code</label>
                                <input
                                    value={formData.ifscCode || ''}
                                    onChange={e => setFormData({ ...formData, ifscCode: e.target.value })}
                                    placeholder="SBIN000XXXX"
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Employment Type</label>
                                <select
                                    value={formData.employmentType}
                                    onChange={e => setFormData({ ...formData, employmentType: e.target.value as EmploymentType })}
                                    className={inputClass}
                                >
                                    <option value={EmploymentType.FULL_TIME}>Full-time</option>
                                    <option value={EmploymentType.PART_TIME}>Part-time</option>
                                    <option value={EmploymentType.CONTRACT}>Contract</option>
                                </select>
                            </div>
                        </div>
                        
                        <div>
                            <label className={labelClass}>Car Types</label>
                            <div className="flex gap-6 mt-3">
                                {CAR_CATEGORY.map(category => {
                                    const selected = formData.carTypes?.includes(category.value as any);
                                    return (
                                        <label key={category.value} className="flex items-center gap-3 cursor-pointer group">
                                            <div className={`size-5 rounded border flex items-center justify-center transition-colors ${selected ? 'bg-[#0d59f2] border-[#0d59f2]' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-800 group-hover:border-gray-300 dark:group-hover:border-gray-600'}`}>
                                                {selected && <CheckCircle size={12} className="text-white" />}
                                            </div>
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={selected}
                                                onChange={() => handleCategoryToggle(category.value)}
                                            />
                                            <span className="text-[#0d121c] dark:text-gray-300 text-sm">{category.label}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* 4. Compliance & Franchise */}
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
                        <h3 className={sectionTitleClass}>4. Compliance & Franchise</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className={labelClass}>Document Checklist</label>
                                <div className="space-y-3 mt-2">
                                    {DOCUMENT_OPTIONS.map(doc => (
                                        <div key={doc} className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
                                            <span className="text-sm text-[#0d121c] dark:text-gray-300">{doc}</span>
                                            <label className="cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.documentsCollected?.includes(doc)}
                                                    onChange={() => handleDocToggle(doc)}
                                                    className="h-5 w-5 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-[#0d59f2] focus:ring-0"
                                                />
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="space-y-6">
                                <div>
                                    <label className={labelClass}>Franchise Assignment</label>
                                    <select
                                        required
                                        value={formData.franchiseId?.toString() || ''}
                                        onChange={e => setFormData({ ...formData, franchiseId: e.target.value })}
                                        className={inputClass}
                                    >
                                        <option value="">Select Franchise</option>
                                        {franchiseList.map(f => (
                                            <option key={f._id} value={f._id}>{f.name}</option>
                                        ))}
                                    </select>
                                    <p className="text-[10px] text-gray-500 mt-2 italic">* Assigned franchise will manage driver payroll.</p>
                                </div>
                                
                                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex gap-3">
                                    <Info size={20} className="text-[#0d59f2] flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-[#49659c] dark:text-gray-400 leading-relaxed">
                                        By submitting this form, you certify that all information provided is accurate and complies with Dybros safety guidelines.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end gap-4 pt-10 border-t border-gray-200 dark:border-gray-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 rounded-lg border border-gray-200 dark:border-gray-800 text-[#0d121c] dark:text-white text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-3 rounded-lg bg-[#0d59f2] text-white text-sm font-bold hover:bg-[#0d59f2]/90 transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {driver ? 'Update Driver' : 'Register Driver'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
