'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { franchiseService } from '@/services/franchiseService';
import { Franchise, UpdateFranchiseRequest } from '@/lib/types/franchise';
import { useAppSelector } from '@/lib/hooks';
import { selectCurrentUser } from '@/lib/features/auth/authSlice';
import { adminRoutes } from '@/lib/constants/routes';
import Button from '@/components/ui/Button';

// Icons
const ArrowLeftIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const BuildingIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const MapPinIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const PhoneIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const MailIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const UserIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const ImageIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const DocumentIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

// Form Input Component
interface FormInputProps {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  required?: boolean;
  placeholder?: string;
  icon?: React.ReactNode;
  error?: string;
  textarea?: boolean;
}

const FormInput = ({ label, name, type = 'text', value, onChange, required, placeholder, icon, error, textarea }: FormInputProps) => {
  const inputClasses = `
    w-full rounded-lg border border-gray-700 bg-gray-800/50 
    px-4 py-3 text-white placeholder-gray-500 
    focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500
    transition-colors
    ${icon ? 'pl-11' : ''}
    ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
  `;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            {icon}
          </div>
        )}
        {textarea ? (
          <textarea
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            rows={3}
            className={inputClasses}
          />
        ) : (
          <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            className={inputClasses}
          />
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
};

// Checkbox Component
interface CheckboxProps {
  label: string;
  name: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const Checkbox = ({ label, name, checked, onChange }: CheckboxProps) => (
  <label className="flex items-center gap-3 cursor-pointer group">
    <div className="relative">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className="peer sr-only"
      />
      <div className="h-5 w-5 rounded border border-gray-600 bg-gray-800 peer-checked:bg-blue-500 peer-checked:border-blue-500 transition-colors"></div>
      {checked && (
        <svg className="absolute inset-0 h-5 w-5 text-white p-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </div>
    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{label}</span>
  </label>
);

// Main Page Component
export default function EditFranchisePage() {
  const router = useRouter();
  const params = useParams();
  const franchiseId = params.id as string;
  const currentUser = useAppSelector(selectCurrentUser);
  
  const [formData, setFormData] = useState<UpdateFranchiseRequest>({
    name: '',
    city: '',
    region: '',
    address: '',
    phone: '',
    email: '',
    inchargeName: '',
    managerEmail: '',
    managerPhone: '',
    storeImage: '',
    legalDocumentsCollected: false,
  });
  
  const [originalFranchise, setOriginalFranchise] = useState<Franchise | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFranchise();
  }, [franchiseId]);

  const fetchFranchise = async () => {
    try {
      setIsLoading(true);
      const response = await franchiseService.getFranchiseById(franchiseId);
      if (response.data?.success) {
        const franchise = response.data.data;
        setOriginalFranchise(franchise);
        setFormData({
          name: franchise.name || '',
          city: franchise.city || '',
          region: franchise.region || '',
          address: franchise.address || '',
          phone: franchise.phone || '',
          email: franchise.email || '',
          inchargeName: franchise.inchargeName || '',
          managerEmail: franchise.managerEmail || '',
          managerPhone: franchise.managerPhone || '',
          storeImage: franchise.storeImage || '',
          legalDocumentsCollected: franchise.legalDocumentsCollected || false,
        });
      }
    } catch (error) {
      console.error('Failed to fetch franchise:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Required fields according to backend schema
    if (!formData.name?.trim()) newErrors.name = 'Franchise name is required';
    if (!formData.city?.trim()) newErrors.city = 'City is required';
    
    // Optional fields - only validate format if provided
    if (formData.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (formData.managerEmail?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.managerEmail)) {
      newErrors.managerEmail = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      // Clean up the form data - remove empty strings for optional fields
      const cleanedData = {
        ...formData,
        region: formData.region?.trim() || undefined,
        address: formData.address?.trim() || undefined,
        phone: formData.phone?.trim() || undefined,
        email: formData.email?.trim() || undefined,
        inchargeName: formData.inchargeName?.trim() || undefined,
        managerEmail: formData.managerEmail?.trim() || undefined,
        managerPhone: formData.managerPhone?.trim() || undefined,
        storeImage: formData.storeImage?.trim() || undefined,
      };
      
      const response = await franchiseService.updateFranchise(franchiseId, cleanedData);
      if (response.data?.success) {
        router.push(adminRoutes.FRANCHISE_DETAIL(franchiseId));
      }
    } catch (error: any) {
      console.error('Failed to update franchise:', error);
      // Display validation errors from backend
      if (error.response?.data?.message) {
        alert(`Error: ${error.response.data.message}`);
      } else {
        alert('Failed to update franchise. Please check your input and try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout
        user={{ name: currentUser?.fullName || 'Admin User', role: currentUser?.role || 'Administrator' }}
        searchPlaceholder="Search franchises..."
        liveStatus={true}
        notificationCount={0}
      >
        <div className="flex items-center justify-center h-96">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      user={{ name: currentUser?.fullName || 'Admin User', role: currentUser?.role || 'Administrator' }}
      searchPlaceholder="Search franchises..."
      liveStatus={true}
      notificationCount={0}
    >
      {/* Back Button */}
      <div className="mb-6">
        <button
          onClick={() => router.push(adminRoutes.FRANCHISE_DETAIL(franchiseId))}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          <span>Back to Franchise Details</span>
        </button>
      </div>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Edit Franchise</h1>
        <p className="mt-1 text-sm text-gray-400">Update franchise information for {originalFranchise?.name || 'this franchise'}.</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-4xl">
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
          {/* Franchise Information Section */}
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <BuildingIcon className="h-5 w-5 text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Franchise Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                label="Franchise Name"
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                required
                placeholder="e.g., Downtown Branch"
                icon={<BuildingIcon className="h-5 w-5" />}
                error={errors.name}
              />

              <FormInput
                label="City"
                name="city"
                value={formData.city || ''}
                onChange={handleChange}
                required
                placeholder="e.g., New York"
                icon={<MapPinIcon className="h-5 w-5" />}
                error={errors.city}
              />
              
              <FormInput
                label="Region"
                name="region"
                value={formData.region || ''}
                onChange={handleChange}
                placeholder="e.g., Northeast"
                icon={<MapPinIcon className="h-5 w-5" />}
                error={errors.region}
              />
              
              <div className="md:col-span-2">
                <FormInput
                  label="Address"
                  name="address"
                  value={formData.address || ''}
                  onChange={handleChange}
                  placeholder="Full address"
                  icon={<MapPinIcon className="h-5 w-5" />}
                  error={errors.address}
                  textarea
                />
              </div>
              
              <FormInput
                label="Phone Number"
                name="phone"
                type="tel"
                value={formData.phone || ''}
                onChange={handleChange}
                placeholder="e.g., +1234567890"
                icon={<PhoneIcon className="h-5 w-5" />}
                error={errors.phone}
              />
              
              <FormInput
                label="Franchise Email"
                name="email"
                type="email"
                value={formData.email || ''}
                onChange={handleChange}
                placeholder="e.g., contact@drybros.com"
                icon={<MailIcon className="h-5 w-5" />}
                error={errors.email}
              />
              
              <FormInput
                label="Store Image URL"
                name="storeImage"
                value={formData.storeImage || ''}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
                icon={<ImageIcon className="h-5 w-5" />}
              />
            </div>
          </div>

          {/* Manager Information Section */}
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <UserIcon className="h-5 w-5 text-purple-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Manager Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                label="Manager Name"
                name="inchargeName"
                value={formData.inchargeName || ''}
                onChange={handleChange}
                placeholder="e.g., John Smith"
                icon={<UserIcon className="h-5 w-5" />}
                error={errors.inchargeName}
              />
              
              <FormInput
                label="Manager Email"
                name="managerEmail"
                type="email"
                value={formData.managerEmail || ''}
                onChange={handleChange}
                placeholder="e.g., manager@drybros.com"
                icon={<MailIcon className="h-5 w-5" />}
                error={errors.managerEmail}
              />
              
              <FormInput
                label="Manager Phone"
                name="managerPhone"
                type="tel"
                value={formData.managerPhone || ''}
                onChange={handleChange}
                placeholder="e.g., +1234567891"
                icon={<PhoneIcon className="h-5 w-5" />}
                error={errors.managerPhone}
              />
            </div>
          </div>

          {/* Legal Documents Section */}
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <DocumentIcon className="h-5 w-5 text-green-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Legal Compliance</h2>
            </div>
            
            <div className="bg-gray-800/30 rounded-lg p-4">
              <Checkbox
                label="Legal documents have been collected and verified"
                name="legalDocumentsCollected"
                checked={formData.legalDocumentsCollected || false}
                onChange={handleChange}
              />
              <p className="mt-2 text-xs text-gray-500 ml-8">
                Check this box only if all required legal documents (business license, permits, etc.) have been collected and verified.
              </p>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-end">
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => router.push(adminRoutes.FRANCHISE_DETAIL(franchiseId))}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            type="submit"
            loading={isSubmitting}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}
