import React, { useEffect, useState } from 'react';
import { tripTypeService } from '@/services/tripTypeService';

const TestPage = () => {
  const [tripType, setTripType] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTripType = async () => {
      try {
        setLoading(true);
        const response = await tripTypeService.getTripTypeById('433a95f1-135d-4180-b06c-433d528d3f60');
        console.log('Raw API response:', response.data);
        setTripType(response.data);
      } catch (err: any) {
        console.error('Error loading trip type:', err);
        setError(err.message || 'Failed to load trip type');
      } finally {
        setLoading(false);
      }
    };

    loadTripType();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!tripType) {
    return <div>No trip type found</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Trip Type Test Page</h1>
      
      <div className="bg-gray-800 p-4 rounded-lg mb-4">
        <h2 className="text-lg font-semibold mb-2">Raw API Response</h2>
        <pre className="text-sm text-gray-300 overflow-x-auto">
          {JSON.stringify(tripType, null, 2)}
        </pre>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Field Analysis</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p><strong>ID:</strong> {tripType.id}</p>
            <p><strong>Name:</strong> {tripType.name}</p>
            <p><strong>Type:</strong> {tripType.type}</p>
            <p><strong>Car Category:</strong> {tripType.carCategory}</p>
          </div>
          <div>
            <p><strong>Base Amount:</strong> {tripType.baseAmount}</p>
            <p><strong>Base Price:</strong> {tripType.basePrice}</p>
            <p><strong>Base Hour:</strong> {tripType.baseHour}</p>
            <p><strong>Base Duration:</strong> {tripType.baseDuration}</p>
          </div>
        </div>
        
        <div className="mt-4">
          <p><strong>Created At:</strong> {tripType.createdAt}</p>
          <p><strong>Updated At:</strong> {tripType.updatedAt}</p>
          <p><strong>Created At Type:</strong> {typeof tripType.createdAt}</p>
          <p><strong>Updated At Type:</strong> {typeof tripType.updatedAt}</p>
        </div>
      </div>
    </div>
  );
};

export default TestPage;