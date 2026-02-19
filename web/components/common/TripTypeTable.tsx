'use client';

import React from 'react';
import Button from '@/components/ui/Button';

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

interface TripTypeTableProps {
  tripTypes: TripType[];
  onEdit: (tripType: TripType) => void;
  onDelete: (id: string) => void;
  onView: (tripType: TripType) => void;
  isLoading?: boolean;
}

const TripTypeTable: React.FC<TripTypeTableProps> = ({ 
  tripTypes, 
  onEdit, 
  onDelete, 
  onView, 
  isLoading 
}) => {
  const formatType = (type: string) => {
    switch (type) {
      case 'TIME':
        return 'Time-Based';
      case 'DISTANCE':
        return 'Distance-Based';
      case 'SLAB':
        return 'Slab-Based';
      default:
        return type;
    }
  };

  const formatCarCategory = (category: string) => {
    switch (category) {
      case 'NORMAL':
        return 'Normal';
      case 'PREMIUM':
        return 'Premium';
      case 'LUXURY':
        return 'Luxury';
      case 'SPORTS':
        return 'Sports';
      default:
        return category;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-800 bg-gray-900/50">
      <table className="min-w-full divide-y divide-gray-800">
        <thead className="bg-gray-800/50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Name
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Type
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Category
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Base Amount
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-gray-900/50 divide-y divide-gray-800">
          {isLoading ? (
            <tr>
              <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                Loading...
              </td>
            </tr>
          ) : tripTypes.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                No trip types found
              </td>
            </tr>
          ) : (
            tripTypes.map((tripType) => (
              <tr key={tripType.id} className="hover:bg-gray-800/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">{tripType.name}</div>
                  {tripType.description && (
                    <div className="text-sm text-gray-400 mt-1">{tripType.description}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {formatType(tripType.type)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {formatCarCategory(tripType.carCategory)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                  ₹{tripType.basePrice || tripType.baseAmount || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outlined"
                      size="small"
                      color="secondary"
                      onClick={() => onView(tripType)}
                    >
                      View
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      color="primary"
                      onClick={() => onEdit(tripType)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      color="error"
                      onClick={() => onDelete(tripType.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TripTypeTable;