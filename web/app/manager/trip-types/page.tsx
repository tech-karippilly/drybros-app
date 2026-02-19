'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TripTypeTable from '@/components/common/TripTypeTable';
import TripTypeModal from '@/components/common/TripTypeModal';
import Button from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { tripTypeService } from '@/services/tripTypeService';
import { useAppSelector } from '@/lib/hooks';
import { selectCurrentUser } from '@/lib/features/auth/authSlice';

interface TripType {
  id: string;
  name: string;
  description: string | null;
  type: 'TIME' | 'DISTANCE' | 'SLAB';
  carCategory: 'NORMAL' | 'PREMIUM' | 'LUXURY' | 'SPORTS';
  baseAmount: number;
  basePrice?: number; // For backward compatibility
  baseHour: number | null;
  baseDistance: number | null;
  extraPerHour: number | null;
  extraPerHalfHour: number | null;
  extraPerDistance: number | null;
  distanceSlab: any[] | null;
  timeSlab: any[] | null;
  createdAt: string;
  updatedAt: string;
}

// Icon Components
const PlusIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

export default function ManagerTripTypesPage() {
  const router = useRouter();
  const { success, error } = useToast();
  const currentUser = useAppSelector(selectCurrentUser);
  
  const [tripTypes, setTripTypes] = useState<TripType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTripType, setSelectedTripType] = useState<TripType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get user display info from Redux state
  const userName = currentUser?.fullName || 'Manager User';
  const userRole = currentUser?.role || 'Manager';

  useEffect(() => {
    loadTripTypes();
  }, []);

  const loadTripTypes = async () => {
    try {
      setLoading(true);
      const response = await tripTypeService.getTripTypes();
      const tripTypesData = Array.isArray(response.data?.data) 
        ? response.data.data 
        : response.data 
        ? [response.data] 
        : [];
      
      setTripTypes(tripTypesData);
    } catch (err: any) {
      console.error('Error loading trip types:', err);
      error('Failed to load trip types');
      setTripTypes([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTripType = () => {
    setSelectedTripType(null);
    setIsModalOpen(true);
  };

  const handleEditTripType = (tripType: TripType) => {
    setSelectedTripType(tripType);
    setIsModalOpen(true);
  };

  const handleViewTripType = (tripType: TripType) => {
    router.push(`/manager/trip-types/${tripType.id}`);
  };

  const handleDeleteTripType = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this trip type?')) {
      return;
    }

    try {
      await tripTypeService.deleteTripType(id);
      success('Trip type deleted successfully');
      loadTripTypes();
    } catch (err: any) {
      console.error('Error deleting trip type:', err);
      error(err.response?.data?.message || 'Failed to delete trip type');
    }
  };

  const handleFormSubmit = async (formData: any) => {
    setIsSubmitting(true);
    try {
      if (selectedTripType) {
        await tripTypeService.updateTripType(selectedTripType.id, formData);
        success('Trip type updated successfully');
      } else {
        await tripTypeService.createTripType(formData);
        success('Trip type created successfully');
      }
      setIsModalOpen(false);
      loadTripTypes();
    } catch (err: any) {
      console.error('Error saving trip type:', err);
      error(err.response?.data?.message || 'Failed to save trip type');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedTripType(null);
  };

  return (
    <DashboardLayout
      user={{ name: userName, role: userRole }}
      searchPlaceholder="Search trip types..."
      liveStatus={true}
      notificationCount={0}
    >
      <div className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Trip Types Management</h1>
            <p className="mt-1 text-sm text-gray-400">
              Manage trip types and pricing configurations for {userName}'s franchise
            </p>
          </div>
          <Button
            color="primary"
            startIcon={<PlusIcon className="h-4 w-4" />}
            onClick={handleCreateTripType}
          >
            New Trip Type
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <TripTypeTable
          tripTypes={tripTypes}
          isLoading={loading}
          onEdit={handleEditTripType}
          onDelete={handleDeleteTripType}
          onView={handleViewTripType}
        />
      </div>

      <TripTypeModal
        isOpen={isModalOpen}
        initialData={selectedTripType}
        onClose={handleModalClose}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
        title={selectedTripType ? (selectedTripType ? 'Edit Trip Type' : 'View Trip Type') : 'Create Trip Type'}
      />
    </DashboardLayout>
  );
}