'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { driverService } from '@/services/driverService';
import { franchiseService } from '@/services/franchiseService';
import type { CreateDriverRequest, EmploymentType, TransmissionType, CarCategory } from '@/lib/types/driver';
import type { Franchise } from '@/lib/types/franchise';
import {
  EMPLOYMENT_TYPE_OPTIONS,
  TRANSMISSION_TYPE_OPTIONS,
  CAR_CATEGORY_OPTIONS,
  EMERGENCY_CONTACT_RELATIONS,
} from '@/lib/types/driver';
import { useAppSelector } from '@/lib/hooks';
import { selectCurrentUser } from '@/lib/features/auth/authSlice';
import { useToast } from '@/hooks/useToast';
import { Toast } from '@/components/ui/Toast';

// Icons
const UserPlusIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
  </svg>
);

const CameraIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const CheckIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const RefreshIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const InfoIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// Generate random password
const generatePassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Form Input Component
interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  required?: boolean;
}

const FormInput = ({ label, error, required, className = '', ...props }: FormInputProps) => (
  <div className={className}>
    <label className="block text-sm font-medium text-gray-300 mb-1.5">
      {label}
      {required && <span className="text-red-400 ml-1">*</span>}
    </label>
    <input
      {...props}
      className={`w-full rounded-lg border ${
        error ? 'border-red-500' : 'border-gray-700'
      } bg-gray-900/50 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors`}
    />
    {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
  </div>
);

// Form Select Component
interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  required?: boolean;
  options: { value: string; label: string }[];
}

const FormSelect = ({ label, error, required, options, ...props }: FormSelectProps) => (
  <div>
    <label className="block text-sm font-medium text-gray-300 mb-1.5">
      {label}
      {required && <span className="text-red-400 ml-1">*</span>}
    </label>
    <select
      {...props}
      className={`w-full rounded-lg border ${
        error ? 'border-red-500' : 'border-gray-700'
      } bg-gray-900/50 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors`}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
  </div>
);

// Checkbox Component
interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const Checkbox = ({ label, ...props }: CheckboxProps) => (
  <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-700 bg-gray-900/30 cursor-pointer hover:bg-gray-800/50 transition-colors">
    <input
      type="checkbox"
      {...props}
      className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
    />
    <span className="text-sm text-gray-300">{label}</span>
  </label>
);

// Section Component
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold text-white border-b border-gray-800 pb-2">{title}</h3>
    {children}
  </div>
);

