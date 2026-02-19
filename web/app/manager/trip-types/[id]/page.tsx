'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
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
  basePrice: number;
  baseHour: number | null;
  baseDuration: number | null;
  baseDistance: number | null;
  extraPerHour: number | null;
  extraPerHalfHour: number | null;
  extraPerDistance: number | null;
  extraPerKm: number | null;
  distanceSlab: any[] | null;
  timeSlab: any[] | null;
  createdAt: string;
  updatedAt: string;
}

const ArrowLeftIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const EditIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

export default function ManagerTripTypeDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { success, error } = useToast();
  const currentUser = useAppSelector(selectCurrentUser);
  
  const tripTypeId = params.id as string;
  
  // Get user display info from Redux state
  const userName = currentUser?.fullName || 'Manager User';
  const userRole = currentUser?.role || 'Manager';
  
  const [tripType, setTripType] = useState<TripType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tripTypeId) {
      loadTripType();
    }
  }, [tripTypeId]);

  const loadTripType = async () => {
    try {
      setLoading(true);
      const response = await tripTypeService.getTripTypeById(tripTypeId);
      console.log('Full response:', response);
      console.log('Response data:', response.data);
      console.log('Response data.data:', response.data.data);
      
      // Extract the actual trip type data
      const tripTypeData = response.data.data || response.data;
      console.log('Extracted tripTypeData:', tripTypeData);
      console.log('tripTypeData.createdAt:', tripTypeData.createdAt);
      console.log('tripTypeData.updatedAt:', tripTypeData.updatedAt);
      
      setTripType(tripTypeData);
    } catch (err: any) {
      console.error('Error loading trip type:', err);
      error('Failed to load trip type details');
      router.push('/manager/trip-types');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/manager/trip-types/edit/${tripTypeId}`);
  };

  const handleBack = () => {
    router.push('/manager/trip-types');
  };

  const formatType = (type: string) => {
    switch (type) {
      case 'TIME': return 'Time-Based';
      case 'DISTANCE': return 'Distance-Based';
      case 'SLAB': return 'Slab-Based';
      default: return type;
    }
  };

  const formatCarCategory = (category: string) => {
    switch (category) {
      case 'NORMAL': return 'Normal';
      case 'PREMIUM': return 'Premium';
      case 'LUXURY': return 'Luxury';
      case 'SPORTS': return 'Sports';
      default: return category;
    }
  };

  const formatDate = (dateString: string | null) => {
    console.log('formatDate called with:', dateString, 'type:', typeof dateString);
    
    if (!dateString || dateString === null) {
      console.log('Date is null/undefined, returning Not available');
      return 'Not available';
    }
    
    try {
      const date = new Date(dateString);
      console.log('Parsed date:', date, 'isValid:', !isNaN(date.getTime()));
      
      if (isNaN(date.getTime())) {
        console.log('Invalid date, returning Invalid date');
        return 'Invalid date';
      }
      
      const formatted = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      
      console.log('Formatted date:', formatted);
      return formatted;
    } catch (err) {
      console.error('Date formatting error:', err);
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <DashboardLayout
        user={{ name: userName, role: userRole }}
        searchPlaceholder="Search trip types..."
        liveStatus={true}
        notificationCount={0}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Loading trip type details...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!tripType) {
    return (
      <DashboardLayout
        user={{ name: userName, role: userRole }}
        searchPlaceholder="Search trip types..."
        liveStatus={true}
        notificationCount={0}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Trip type not found</div>
        </div>
      </DashboardLayout>
    );
  }
  
  // Debug: Log the tripType data before rendering
  console.log('Rendering tripType:', tripType);
  console.log('tripType.createdAt:', tripType.createdAt, typeof tripType.createdAt);
  console.log('tripType.updatedAt:', tripType.updatedAt, typeof tripType.updatedAt);

  return (
    <DashboardLayout
      user={{ name: userName, role: userRole }}
      searchPlaceholder="Search trip types..."
      liveStatus={true}
      notificationCount={0}
    >
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<ArrowLeftIcon className="h-4 w-4" />}
            onClick={handleBack}
          >
            Back to List
          </Button>
        </div>

        <div className="border border-gray-800 bg-gray-900/50 rounded-xl p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white mb-2">{tripType.name}</h1>
            {tripType.description && (
              <p className="text-gray-400">{tripType.description}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Basic Information</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Type</label>
                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {formatType(tripType.type)}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Car Category</label>
                  <span className="text-white">{formatCarCategory(tripType.carCategory)}</span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Base Amount</label>
                  <span className="text-2xl font-bold text-white">₹{tripType.basePrice}</span>
                </div>
              </div>
            </div>

            {/* Pricing Details */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Pricing Details</h2>
              <div className="space-y-3">
                {tripType.type === 'TIME' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Base Hour</label>
                      <span className="text-white">{tripType.baseHour} hours</span>
                    </div>
                    {tripType.baseDistance !== null && tripType.baseDistance !== undefined && (
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Base Distance</label>
                        <span className="text-white">{tripType.baseDistance} km</span>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Extra Per Hour</label>
                      <span className="text-white">₹{tripType.extraPerHour}/hour</span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Extra Per Half Hour</label>
                      <span className="text-white">₹{tripType.extraPerHalfHour}/half hour</span>
                    </div>
                    {tripType.extraPerDistance !== null && tripType.extraPerDistance !== undefined && (
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Extra Per Distance</label>
                        <span className="text-white">₹{tripType.extraPerDistance}/km</span>
                      </div>
                    )}
                  </>
                )}
                
                {tripType.type === 'DISTANCE' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Base Distance</label>
                      <span className="text-white">{tripType.baseDistance} km</span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Extra Per Distance</label>
                      <span className="text-white">₹{tripType.extraPerDistance}/km</span>
                    </div>
                  </>
                )}
                
                {tripType.type === 'SLAB' && (
                  <>
                    {tripType.distanceSlab && tripType.distanceSlab.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Distance Slabs</label>
                        <div className="border border-gray-700 rounded-lg p-3">
                          <div className="space-y-2">
                            {tripType.distanceSlab.map((slab: any, index: number) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span className="text-gray-400">{slab.from} - {slab.to} km</span>
                                <span className="text-white">₹{slab.price}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    {tripType.timeSlab && tripType.timeSlab.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Time Slabs</label>
                        <div className="border border-gray-700 rounded-lg p-3">
                          <div className="space-y-2">
                            {tripType.timeSlab.map((slab: any, index: number) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span className="text-gray-400">{slab.from} - {slab.to}</span>
                                <span className="text-white">₹{slab.price}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="mt-8 pt-6 border-t border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-4">Metadata</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block text-gray-400 mb-1">Created At</label>
                <span className="text-white">{formatDate(tripType.createdAt)}</span>
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Last Updated</label>
                <span className="text-white">{formatDate(tripType.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}