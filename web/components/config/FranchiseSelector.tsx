'use client';

import React, { useState, useEffect } from 'react';
import { franchiseService } from '@/services/franchiseService';
import { useAppSelector } from '@/lib/hooks';
import { selectCurrentUser } from '@/lib/features/auth/authSlice';
import type { Franchise } from '@/lib/types/franchise';

interface FranchiseSelectorProps {
  value: string;
  onChange: (franchiseId: string) => void;
  className?: string;
  disabled?: boolean;
  filterByManager?: boolean;
}

export const FranchiseSelector: React.FC<FranchiseSelectorProps> = ({
  value,
  onChange,
  className = '',
  disabled = false,
  filterByManager = false,
}) => {
  const currentUser = useAppSelector(selectCurrentUser);
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFranchises = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // If filtering by manager and user is a manager, fetch only their franchises
        if (filterByManager && currentUser?.role === 'MANAGER' && currentUser?.franchiseId) {
          // For managers, we might need a different API or filter client-side
          // For now, fetch all and filter by manager's franchise
          const response = await franchiseService.getFranchises({ limit: 100 });
          if (response.data?.success) {
            const allFranchises = response.data.data || [];
            // Filter to only show the manager's assigned franchise
            const managerFranchises = allFranchises.filter(
              (f: Franchise) => f.id === currentUser.franchiseId
            );
            setFranchises(managerFranchises);
          }
        } else {
          const response = await franchiseService.getFranchises({ limit: 100 });
          if (response.data?.success) {
            setFranchises(response.data.data || []);
          }
        }
      } catch (err: any) {
        console.error('Failed to fetch franchises:', err);
        setError('Failed to load franchises');
      } finally {
        setLoading(false);
      }
    };

    fetchFranchises();
  }, [filterByManager, currentUser]);

  if (loading) {
    return (
      <div className={`relative ${className}`}>
        <div className="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-4 py-2.5 text-sm text-gray-400">
          Loading franchises...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`relative ${className}`}>
        <div className="w-full rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="">Select Franchise</option>
        {franchises.map((franchise) => (
          <option key={franchise.id} value={franchise.id}>
            {franchise.name}
          </option>
        ))}
      </select>
    </div>
  );
};
