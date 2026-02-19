'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useToast } from '@/hooks/useToast';
import { tripTypeService } from '@/services/tripTypeService';
import { useAppSelector } from '@/lib/hooks';
import { selectCurrentUser } from '@/lib/features/auth/authSlice';
import TripTypeTable from '@/components/common/TripTypeTable';
import TripTypeModal from '@/components/common/TripTypeModal';
import Button from '@/components/ui/Button';
import { Plus } from 'lucide-react';

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

const TripTypesPage = () => {
  const router = useRouter();
  const currentUser = useAppSelector(selectCurrentUser);
  
  // Get user display info from Redux state
  const userName = currentUser?.fullName || 'Admin User';
  const userRole = currentUser?.role || 'Administrator';
  
  const [tripTypes, setTripTypes] = useState<TripType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingTripType, setEditingTripType] = useState<TripType | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const { success, error } = useToast();

  // Fetch trip types
  const fetchTripTypes = async () => {
    try {
      setLoading(true);
      const response = await tripTypeService.getTripTypes();
      setTripTypes(response.data.data || []);
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to fetch trip types';
      error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTripTypes();
  }, []);

  // Handle form submission (create/update)
  const handleSubmit = async (data: any) => {
    setModalLoading(true);
    try {
      if (editingTripType) {
        // Update existing trip type
        await tripTypeService.updateTripType(editingTripType.id, data);
        success('Trip type updated successfully');
      } else {
        // Create new trip type
        await tripTypeService.createTripType(data);
        success('Trip type created successfully');
      }
      
      setIsModalOpen(false);
      setEditingTripType(null);
      fetchTripTypes(); // Refresh the list
    } catch (err: any) {
      const message = err?.response?.data?.message || 
                     err?.response?.data?.error || 
                     err?.message || 
                     'Operation failed';
      error(message);
    } finally {
      setModalLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this trip type?')) {
      return;
    }

    setDeletingId(id);
    try {
      await tripTypeService.deleteTripType(id);
      success('Trip type deleted successfully');
      fetchTripTypes(); // Refresh the list
    } catch (err: any) {
      const message = err?.response?.data?.message || 
                     err?.response?.data?.error || 
                     err?.message || 
                     'Failed to delete trip type';
      error(message);
    } finally {
      setDeletingId(null);
    }
  };

  // Open modal for creating new trip type
  const handleCreate = () => {
    setEditingTripType(null);
    setIsModalOpen(true);
  };

  // Open modal for editing existing trip type
  const handleEdit = (tripType: TripType) => {
    setEditingTripType(tripType);
    setIsModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTripType(null);
  };

  // View trip type (navigate to details page)
  const handleView = (tripType: TripType) => {
    router.push(`/admin/trip-types/${tripType.id}`);
  };

  return (
    <DashboardLayout
      user={{ name: userName, role: userRole }}
      searchPlaceholder="Search trip types..."
      liveStatus={true}
      notificationCount={0}
    >
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Trip Type Management</h1>
            <p className="text-gray-400">Manage trip types and pricing configurations</p>
          </div>
          <Button 
            color="primary" 
            onClick={handleCreate}
            startIcon={<Plus className="h-4 w-4" />}
          >
            Add Trip Type
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <TripTypeTable
          tripTypes={tripTypes}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          isLoading={loading}
        />
      </div>

      <TripTypeModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        initialData={editingTripType || undefined}
        isLoading={modalLoading}
        title={editingTripType ? 'Edit Trip Type' : 'Create Trip Type'}
      />
    </DashboardLayout>
  );
};

export default TripTypesPage;