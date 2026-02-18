'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { FranchiseSelector } from '@/components/config/FranchiseSelector';
import { DynamicTierTable } from '@/components/config/DynamicTierTable';
import { earningsConfigService } from '@/services/earningsConfigService';
import { useAppSelector } from '@/lib/hooks';
import { selectCurrentUser } from '@/lib/features/auth/authSlice';
import { useToast } from '@/hooks/useToast';
import { Toast } from '@/components/ui/Toast';
import type { MonthlyBonusTier, DriverEarningsConfig } from '@/lib/types/earningsConfig';

const ReportIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const SaveIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
  </svg>
);

export default function AdminMonthlyBonusPage() {
  const currentUser = useAppSelector(selectCurrentUser);
  const toast = useToast();

  const [franchiseId, setFranchiseId] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bonusTiers, setBonusTiers] = useState<Record<string, any>[]>([]);

  // Fetch config when franchise changes
  useEffect(() => {
    if (!franchiseId) return;

    const fetchConfig = async () => {
      try {
        setLoading(true);
        const response = await earningsConfigService.getFranchiseConfig(franchiseId);
        if (response.data?.data?.monthlyBonusTiers) {
          setBonusTiers(response.data.data.monthlyBonusTiers);
        } else {
          // Set default tiers
          setBonusTiers([
            { minEarnings: 25000, bonus: 3000 },
            { minEarnings: 28000, bonus: 500 },
            { minEarnings: 30000, bonus: 1000 },
            { minEarnings: 32000, bonus: 2000 },
            { minEarnings: 35000, bonus: 5000 },
          ]);
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          // Config doesn't exist - use defaults
          setBonusTiers([
            { minEarnings: 25000, bonus: 3000 },
            { minEarnings: 28000, bonus: 500 },
            { minEarnings: 30000, bonus: 1000 },
            { minEarnings: 32000, bonus: 2000 },
            { minEarnings: 35000, bonus: 5000 },
          ]);
        } else {
          toast.error('Failed to load bonus configuration');
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

    // Validate tiers
    const invalidTiers = bonusTiers.filter(t => t.minEarnings <= 0 || t.bonus < 0);
    if (invalidTiers.length > 0) {
      toast.error('Please enter valid values for all tiers');
      return;
    }

    try {
      setSaving(true);
      await earningsConfigService.updateFranchiseConfig(franchiseId, {
        monthlyBonusTiers: bonusTiers as MonthlyBonusTier[],
      });
      toast.success('Monthly bonus rules saved successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'minEarnings', label: 'Min Earnings (₹)', type: 'number' as const },
    { key: 'bonus', label: 'Bonus Amount (₹)', type: 'number' as const },
  ];

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
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
            <ReportIcon className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Monthly Bonus Rules</h1>
            <p className="text-sm text-gray-400">Configure monthly bonus tiers based on driver earnings.</p>
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
          {/* Bonus Tiers Table */}
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Bonus Tiers</h2>
            <p className="text-sm text-gray-400 mb-4">
              Drivers will receive the corresponding bonus when their monthly earnings reach the minimum threshold.
            </p>
            <DynamicTierTable
              tiers={bonusTiers}
              columns={columns}
              onChange={setBonusTiers}
              addButtonLabel="Add Bonus Tier"
              emptyMessage="No bonus tiers added yet. Click the button below to add."
            />
          </div>

          {/* Example Table */}
          <div className="rounded-xl border border-gray-800 bg-gray-900/30 p-6">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Example Configuration</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-2 px-4 text-gray-400">Monthly Earnings</th>
                    <th className="text-left py-2 px-4 text-gray-400">Bonus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  <tr>
                    <td className="py-2 px-4 text-gray-300">₹25,000</td>
                    <td className="py-2 px-4 text-green-400">₹3,000</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 text-gray-300">₹28,000</td>
                    <td className="py-2 px-4 text-green-400">₹500</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 text-gray-300">₹30,000</td>
                    <td className="py-2 px-4 text-green-400">₹1,000</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 text-gray-300">₹32,000</td>
                    <td className="py-2 px-4 text-green-400">₹2,000</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 text-gray-300">₹35,000</td>
                    <td className="py-2 px-4 text-green-400">Grade (Top Bonus)</td>
                  </tr>
                </tbody>
              </table>
            </div>
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
                  Save Bonus Rules
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed border-gray-700 rounded-xl">
          <p className="text-gray-400">Please select a franchise to configure bonus rules.</p>
        </div>
      )}
    </DashboardLayout>
  );
}
