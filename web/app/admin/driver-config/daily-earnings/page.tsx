'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { FranchiseSelector } from '@/components/config/FranchiseSelector';
import { earningsConfigService } from '@/services/earningsConfigService';
import { useAppSelector } from '@/lib/hooks';
import { selectCurrentUser } from '@/lib/features/auth/authSlice';
import { useToast } from '@/hooks/useToast';
import { Toast } from '@/components/ui/Toast';
import type { DriverEarningsConfig } from '@/lib/types/earningsConfig';

const WalletIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const SaveIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
  </svg>
);

export default function AdminDailyEarningsPage() {
  const router = useRouter();
  const currentUser = useAppSelector(selectCurrentUser);
  const toast = useToast();

  const [franchiseId, setFranchiseId] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<DriverEarningsConfig>({
    dailyTargetDefault: 1250,
    incentiveTier1Min: 1250,
    incentiveTier1Max: 1550,
    incentiveTier1Type: 'full_extra',
    incentiveTier2Min: 1550,
    incentiveTier2Percent: 20,
    monthlyBonusTiers: [],
    monthlyDeductionTiers: [],
  });

  // Fetch config when franchise changes
  useEffect(() => {
    if (!franchiseId) return;

    const fetchConfig = async () => {
      try {
        setLoading(true);
        const response = await earningsConfigService.getFranchiseConfig(franchiseId);
        if (response.data?.data) {
          setConfig(response.data.data);
        }
      } catch (err: any) {
        // If 404, config doesn't exist yet - use defaults
        if (err.response?.status === 404) {
          setConfig({
            dailyTargetDefault: 1250,
            incentiveTier1Min: 1250,
            incentiveTier1Max: 1550,
            incentiveTier1Type: 'full_extra',
            incentiveTier2Min: 1550,
            incentiveTier2Percent: 20,
            monthlyBonusTiers: [],
            monthlyDeductionTiers: [],
          });
        } else {
          toast.error('Failed to load earnings configuration');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [franchiseId]);

  const handleSave = async () => {
    if (!franchiseId) {
      toast.error('Please select a franchise');
      return;
    }

    try {
      setSaving(true);
      await earningsConfigService.updateFranchiseConfig(franchiseId, config);
      toast.success('Earnings configuration saved successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof DriverEarningsConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <DashboardLayout
      user={{ name: currentUser?.fullName || 'Admin User', role: currentUser?.role || 'Administrator' }}
      searchPlaceholder="Search..."
      liveStatus={true}
      notificationCount={0}
    >
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toast.toasts.map((t) => (
          <Toast
            key={t.id}
            message={t.message}
            type={t.type}
            onClose={() => toast.removeToast(t.id)}
          />
        ))}
      </div>

      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
            <WalletIcon className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Daily Earnings & Incentives</h1>
            <p className="text-sm text-gray-400">Configure daily target and incentive rules for drivers.</p>
          </div>
        </div>
      </div>

      {/* Franchise Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Select Franchise
        </label>
        <FranchiseSelector
          value={franchiseId}
          onChange={setFranchiseId}
          className="max-w-md"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        </div>
      ) : franchiseId ? (
        <div className="space-y-6">
          {/* Daily Target Section */}
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Daily Target</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Daily Target Amount (₹)
                </label>
                <input
                  type="number"
                  value={config.dailyTargetDefault}
                  onChange={(e) => handleInputChange('dailyTargetDefault', parseInt(e.target.value) || 0)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">Default: ₹1250</p>
              </div>
            </div>
          </div>

          {/* Incentive Tier 1 Section */}
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Incentive Tier 1</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Min Amount (₹)
                </label>
                <input
                  type="number"
                  value={config.incentiveTier1Min}
                  onChange={(e) => handleInputChange('incentiveTier1Min', parseInt(e.target.value) || 0)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Max Amount (₹)
                </label>
                <input
                  type="number"
                  value={config.incentiveTier1Max}
                  onChange={(e) => handleInputChange('incentiveTier1Max', parseInt(e.target.value) || 0)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Type
                </label>
                <select
                  value={config.incentiveTier1Type}
                  onChange={(e) => handleInputChange('incentiveTier1Type', e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="full_extra">Full Extra</option>
                  <option value="percentage">Percentage</option>
                </select>
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-400">
              {config.incentiveTier1Type === 'full_extra' 
                ? `Drivers earn full extra amount between ₹${config.incentiveTier1Min} - ₹${config.incentiveTier1Max}`
                : `Drivers earn percentage on earnings between ₹${config.incentiveTier1Min} - ₹${config.incentiveTier1Max}`}
            </p>
          </div>

          {/* Incentive Tier 2 Section */}
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Incentive Tier 2 (Above Target)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Min Amount (₹)
                </label>
                <input
                  type="number"
                  value={config.incentiveTier2Min}
                  onChange={(e) => handleInputChange('incentiveTier2Min', parseInt(e.target.value) || 0)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Percentage (%)
                </label>
                <input
                  type="number"
                  value={config.incentiveTier2Percent}
                  onChange={(e) => handleInputChange('incentiveTier2Percent', parseInt(e.target.value) || 0)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-400">
              Drivers earn {config.incentiveTier2Percent}% of trip amount for earnings above ₹{config.incentiveTier2Min}
            </p>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-500 text-sm font-medium text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Saving...
                </>
              ) : (
                <>
                  <SaveIcon className="h-4 w-4" />
                  Save Configuration
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed border-gray-700 rounded-xl">
          <p className="text-gray-400">Please select a franchise to configure earnings settings.</p>
        </div>
      )}
    </DashboardLayout>
  );
}
