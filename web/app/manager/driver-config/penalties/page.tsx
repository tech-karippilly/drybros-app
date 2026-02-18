'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { penaltyService } from '@/services/penaltyService';
import { useAppSelector } from '@/lib/hooks';
import { selectCurrentUser } from '@/lib/features/auth/authSlice';
import { useToast } from '@/hooks/useToast';
import { Toast } from '@/components/ui/Toast';
import type { Penalty, PenaltyCategory, PenaltySeverity } from '@/lib/types/penalty';

const AlertIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const PlusIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const EditIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const SaveIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
  </svg>
);

export default function ManagerPenaltiesPage() {
  const currentUser = useAppSelector(selectCurrentUser);
  const toast = useToast();

  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPenalty, setEditingPenalty] = useState<Penalty | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    amount: number;
    category: PenaltyCategory;
    severity: PenaltySeverity;
    isActive: boolean;
  }>({
    name: '',
    description: '',
    amount: 0,
    category: 'OPERATIONAL',
    severity: 'MEDIUM',
    isActive: true,
  });

  const fetchPenalties = async () => {
    try {
      setLoading(true);
      const response = await penaltyService.getPenalties();
      if (response.data?.success) {
        setPenalties(response.data.data || []);
      }
    } catch (err: any) {
      toast.error('Failed to load penalties');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPenalties();
  }, []);

  const handleOpenModal = (penalty?: Penalty) => {
    if (penalty) {
      setEditingPenalty(penalty);
      setFormData({
        name: penalty.name,
        description: penalty.description || '',
        amount: penalty.amount,
        category: penalty.category,
        severity: penalty.severity,
        isActive: penalty.isActive,
      });
    } else {
      setEditingPenalty(null);
      setFormData({
        name: '',
        description: '',
        amount: 0,
        category: 'OPERATIONAL',
        severity: 'MEDIUM',
        isActive: true,
      });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name || formData.amount <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      if (editingPenalty) {
        await penaltyService.updatePenalty(editingPenalty.id, formData);
        toast.success('Penalty updated successfully');
      } else {
        await penaltyService.createPenalty(formData);
        toast.success('Penalty created successfully');
      }
      setShowModal(false);
      fetchPenalties();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save penalty');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this penalty?')) return;

    try {
      await penaltyService.deletePenalty(id);
      toast.success('Penalty deleted successfully');
      fetchPenalties();
    } catch (err: any) {
      toast.error('Failed to delete penalty');
    }
  };

  const handleToggleStatus = async (penalty: Penalty) => {
    try {
      await penaltyService.updatePenalty(penalty.id, { isActive: !penalty.isActive });
      toast.success(`Penalty ${penalty.isActive ? 'deactivated' : 'activated'} successfully`);
      fetchPenalties();
    } catch (err: any) {
      toast.error('Failed to update penalty status');
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      OPERATIONAL: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      BEHAVIORAL: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
      FINANCIAL: 'bg-green-500/10 text-green-400 border-green-500/30',
      SAFETY: 'bg-red-500/10 text-red-400 border-red-500/30',
    };
    return colors[category] || colors.OPERATIONAL;
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      LOW: 'bg-green-500/10 text-green-400 border-green-500/30',
      MEDIUM: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
      HIGH: 'bg-red-500/10 text-red-400 border-red-500/30',
    };
    return colors[severity] || colors.MEDIUM;
  };

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
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
            <AlertIcon className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Performance Penalties</h1>
            <p className="text-sm text-gray-400">View penalties for driver violations and performance issues.</p>
          </div>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          Add Penalty
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900/80">
                  <th className="text-left py-4 px-6 text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                  <th className="text-left py-4 px-6 text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                  <th className="text-left py-4 px-6 text-xs font-medium text-gray-400 uppercase tracking-wider">Category</th>
                  <th className="text-left py-4 px-6 text-xs font-medium text-gray-400 uppercase tracking-wider">Severity</th>
                  <th className="text-left py-4 px-6 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="text-right py-4 px-6 text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {penalties.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400">
                      No penalties configured yet. Click &quot;Add Penalty&quot; to create one.
                    </td>
                  </tr>
                ) : (
                  penalties.map((penalty) => (
                    <tr key={penalty.id} className="hover:bg-gray-800/30">
                      <td className="py-4 px-6">
                        <div>
                          <p className="text-sm font-medium text-white">{penalty.name}</p>
                          {penalty.description && (
                            <p className="text-xs text-gray-500 mt-1">{penalty.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm font-medium text-red-400">₹{penalty.amount}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getCategoryColor(penalty.category)}`}>
                          {penalty.category}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getSeverityColor(penalty.severity)}`}>
                          {penalty.severity}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <button
                          onClick={() => handleToggleStatus(penalty)}
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
                            penalty.isActive
                              ? 'bg-green-500/10 text-green-400 border-green-500/30'
                              : 'bg-gray-500/10 text-gray-400 border-gray-500/30'
                          }`}
                        >
                          {penalty.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal(penalty)}
                            className="p-2 rounded-lg text-blue-400 hover:bg-blue-500/10 transition-colors"
                            title="Edit"
                          >
                            <EditIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(penalty.id)}
                            className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Delete"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4">
              {editingPenalty ? 'Edit Penalty' : 'Add New Penalty'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Late Reporting"
                  className="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the violation"
                  rows={2}
                  className="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Amount (₹) *</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as PenaltyCategory })}
                    className="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="OPERATIONAL">Operational</option>
                    <option value="BEHAVIORAL">Behavioral</option>
                    <option value="FINANCIAL">Financial</option>
                    <option value="SAFETY">Safety</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Severity</label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value as PenaltySeverity })}
                    className="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Status</label>
                  <select
                    value={formData.isActive ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                    className="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-700 text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-sm font-medium text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <SaveIcon className="h-4 w-4" />
                    Save
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
