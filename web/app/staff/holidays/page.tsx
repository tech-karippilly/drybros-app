"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { holidayService, Holiday, HolidayType } from "@/services/holidayService";
import { useToast } from "@/components/ui";

// Simple Select component
const Select = ({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    {...props}
    className={`w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${props.className || ''}`}
  >
    {children}
  </select>
);

export default function StaffHolidaysPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const toast = useToast();

  useEffect(() => {
    fetchHolidays();
  }, [selectedYear]);

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const response = await holidayService.getHolidays({
        year: selectedYear,
      });
      setHolidays(response.data.data || []);
    } catch (error) {
      toast.error("Failed to fetch holidays");
    } finally {
      setLoading(false);
    }
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
          <div>
            <h1 className="text-2xl font-bold text-white">Holidays</h1>
            <p className="text-gray-400 mt-1">View company holidays and public holidays</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-900/50 border border-gray-800 p-4 rounded-lg mb-6 flex gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Year</label>
            <Select
              value={selectedYear.toString()}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedYear(parseInt(e.target.value))}
            >
              {[2024, 2025, 2026].map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Holidays Table */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading holidays...</div>
          ) : holidays.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No holidays found for the selected year.
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
                    Recurring
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {holidays.map((holiday) => (
                  <tr key={holiday.id} className="hover:bg-gray-800/30">
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
                      {holiday.isRecurring ? (
                        <span className="text-green-400">Yes</span>
                      ) : (
                        <span className="text-gray-500">No</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
