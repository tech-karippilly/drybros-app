"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  workingTimeService,
  WorkingTimeConfig,
  RoleType,
} from "@/services/workingTimeService";
import { franchiseService } from "@/services/franchiseService";
import { useToast, Modal, Button, Input } from "@/components/ui";

// Simple Select component
const Select = ({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    {...props}
    className={`w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${props.className || ''}`}
  >
    {children}
  </select>
);

const roleLabels: Record<RoleType, string> = {
  DRIVER: "Driver",
  STAFF: "Staff",
  MANAGER: "Manager",
};

export default function AdminWorkingTimeConfigPage() {
  const [configs, setConfigs] = useState<WorkingTimeConfig[]>([]);
  const [franchises, setFranchises] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFranchise, setSelectedFranchise] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<WorkingTimeConfig | null>(null);
  const [formData, setFormData] = useState({
    franchiseId: "",
    roleType: "DRIVER" as RoleType,
    minimumWorkHours: 8,
    lunchBreakMinutes: 60,
    snackBreakMinutes: 15,
    gracePeriodMinutes: 15,
    isActive: true,
  });

  const toast = useToast();

  useEffect(() => {
    fetchConfigs();
    fetchFranchises();
  }, [selectedFranchise]);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const response = await workingTimeService.getConfigs({
        franchiseId: selectedFranchise || undefined,
      });
      setConfigs(response.data.data || []);
    } catch (error) {
      toast.error("Failed to fetch working time configurations");
    } finally {
      setLoading(false);
    }
  };

  const fetchFranchises = async () => {
    try {
      const response = await franchiseService.getFranchises();
      setFranchises(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch franchises", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingConfig) {
        await workingTimeService.updateConfig(editingConfig.id, {
          minimumWorkHours: formData.minimumWorkHours,
          lunchBreakMinutes: formData.lunchBreakMinutes,
          snackBreakMinutes: formData.snackBreakMinutes,
          gracePeriodMinutes: formData.gracePeriodMinutes,
          isActive: formData.isActive,
        });
        toast.success("Configuration updated successfully");
      } else {
        await workingTimeService.createConfig(formData);
        toast.success("Configuration created successfully");
      }
      setIsModalOpen(false);
      setEditingConfig(null);
      resetForm();
      fetchConfigs();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save configuration");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this configuration?")) return;
    try {
      await workingTimeService.deleteConfig(id);
      toast.success("Configuration deleted successfully");
      fetchConfigs();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete configuration");
    }
  };

  const openCreateModal = () => {
    setEditingConfig(null);
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (config: WorkingTimeConfig) => {
    setEditingConfig(config);
    setFormData({
      franchiseId: config.franchiseId,
      roleType: config.roleType,
      minimumWorkHours: config.minimumWorkHours,
      lunchBreakMinutes: config.lunchBreakMinutes,
      snackBreakMinutes: config.snackBreakMinutes,
      gracePeriodMinutes: config.gracePeriodMinutes,
      isActive: config.isActive,
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      franchiseId: selectedFranchise || "",
      roleType: "DRIVER",
      minimumWorkHours: 8,
      lunchBreakMinutes: 60,
      snackBreakMinutes: 15,
      gracePeriodMinutes: 15,
      isActive: true,
    });
  };

  const formatMinutes = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">
            Working Time Configuration
          </h1>
          <Button onClick={openCreateModal}>Add Configuration</Button>
        </div>

        {/* Filters */}
        <div className="bg-gray-900/50 border border-gray-800 p-4 rounded-lg mb-6 flex gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Franchise
            </label>
            <Select
              value={selectedFranchise}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setSelectedFranchise(e.target.value)
              }
            >
              <option value="">All Franchises</option>
              {franchises.map((franchise) => (
                <option key={franchise.id} value={franchise.id}>
                  {franchise.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Configs Table */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading configurations...</div>
          ) : configs.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No configurations found. Click "Add Configuration" to create one.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-800">
              <thead className="bg-gray-900/80">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Franchise
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Min Work Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Lunch Break
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Snack Break
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Grace Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {configs.map((config) => (
                  <tr key={config.id} className="hover:bg-gray-800/30">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {config.Franchise?.name || "Unknown"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {roleLabels[config.roleType]}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {config.minimumWorkHours} hours
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {formatMinutes(config.lunchBreakMinutes)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {formatMinutes(config.snackBreakMinutes)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {config.gracePeriodMinutes} min
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {config.isActive ? (
                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium bg-green-500/10 text-green-400 border-green-500/30">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium bg-gray-500/10 text-gray-400 border-gray-500/30">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openEditModal(config)}
                        className="text-blue-400 hover:text-blue-300 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(config.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Create/Edit Modal */}
        <Modal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingConfig ? "Edit Configuration" : "Add Configuration"}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {!editingConfig && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Franchise *
                  </label>
                  <Select
                    value={formData.franchiseId}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setFormData({ ...formData, franchiseId: e.target.value })
                    }
                    required
                  >
                    <option value="">Select Franchise</option>
                    {franchises.map((franchise) => (
                      <option key={franchise.id} value={franchise.id}>
                        {franchise.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Role Type *
                  </label>
                  <Select
                    value={formData.roleType}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setFormData({ ...formData, roleType: e.target.value as RoleType })
                    }
                    required
                  >
                    <option value="DRIVER">Driver</option>
                    <option value="STAFF">Staff</option>
                    <option value="MANAGER">Manager</option>
                  </Select>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Minimum Work Hours *
              </label>
              <Input
                type="number"
                min={1}
                max={24}
                value={formData.minimumWorkHours}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({
                    ...formData,
                    minimumWorkHours: parseInt(e.target.value) || 0,
                  })
                }
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Lunch Break (minutes) *
              </label>
              <Input
                type="number"
                min={0}
                max={180}
                value={formData.lunchBreakMinutes}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({
                    ...formData,
                    lunchBreakMinutes: parseInt(e.target.value) || 0,
                  })
                }
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Snack Break (minutes) *
              </label>
              <Input
                type="number"
                min={0}
                max={60}
                value={formData.snackBreakMinutes}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({
                    ...formData,
                    snackBreakMinutes: parseInt(e.target.value) || 0,
                  })
                }
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Grace Period (minutes) *
              </label>
              <Input
                type="number"
                min={0}
                max={120}
                value={formData.gracePeriodMinutes}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({
                    ...formData,
                    gracePeriodMinutes: parseInt(e.target.value) || 0,
                  })
                }
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                Allowed late arrival time before marking as late
              </p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-300">
                Active
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outlined"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingConfig ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
