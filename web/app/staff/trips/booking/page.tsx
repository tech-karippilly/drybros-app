'use client';

import React from 'react';
import { useAppSelector } from '@/lib/hooks';
import { selectCurrentUser } from '@/lib/features/auth/authSlice';
import DashboardLayout from '@/components/layout/DashboardLayout';
import BookingForm from '@/components/trips/BookingForm';
import { useToast } from '@/hooks/useToast';

const StaffBookingPage = () => {
  const currentUser = useAppSelector(selectCurrentUser);
  const { success, error } = useToast();
  
  // Get user display info from Redux state
  const userName = currentUser?.fullName || 'Staff User';
  const userRole = currentUser?.role || 'STAFF';
  const userFranchiseId = currentUser?.franchiseId;
  
  const handleSubmit = async (data: any) => {
    try {
      // Here you would call your API to create the trip
      console.log('Booking data:', data);
      
      // Mock API call
      // const response = await tripService.createTrip(data);
      
      success('Trip created successfully!');
      
      // Reset form or redirect
      // router.push('/staff/trips');
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
      user={{ name: userName, role: 'Staff' }}
      searchPlaceholder="Search trips..."
      liveStatus={true}
      notificationCount={0}
    >
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Trip Booking</h1>
            <p className="mt-1 text-sm text-gray-400">
              Create a new trip booking for customers in your franchise
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-900/30 rounded-2xl border border-gray-800 p-6">
        <BookingForm 
          onSubmit={handleSubmit}
          userRole="STAFF"
          userFranchiseId={userFranchiseId}
        />
      </div>
    </DashboardLayout>
  );
};

export default StaffBookingPage;