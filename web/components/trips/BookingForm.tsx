'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useDebounceValue } from '@/hooks/useDebounceValue';
import Input from '@/components/ui/Input';
import TextArea from '@/components/ui/TextArea';
import DatePicker from '@/components/ui/DatePicker';
import TimePicker from '@/components/ui/TimePicker';
import Button from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { tripTypeService } from '@/services/tripTypeService';
import { franchiseService } from '@/services/franchiseService';

interface TripType {
  id: string;
  name: string;
  description: string | null;
  type: 'TIME' | 'DISTANCE' | 'SLAB';
  carCategory: 'NORMAL' | 'PREMIUM' | 'LUXURY' | 'SPORTS';
  baseAmount: number;
  basePrice?: number;
  createdAt: string;
  updatedAt: string;
}

interface Franchise {
  id: string;
  name: string;
  code: string;
}

interface PlacePrediction {
  description: string;
  place_id: string;
}

interface PlaceDetails {
  lat: number;
  lng: number;
  formatted_address: string;
}

interface BookingFormProps {
  onSubmit: (data: any) => void;
  loading?: boolean;
  userRole: 'ADMIN' | 'MANAGER' | 'STAFF';
  userFranchiseId?: string;
  availableFranchises?: Franchise[]; // For admin role to show dropdown
}

