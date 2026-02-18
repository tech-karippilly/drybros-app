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
import type { MonthlyDeductionTier } from '@/lib/types/earningsConfig';

const CutIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
  </svg>
);

const SaveIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
  </svg>
);

export default function ManagerDeductionPolicyPage() {
  const currentUser = useAppSelector(selectCurrentUser);
  const toast = useToast();

  const [franchiseId, setFranchiseId] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deductionTiers, setDeductionTiers] = useState<Record<string, any>[]>([]);

  // Fetch config when franchise changes
  useEffect(() => {
    if (!franchiseId) return;

    const fetchConfig = async () => {
      try {
        setLoading(true);
        const response = await earningsConfigService.getFranchiseConfig(franchiseId);
        if (response.data?.data?.monthlyDeductionTiers) {
          setDeductionTiers(response.data.data.monthlyDeductionTiers);
        } else {
          // Set default tiers
          setDeductionTiers([
            { maxEarnings: 22000, cutPercent: 20 },
            { maxEarnings: 26000, cutPercent: 25 },
          ]);
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          // Config doesn't exist - use defaults
          setDeductionTiers([
            { maxEarnings: 22000, cutPercent: 20 },
            { maxEarnings: 26000, cutPercent: 25 },
          ]);
        } else {
          toast.error('Failed to load deduction policy');
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
    const invalidTiers = deductionTiers.filter(t => t.maxEarnings <= 0 || t.cutPercent < 0 || t.cutPercent > 100);
    if (invalidTiers.length > 0) {
      toast.error('Please enter valid values for all tiers (cut percentage must be 0-100)');
      return;
    }

    try {
      setSaving(true);
      await earningsConfigService.updateFranchiseConfig(franchiseId, {
        monthlyDeductionTiers: deductionTiers as MonthlyDeductionTier[],
      });
      toast.success('Monthly deduction policy saved successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save policy');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'maxEarnings', label: 'Max Earnings Threshold (₹)', type: 'number' as const },
    { key: 'cutPercent', label: 'Cut Percentage (%)', type: 'number' as const },
  ];

  return (
    <DashboardLayout
      user={{ name: currentUser?.fullName || 'Manager User', role: currentUser?.role || 'Manager' }}
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
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
            <CutIcon className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Monthly Deduction Policy</h1>
            <p className="text-sm text-gray-400">Configure monthly deduction tiers based on driver earnings thresholds.</p>
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
          filterByManager={true}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        </div>
      ) : franchiseId ? (
        <div className="space-y-6">
          {/* Deduction Tiers Table */}
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Deduction Tiers</h2>
            <p className="text-sm text-gray-400 mb-4">
              When a driver&apos;s monthly earnings are below the threshold, the corresponding percentage will be deducted.
            </p>
            <DynamicTierTable
              tiers={deductionTiers}
              columns={columns}
              onChange={setDeductionTiers}
              addButtonLabel="Add Deduction Tier"
              emptyMessage="No deduction tiers added yet. Click the button below to add."
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
                    <th className="text-left py-2 px-4 text-gray-400">Deduction</th>
                    <th className="text-left py-2 px-4 text-gray-400">Net Payable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  <tr>
                    <td className="py-2 px-4 text-gray-300">₹20,000</td>
                    <td className="py-2 px-4 text-red-400">20%</td>
                    <td className="py-2 px-4 text-gray-300">₹16,000</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 text-gray-300">₹22,000</td>
                    <td className="py-2 px-4 text-red-400">20%</td>
                    <td className="py-2 px-4 text-gray-300">₹17,600</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 text-gray-300">₹25,000</td>
                    <td className="py-2 px-4 text-red-400">25%</td>
                    <td className="py-2 px-4 text-gray-300">₹18,750</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 text-gray-300">₹30,000+</td>
                    <td className="py-2 px-4 text-green-400">No Deduction</td>
                    <td className="py-2 px-4 text-gray-300">Full Amount</td>
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
                  Save Deduction Policy
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed border-gray-700 rounded-xl">
          <p className="text-gray-400">Please select a franchise to configure deduction policy.</p>
        </div>
      )}
    </DashboardLayout>
  );
}
