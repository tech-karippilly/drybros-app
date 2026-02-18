"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { holidayService, Holiday, HolidayType, KeralaHoliday } from "@/services/holidayService";
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

export default function AdminHolidaysPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [franchises, setFranchises] = useState<{ id: string; name: string }[]>([]);
  const [keralaHolidays, setKeralaHolidays] = useState<KeralaHoliday[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedFranchise, setSelectedFranchise] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isKeralaModalOpen, setIsKeralaModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    type: HolidayType.PUBLIC,
    description: "",
    isRecurring: false,
    franchiseId: "",
  });

  const toast = useToast();

  useEffect(() => {
    fetchHolidays();
    fetchFranchises();
    fetchKeralaHolidays();
  }, [selectedYear, selectedFranchise]);

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const response = await holidayService.getHolidays({
        year: selectedYear,
        franchiseId: selectedFranchise || undefined,
      });
      setHolidays(response.data.data || []);
    } catch (error) {
      toast.error("Failed to fetch holidays");
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

  const fetchKeralaHolidays = async () => {
    try {
      const response = await holidayService.getKeralaPublicHolidays(selectedYear);
      setKeralaHolidays(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch Kerala holidays", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingHoliday) {
        await holidayService.updateHoliday(editingHoliday.id, formData);
        toast.success("Holiday updated successfully");
      } else {
        await holidayService.createHoliday({
          ...formData,
          franchiseId: formData.franchiseId || null,
        });
        toast.success("Holiday created successfully");
      }
      setIsModalOpen(false);
      setEditingHoliday(null);
      resetForm();
      fetchHolidays();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save holiday");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this holiday?")) return;
    try {
      await holidayService.deleteHoliday(id);
      toast.success("Holiday deleted successfully");
      fetchHolidays();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete holiday");
    }
  };

  const handleBulkCreateKerala = async () => {
    try {
      const response = await holidayService.bulkCreateKeralaHolidays(
        selectedYear,
        selectedFranchise || null
      );
      toast.success(`Created ${response.data.data.created} holidays successfully`);
      setIsKeralaModalOpen(false);
      fetchHolidays();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create holidays");
    }
  };

  const openCreateModal = () => {
    setEditingHoliday(null);
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setFormData({
      name: holiday.name,
      date: holiday.date.split("T")[0],
      type: holiday.type,
      description: holiday.description || "",
      isRecurring: holiday.isRecurring,
      franchiseId: holiday.franchiseId || "",
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      date: "",
      type: HolidayType.PUBLIC,
      description: "",
      isRecurring: false,
      franchiseId: "",
    });
  };

  const getHolidayTypeBadge = (type: HolidayType) => {
    const colors = {
      [HolidayType.PUBLIC]: "bg-blue-500/10 text-blue-400 border-blue-500/30",
      [HolidayType.COMPANY]: "bg-green-500/10 text-green-400 border-green-500/30",
      [HolidayType.OPTIONAL]: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
    };
    return (
      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${colors[type]}`}>
        {type}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Holiday Management</h1>
          <div className="flex gap-3">
            <Button variant="outlined" color="secondary" onClick={() => setIsKeralaModalOpen(true)}>
              Add Kerala Holidays
            </Button>
            <Button onClick={openCreateModal}>Add Holiday</Button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800 mb-6 flex gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Year</label>
            <Select
              value={selectedYear.toString()}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            >
              {[2024, 2025, 2026].map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Franchise
            </label>
            <Select
              value={selectedFranchise}
              onChange={(e) => setSelectedFranchise(e.target.value)}
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

        {/* Holidays Table */}
        <div className="bg-gray-900/50 rounded-lg border border-gray-800 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading holidays...</div>
          ) : holidays.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No holidays found for the selected filters.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-800">
              <thead className="bg-gray-900/80">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Franchise
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Recurring
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {holidays.map((holiday) => (
                  <tr key={holiday.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">
                        {holiday.name}
                      </div>
                      {holiday.description && (
                        <div className="text-xs text-gray-400">
                          {holiday.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {formatDate(holiday.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getHolidayTypeBadge(holiday.type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {holiday.Franchise?.name || (
                        <span className="text-gray-500 italic">Global</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {holiday.isRecurring ? (
                        <span className="text-green-400">Yes</span>
                      ) : (
                        <span className="text-gray-500">No</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openEditModal(holiday)}
                        className="text-blue-400 hover:text-blue-300 mr-3 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(holiday.id)}
                        className="text-red-400 hover:text-red-300 transition-colors"
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
          title={editingHoliday ? "Edit Holiday" : "Add Holiday"}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Holiday Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Republic Day"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Date *
              </label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Type *
              </label>
              <Select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as HolidayType })
                }
              >
                <option value={HolidayType.PUBLIC}>Public Holiday</option>
                <option value={HolidayType.COMPANY}>Company Holiday</option>
                <option value={HolidayType.OPTIONAL}>Optional Holiday</option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Description
              </label>
              <Input
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Optional description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Franchise
              </label>
              <Select
                value={formData.franchiseId}
                onChange={(e) =>
                  setFormData({ ...formData, franchiseId: e.target.value })
                }
              >
                <option value="">Global (All Franchises)</option>
                {franchises.map((franchise) => (
                  <option key={franchise.id} value={franchise.id}>
                    {franchise.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isRecurring"
                checked={formData.isRecurring}
                onChange={(e) =>
                  setFormData({ ...formData, isRecurring: e.target.checked })
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="isRecurring"
                className="ml-2 block text-sm text-gray-300"
              >
                Recurring yearly (e.g., New Year, Christmas)
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
                {editingHoliday ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Kerala Holidays Modal */}
        <Modal
          open={isKeralaModalOpen}
          onClose={() => setIsKeralaModalOpen(false)}
          title="Add Kerala Public Holidays"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-300">
              This will add all Kerala public holidays for {selectedYear}. You can
              customize them after adding.
            </p>

            <div className="max-h-64 overflow-y-auto border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Name
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {keralaHolidays.map((holiday, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {holiday.name}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {formatDate(holiday.fullDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Apply to Franchise (Optional)
              </label>
              <Select
                value={selectedFranchise}
                onChange={(e) => setSelectedFranchise(e.target.value)}
              >
                <option value="">All Franchises (Global)</option>
                {franchises.map((franchise) => (
                  <option key={franchise.id} value={franchise.id}>
                    {franchise.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsKeralaModalOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleBulkCreateKerala}>
                Add {keralaHolidays.length} Holidays
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