const BookingForm: React.FC<BookingFormProps> = ({ 
  onSubmit, 
  loading = false,
  userRole,
  userFranchiseId,
  availableFranchises
}) => {
  const { error: toastError } = useToast();
  const [tripTypes, setTripTypes] = useState<TripType[]>([]);
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [loadingTripTypes, setLoadingTripTypes] = useState(true);
  const [loadingFranchises, setLoadingFranchises] = useState(true);
  
  // Form state
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerAltPhone: '',
    customerEmail: '',
    pickupLocation: '',
    pickupAddress: '',
    pickupNote: '',
    destinationLocation: '',
    destinationAddress: '',
    destinationNote: '',
    tripTypeId: '',
    dateOfTrip: '',
    timeOfTrip: '',
    franchiseId: userRole === 'ADMIN' ? '' : (userFranchiseId || ''),
  });
  
  // Location search states
  const [pickupPredictions, setPickupPredictions] = useState<PlacePrediction[]>([]);
  const [destinationPredictions, setDestinationPredictions] = useState<PlacePrediction[]>([]);
  const [showPickupDropdown, setShowPickupDropdown] = useState(false);
  const [showDestinationDropdown, setShowDestinationDropdown] = useState(false);
  
  // Debounced search terms
  const debouncedPickupSearch = useDebounceValue(formData.pickupLocation, 500);
  const debouncedDestinationSearch = useDebounceValue(formData.destinationLocation, 500);
  
  // Fetch trip types
  useEffect(() => {
    const fetchTripTypes = async () => {
      try {
        setLoadingTripTypes(true);
        const response = await tripTypeService.getTripTypes();
        setTripTypes(response.data?.data || []);
      } catch (err: any) {
        console.error('Failed to fetch trip types:', err);
        toastError('Failed to load trip types');
      } finally {
        setLoadingTripTypes(false);
      }
    };
    
    fetchTripTypes();
  }, [toastError]);
  
  // Handle franchises data
  useEffect(() => {
    if (userRole !== 'ADMIN') {
      setLoadingFranchises(false);
      return;
    }
    
    // If franchises are passed as props, use them immediately
    if (availableFranchises && availableFranchises.length > 0) {
      setFranchises(availableFranchises);
      setLoadingFranchises(false);
      return;
    }
    
    // If we already have franchises loaded, don't fetch again
    if (franchises.length > 0) {
      setLoadingFranchises(false);
      return;
    }
    
    // Fetch franchises from API
    const fetchFranchises = async () => {
      try {
        setLoadingFranchises(true);
        const response = await franchiseService.getFranchises({ limit: 100 });
        const fetchedFranchises = response.data?.data || [];
        setFranchises(fetchedFranchises);
      } catch (err: any) {
        console.error('Failed to fetch franchises:', err);
        // Provide mock data as fallback
        setFranchises([
          { id: '1', name: 'Default Franchise', code: 'DF001' },
          { id: '2', name: 'Test Franchise', code: 'TF002' }
        ]);
        toastError('Failed to load franchises, using default data');
      } finally {
        setLoadingFranchises(false);
      }
    };
    
    fetchFranchises();
  }, [userRole, availableFranchises, franchises.length, toastError]);
  
  // Google Places API functions
  const searchPlaces = async (query: string): Promise<PlacePrediction[]> => {
    // In a real implementation, you would call the Google Places API
    // For now, returning mock data
    if (!query.trim()) return [];
    
    // Mock implementation - in real app, you'd use:
    // const response = await fetch(`https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${query}&key=YOUR_API_KEY`);
    // const data = await response.json();
    // return data.predictions;
    
    return [
      { description: `${query}, City Center`, place_id: 'mock_1' },
      { description: `${query}, Main Street`, place_id: 'mock_2' },
      { description: `${query}, Downtown`, place_id: 'mock_3' },
    ];
  };
  
  const getPlaceDetails = async (placeId: string): Promise<PlaceDetails> => {
    // In a real implementation, you would call the Google Places Details API
    // For now, returning mock data with coordinates
    
    // Mock implementation - in real app, you'd use:
    // const response = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=YOUR_API_KEY`);
    // const data = await response.json();
    // return {
    //   lat: data.result.geometry.location.lat,
    //   lng: data.result.geometry.location.lng,
    //   formatted_address: data.result.formatted_address
    // };
    
    // Generate mock coordinates based on place_id
    const lat = 12.9716 + (Math.random() - 0.5) * 0.1;
    const lng = 77.5946 + (Math.random() - 0.5) * 0.1;
    
    return {
      lat,
      lng,
      formatted_address: `Mock Address for ${placeId}`
    };
  };
  
  // Handle location search with debounce
  useEffect(() => {
    if (debouncedPickupSearch) {
      const fetchPredictions = async () => {
        try {
          const predictions = await searchPlaces(debouncedPickupSearch);
          setPickupPredictions(predictions);
          setShowPickupDropdown(true);
        } catch (err) {
          console.error('Error searching pickup locations:', err);
        }
      };
      fetchPredictions();
    } else {
      setPickupPredictions([]);
      setShowPickupDropdown(false);
    }
  }, [debouncedPickupSearch]);
  
  useEffect(() => {
    if (debouncedDestinationSearch) {
      const fetchPredictions = async () => {
        try {
          const predictions = await searchPlaces(debouncedDestinationSearch);
          setDestinationPredictions(predictions);
          setShowDestinationDropdown(true);
        } catch (err) {
          console.error('Error searching destination locations:', err);
        }
      };
      fetchPredictions();
    } else {
      setDestinationPredictions([]);
      setShowDestinationDropdown(false);
    }
  }, [debouncedDestinationSearch]);
  
  // Handle place selection
  const handlePlaceSelect = async (
    placeId: string, 
    isPickup: boolean,
    prediction: PlacePrediction
  ) => {
    try {
      const details = await getPlaceDetails(placeId);
      
      if (isPickup) {
        setFormData(prev => ({
          ...prev,
          pickupLocation: prediction.description,
          pickupAddress: details.formatted_address
        }));
        setShowPickupDropdown(false);
      } else {
        setFormData(prev => ({
          ...prev,
          destinationLocation: prediction.description,
          destinationAddress: details.formatted_address
        }));
        setShowDestinationDropdown(false);
      }
    } catch (err) {
      console.error('Error getting place details:', err);
      toastError('Failed to get location details');
    }
  };
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.customerName.trim()) {
      toastError('Customer name is required');
      return;
    }
    
    if (!formData.customerPhone.trim()) {
      toastError('Customer phone is required');
      return;
    }
    
    if (!formData.pickupLocation.trim()) {
      toastError('Pickup location is required');
      return;
    }
    
    if (!formData.destinationLocation.trim()) {
      toastError('Destination location is required');
      return;
    }
    
    if (!formData.tripTypeId) {
      toastError('Please select a trip type');
      return;
    }
    
    if (!formData.dateOfTrip) {
      toastError('Date of trip is required');
      return;
    }
    
    if (!formData.timeOfTrip) {
      toastError('Time of trip is required');
      return;
    }
    
    if (userRole === 'ADMIN' && !formData.franchiseId) {
      toastError('Please select a franchise');
      return;
    }
    
    // Prepare data for submission
    const submissionData = {
      ...formData,
      // Add coordinates if available
      pickupLat: null, // Would be set from place details
      pickupLng: null,
      destinationLat: null,
      destinationLng: null,
      // Add franchise ID for non-admin users
      ...(userRole !== 'ADMIN' && { franchiseId: userFranchiseId })
    };
    
    onSubmit(submissionData);
  };
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowPickupDropdown(false);
      setShowDestinationDropdown(false);
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Customer Information Section */}
        <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Customer Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Customer Name *"
              name="customerName"
              value={formData.customerName}
              onChange={handleInputChange}
              placeholder="Enter customer name"
              fullWidth
            />
            
            <Input
              label="Customer Phone *"
              name="customerPhone"
              value={formData.customerPhone}
              onChange={handleInputChange}
              placeholder="Enter phone number"
              fullWidth
            />
            
            <Input
              label="Alternative Phone"
              name="customerAltPhone"
              value={formData.customerAltPhone}
              onChange={handleInputChange}
              placeholder="Enter alternative phone"
              fullWidth
            />
            
            <Input
              label="Customer Email"
              name="customerEmail"
              type="email"
              value={formData.customerEmail}
              onChange={handleInputChange}
              placeholder="Enter email address"
              fullWidth
            />
          </div>
        </div>
        
        {/* Pickup Location Section */}
        <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Pickup Location
          </h2>
          
          <div className="space-y-6">
            <div className="relative">
              <Input
                label="Pickup Location *"
                name="pickupLocation"
                value={formData.pickupLocation}
                onChange={handleInputChange}
                placeholder="Search for pickup location"
                fullWidth
              />
              
              {/* Pickup Location Dropdown */}
              {showPickupDropdown && pickupPredictions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 rounded-lg border border-gray-800 bg-gray-900 shadow-2xl max-h-60 overflow-y-auto">
                  {pickupPredictions.map((prediction) => (
                    <button
                      key={prediction.place_id}
                      type="button"
                      onClick={() => handlePlaceSelect(prediction.place_id, true, prediction)}
                      className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:bg-gray-800/50 hover:text-white transition-colors"
                    >
                      {prediction.description}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <Input
              label="Pickup Address"
              name="pickupAddress"
              value={formData.pickupAddress}
              onChange={handleInputChange}
              placeholder="Pickup address (auto-filled)"
              fullWidth
              disabled
            />
            
            <TextArea
              label="Pickup Note"
              name="pickupNote"
              value={formData.pickupNote}
              onChange={handleInputChange}
              placeholder="Any special instructions for pickup"
              fullWidth
              rows={3}
            />
          </div>
        </div>
        
        {/* Destination Location Section */}
        <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <svg className="h-5 w-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Destination Location
          </h2>
          
          <div className="space-y-6">
            <div className="relative">
              <Input
                label="Destination Location *"
                name="destinationLocation"
                value={formData.destinationLocation}
                onChange={handleInputChange}
                placeholder="Search for destination location"
                fullWidth
              />
              
              {/* Destination Location Dropdown */}
              {showDestinationDropdown && destinationPredictions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 rounded-lg border border-gray-800 bg-gray-900 shadow-2xl max-h-60 overflow-y-auto">
                  {destinationPredictions.map((prediction) => (
                    <button
                      key={prediction.place_id}
                      type="button"
                      onClick={() => handlePlaceSelect(prediction.place_id, false, prediction)}
                      className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:bg-gray-800/50 hover:text-white transition-colors"
                    >
                      {prediction.description}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <Input
              label="Destination Address"
              name="destinationAddress"
              value={formData.destinationAddress}
              onChange={handleInputChange}
              placeholder="Destination address (auto-filled)"
              fullWidth
              disabled
            />
            
            <TextArea
              label="Destination Note"
              name="destinationNote"
              value={formData.destinationNote}
              onChange={handleInputChange}
              placeholder="Any special instructions for destination"
              fullWidth
              rows={3}
            />
          </div>
        </div>
        
        {/* Trip Details Section */}
        <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Trip Details
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Trip Type *
              </label>
              <select
                name="tripTypeId"
                value={formData.tripTypeId}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                disabled={loadingTripTypes}
              >
                <option value="">Select Trip Type</option>
                {tripTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name} ({type.carCategory})
                  </option>
                ))}
              </select>
              {loadingTripTypes && (
                <p className="mt-1 text-xs text-gray-500">Loading trip types...</p>
              )}
            </div>
            
            <DatePicker
              label="Date of Trip *"
              name="dateOfTrip"
              value={formData.dateOfTrip}
              onChange={handleInputChange}
              minDate={new Date().toISOString().split('T')[0]}
              fullWidth
            />
            
            <TimePicker
              label="Time of Trip *"
              name="timeOfTrip"
              value={formData.timeOfTrip}
              onChange={handleInputChange}
              fullWidth
            />
            
            {userRole === 'ADMIN' && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Franchise *
                </label>
                {loadingFranchises ? (
                  <div className="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-4 py-2.5 text-sm text-gray-500 flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading franchises...
                  </div>
                ) : (
                  <select
                    name="franchiseId"
                    value={formData.franchiseId}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                  >
                    <option value="">Select Franchise</option>
                    {franchises.map((franchise) => (
                      <option key={franchise.id} value={franchise.id}>
                        {franchise.name} ({franchise.code})
                      </option>
                    ))}
                  </select>
                )}
                {franchises.length > 0 && !loadingFranchises && (
                  <p className="mt-1 text-xs text-green-500">✓ {franchises.length} franchises loaded</p>
                )}
              </div>
            )}
            
            {userRole !== 'ADMIN' && userFranchiseId && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Franchise
                </label>
                <div className="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-4 py-2.5 text-sm text-white">
                  {franchises.find(f => f.id === userFranchiseId)?.name || 'Your Franchise'}
                </div>
                <input 
                  type="hidden" 
                  name="franchiseId" 
                  value={userFranchiseId} 
                />
              </div>
            )}
          </div>
        </div>
        
        {/* Submit Button */}
        <div className="flex justify-end pt-6">
          <Button
            type="submit"
            color="primary"
            size="large"
            disabled={loading}
            className="px-8 py-3"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Trip...
              </span>
            ) : (
              'Create Trip'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default BookingForm;