export default function CreateDriverPage() {
  const router = useRouter();
  const currentUser = useAppSelector(selectCurrentUser);
  const toast = useToast();

  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<CreateDriverRequest>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    altPhone: '',
    password: generatePassword(),
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    licenseNumber: '',
    licenseType: '',
    employmentType: 'full time',
    licenseExpDate: '',
    bankAccountName: '',
    bankAccountNumber: '',
    bankIfscCode: '',
    aadharCard: false,
    license: false,
    educationCert: false,
    previousExp: false,
    franchiseId: '',
    transmissionTypes: [],
    carCategories: [],
  });

  // Fetch franchises for dropdown
  useEffect(() => {
    const fetchFranchises = async () => {
      try {
        const response = await franchiseService.getFranchises({ limit: 100 });
        if (response.data?.success) {
          setFranchises(response.data.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch franchises:', error);
      }
    };
    fetchFranchises();
  }, []);

  const handleInputChange = (field: keyof CreateDriverRequest, value: string | boolean | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field is modified
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleTransmissionToggle = (type: TransmissionType) => {
    setFormData((prev) => {
      const current = prev.transmissionTypes || [];
      const updated = current.includes(type)
        ? current.filter((t) => t !== type)
        : [...current, type];
      return { ...prev, transmissionTypes: updated };
    });
  };

  const handleCarCategoryToggle = (category: CarCategory) => {
    setFormData((prev) => {
      const current = prev.carCategories || [];
      const updated = current.includes(category)
        ? current.filter((c) => c !== category)
        : [...current, category];
      return { ...prev, carCategories: updated };
    });
  };

  const regeneratePassword = () => {
    handleInputChange('password', generatePassword());
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    const requiredFields: (keyof CreateDriverRequest)[] = [
      'firstName', 'lastName', 'phone', 'email', 'password',
      'emergencyContactName', 'emergencyContactPhone', 'emergencyContactRelation',
      'address', 'city', 'state', 'pincode',
      'licenseNumber', 'licenseExpDate',
      'bankAccountName', 'bankAccountNumber', 'bankIfscCode',
    ];

    requiredFields.forEach((field) => {
      const value = formData[field];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        newErrors[field] = 'This field is required';
      }
    });

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Phone validation
    if (formData.phone && !/^\+?[\d\s-]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number';
    }

    // Franchise validation for admin
    if (!formData.franchiseId) {
      newErrors.franchiseId = 'Please select a franchise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fill in all required fields correctly');
      return;
    }

    setLoading(true);
    try {
      // Format licenseExpDate to ISO string
      const submitData = {
        ...formData,
        licenseExpDate: new Date(formData.licenseExpDate).toISOString(),
      };

      const response = await driverService.createDriver(submitData);

      if (response.data?.success || response.data?.data) {
        toast.success('Driver registered successfully!');
        // Redirect after a short delay to show the toast
        setTimeout(() => {
          router.push('/admin/drivers');
        }, 1500);
      }
    } catch (error: any) {
      console.error('Failed to create driver:', error);
      
      // Handle different error types
      let errorMessage = 'Failed to register driver. Please try again.';
      
      if (error.response?.status === 409) {
        // Conflict - duplicate entry
        const conflictMessage = error.response?.data?.message || error.response?.data?.error;
        if (conflictMessage) {
          errorMessage = conflictMessage;
        } else {
          errorMessage = 'A driver with this email or license number already exists.';
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Log detailed error for debugging
      if (error.response?.data) {
        console.error('Error response:', error.response.data);
        console.error('Status code:', error.response.status);
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/drivers');
  };

  return (
    <DashboardLayout
      user={{ name: currentUser?.fullName || 'Admin User', role: currentUser?.role || 'Administrator' }}
      searchPlaceholder="Search..."
      liveStatus={true}
      notificationCount={0}
    >
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
            <UserPlusIcon className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Driver Registration</h1>
            <p className="text-sm text-gray-400">Onboard a new driver to the Dybros platform.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Personal Information */}
        <Section title="1. Personal Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Profile Image Upload (placeholder) */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-800 border-2 border-dashed border-gray-600">
                  <CameraIcon className="h-8 w-8 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Profile Image</p>
                  <p className="text-xs text-gray-400">JPG or PNG, max 5MB</p>
                  <button
                    type="button"
                    className="mt-2 text-xs text-blue-400 hover:text-blue-300"
                  >
                    Upload Photo
                  </button>
                </div>
              </div>
            </div>

            <FormInput
              label="First Name"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              placeholder="e.g. Rahul"
              required
              error={errors.firstName}
            />

            <FormInput
              label="Last Name"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              placeholder="e.g. Sharma"
              required
              error={errors.lastName}
            />

            <FormInput
              label="Phone Number"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="+91 00000 00000"
              required
              error={errors.phone}
            />

            <FormInput
              label="Alternate Phone"
              type="tel"
              value={formData.altPhone}
              onChange={(e) => handleInputChange('altPhone', e.target.value)}
              placeholder="+91 00000 00000"
              error={errors.altPhone}
            />

            <FormInput
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="rahul.sharma@example.com"
              required
              error={errors.email}
            />

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Generated Password
                <span className="text-red-400 ml-1">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="flex-1 rounded-lg border border-gray-700 bg-gray-900/50 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={regeneratePassword}
                  className="px-3 py-2.5 rounded-lg border border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
                  title="Generate new password"
                >
                  <RefreshIcon className="h-4 w-4" />
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
            </div>
          </div>
        </Section>

        {/* Section 2: Emergency Contact & Address */}
        <Section title="2. Emergency Contact & Address">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormInput
              label="Contact Name"
              value={formData.emergencyContactName}
              onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
              placeholder="Emergency contact name"
              required
              error={errors.emergencyContactName}
            />

            <FormInput
              label="Contact Phone"
              type="tel"
              value={formData.emergencyContactPhone}
              onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)}
              placeholder="+91 00000 00000"
              required
              error={errors.emergencyContactPhone}
            />

            <FormSelect
              label="Relation"
              value={formData.emergencyContactRelation}
              onChange={(e) => handleInputChange('emergencyContactRelation', e.target.value)}
              required
              error={errors.emergencyContactRelation}
              options={[
                { value: '', label: 'Select relation' },
                ...EMERGENCY_CONTACT_RELATIONS.map((r) => ({ value: r, label: r })),
              ]}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <FormInput
              label="Street Address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="123, Street Name, Area"
              required
              error={errors.address}
              className="md:col-span-1"
            />

            <FormInput
              label="City"
              value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              placeholder="City"
              required
              error={errors.city}
            />

            <FormInput
              label="State"
              value={formData.state}
              onChange={(e) => handleInputChange('state', e.target.value)}
              placeholder="State"
              required
              error={errors.state}
            />

            <FormInput
              label="Pincode"
              value={formData.pincode}
              onChange={(e) => handleInputChange('pincode', e.target.value)}
              placeholder="600000"
              required
              error={errors.pincode}
            />
          </div>
        </Section>

        {/* Section 3: Professional & Banking Details */}
        <Section title="3. Professional & Banking Details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="License Number"
              value={formData.licenseNumber}
              onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
              placeholder="DL-XXXXXXXXXXX"
              required
              error={errors.licenseNumber}
            />

            <FormInput
              label="License Expiry Date"
              type="date"
              value={formData.licenseExpDate}
              onChange={(e) => handleInputChange('licenseExpDate', e.target.value)}
              required
              error={errors.licenseExpDate}
            />

            <FormInput
              label="License Type"
              value={formData.licenseType}
              onChange={(e) => handleInputChange('licenseType', e.target.value)}
              placeholder="e.g. LMV, HMV"
            />

            <FormSelect
              label="Employment Type"
              value={formData.employmentType}
              onChange={(e) => handleInputChange('employmentType', e.target.value as EmploymentType)}
              required
              options={EMPLOYMENT_TYPE_OPTIONS}
            />

            <FormInput
              label="Bank Account Name"
              value={formData.bankAccountName}
              onChange={(e) => handleInputChange('bankAccountName', e.target.value)}
              placeholder="Name as per Passbook"
              required
              error={errors.bankAccountName}
            />

            <FormInput
              label="Bank Account Number"
              value={formData.bankAccountNumber}
              onChange={(e) => handleInputChange('bankAccountNumber', e.target.value)}
              placeholder="Account Number"
              required
              error={errors.bankAccountNumber}
            />

            <FormInput
              label="IFSC Code"
              value={formData.bankIfscCode}
              onChange={(e) => handleInputChange('bankIfscCode', e.target.value)}
              placeholder="SBIN000XXXX"
              required
              error={errors.bankIfscCode}
            />
          </div>

          {/* Car Types / Transmission Types */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">Car Types (Transmission)</label>
            <div className="flex flex-wrap gap-3">
              {TRANSMISSION_TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleTransmissionToggle(option.value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    formData.transmissionTypes?.includes(option.value)
                      ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                      : 'bg-gray-900/50 border-gray-700 text-gray-400 hover:bg-gray-800'
                  }`}
                >
                  {formData.transmissionTypes?.includes(option.value) && (
                    <CheckIcon className="h-4 w-4" />
                  )}
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Car Categories */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">Car Categories</label>
            <div className="flex flex-wrap gap-3">
              {CAR_CATEGORY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleCarCategoryToggle(option.value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    formData.carCategories?.includes(option.value)
                      ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                      : 'bg-gray-900/50 border-gray-700 text-gray-400 hover:bg-gray-800'
                  }`}
                >
                  {formData.carCategories?.includes(option.value) && (
                    <CheckIcon className="h-4 w-4" />
                  )}
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </Section>

        {/* Section 4: Compliance & Franchise */}
        <Section title="4. Compliance & Franchise">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Document Checklist */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Document Checklist</label>
              <div className="space-y-2">
                <Checkbox
                  label="Aadhar Card Verification"
                  checked={formData.aadharCard}
                  onChange={(e) => handleInputChange('aadharCard', e.target.checked)}
                />
                <Checkbox
                  label="Driving License Verification"
                  checked={formData.license}
                  onChange={(e) => handleInputChange('license', e.target.checked)}
                />
                <Checkbox
                  label="Education Certificate"
                  checked={formData.educationCert}
                  onChange={(e) => handleInputChange('educationCert', e.target.checked)}
                />
                <Checkbox
                  label="Previous Experience Certificate"
                  checked={formData.previousExp}
                  onChange={(e) => handleInputChange('previousExp', e.target.checked)}
                />
              </div>
            </div>

            {/* Franchise Assignment */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Franchise Assignment
                <span className="text-red-400 ml-1">*</span>
              </label>
              <select
                value={formData.franchiseId}
                onChange={(e) => handleInputChange('franchiseId', e.target.value)}
                className={`w-full rounded-lg border ${
                  errors.franchiseId ? 'border-red-500' : 'border-gray-700'
                } bg-gray-900/50 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors`}
              >
                <option value="">Select Franchise</option>
                {franchises.map((franchise) => (
                  <option key={franchise.id} value={franchise.id}>
                    {franchise.name} ({franchise.code})
                  </option>
                ))}
              </select>
              {errors.franchiseId && <p className="mt-1 text-xs text-red-400">{errors.franchiseId}</p>}
              <p className="mt-2 text-xs text-gray-500">
                * Assigned franchise will manage driver payroll.
              </p>

              {/* Info Box */}
              <div className="mt-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-start gap-3">
                  <InfoIcon className="h-5 w-5 text-blue-400 mt-0.5" />
                  <p className="text-sm text-blue-300">
                    By submitting this form, you certify that all information provided is accurate and complies with Dybros safety guidelines.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-6 border-t border-gray-800">
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="px-6 py-2.5 rounded-lg border border-gray-700 bg-gray-800 text-sm font-medium text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-lg bg-blue-500 text-sm font-medium text-white hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Registering...
              </>
            ) : (
              'Register Driver'
            )}
          </button>
        </div>
      </form>
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toast.toasts.map((t) => (
          <Toast
            key={t.id}
            message={t.message}
            type={t.type}
            onClose={() => toast.removeToast(t.id)}
          />
        ))}
      </div>
    </DashboardLayout>
  );
}
