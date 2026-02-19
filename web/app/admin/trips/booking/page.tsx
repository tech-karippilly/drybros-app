'use client';

import React, { useState, useEffect } from 'react';
import { useAppSelector } from '@/lib/hooks';
import { selectCurrentUser } from '@/lib/features/auth/authSlice';
import DashboardLayout from '@/components/layout/DashboardLayout';
import BookingForm from '@/components/trips/BookingForm';
import { useToast } from '@/hooks/useToast';
import { franchiseService } from '@/services/franchiseService';

const AdminBookingPage = () => {
  const currentUser = useAppSelector(selectCurrentUser);
  const { success, error } = useToast();
  const [franchises, setFranchises] = useState<any[]>([]);
  const [loadingFranchises, setLoadingFranchises] = useState(true);
  
  // Get user display info from Redux state
  const userName = currentUser?.fullName || 'Admin User';
  const userRole = currentUser?.role || 'ADMIN';
  
  // Fetch franchises for admin
  useEffect(() => {
    const fetchFranchises = async () => {
      try {
        setLoadingFranchises(true);
        const response = await franchiseService.getFranchises({ limit: 100 });
        const fetchedFranchises = response.data?.data || [];
        setFranchises(fetchedFranchises);
      } catch (err: any) {
        console.error('Failed to fetch franchises:', err);
        // Provide mock data as fallback
        const mockFranchises = [
          { id: '1', name: 'Default Franchise', code: 'DF001' },
          { id: '2', name: 'Test Franchise', code: 'TF002' },
          { id: '3', name: 'Demo Franchise', code: 'DM003' }
        ];
        setFranchises(mockFranchises);
        error('Failed to load franchises, using demo data');
      } finally {
        setLoadingFranchises(false);
      }
    };
    
    fetchFranchises();
  }, [error]);
  
  const handleSubmit = async (data: any) => {
    try {
      // Here you would call your API to create the trip
      console.log('Booking data:', data);
      
      // Mock API call
      // const response = await tripService.createTrip(data);
      
      success('Trip created successfully!');
      
      // Reset form or redirect
      // router.push('/admin/trips');
    } catch (err: any) {
      const message = err?.response?.data?.message || 
                     err?.response?.data?.error || 
                     err?.message || 
                     'Failed to create trip';
      error(message);
    }
  };
  
  return (
    <DashboardLayout 
      user={{ name: userName, role: 'Administrator' }}
      searchPlaceholder="Search trips..."
      liveStatus={true}
      notificationCount={0}
    >
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Trip Booking</h1>
            <p className="mt-1 text-sm text-gray-400">
              Create a new trip booking for customers
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-900/30 rounded-2xl border border-gray-800 p-6">
        <BookingForm 
          onSubmit={handleSubmit}
          userRole="ADMIN"
          availableFranchises={franchises}
        />
      </div>
    </DashboardLayout>
  );
};

export default AdminBookingPage;