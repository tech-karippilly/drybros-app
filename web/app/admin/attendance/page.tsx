"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import OnlineMembersCount from "@/components/attendance/OnlineMembersCount";
import AttendanceSummary from "@/components/attendance/AttendanceSummary";
import AttendanceList from "@/components/attendance/AttendanceList";
import AttendanceMonitor from "@/components/attendance/AttendanceMonitor";
import { useAppSelector } from "@/lib/hooks";
import { selectCurrentUser } from "@/lib/features/auth/authSlice";
import { attendanceService } from "@/services/attendanceService";
import { franchiseService } from "@/services/franchiseService";

export default function AdminAttendancePage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [attendanceData, setAttendanceData] = useState<Record<number, { present: number; absent: number; leave: number }>>({});
  const [loading, setLoading] = useState(true);
  const [franchises, setFranchises] = useState<any[]>([]);
  const [selectedFranchise, setSelectedFranchise] = useState<string>('');
  const currentUser = useAppSelector(selectCurrentUser);
  const franchiseId = selectedFranchise || undefined;

  // Fetch franchises
  useEffect(() => {
    const fetchFranchises = async () => {
      try {
        const response = await franchiseService.getFranchises();
        const data = response.data?.data || response.data || [];
        setFranchises(data);
        
        // Set first franchise as default if none selected
        if (data.length > 0 && !selectedFranchise) {
          setSelectedFranchise(data[0].id);
        }
      } catch (error: any) {
        console.error('Error fetching franchises:', error);
        
        // Handle authentication errors
        if (error?.response?.status === 401 || error?.response?.status === 403) {
          console.error('Authentication failed while fetching franchises');
        }
      }
    };

    fetchFranchises();
  }, []);

  // Fetch attendance data
  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        setLoading(true);
        // Fetch actual attendance data from API
        const params: any = {
          dateFrom: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString(),
          dateTo: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString(),
        };
        
        // Only add franchiseId if it's a valid UUID and not an empty string
        if (selectedFranchise && selectedFranchise.trim() !== '') {
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          if (uuidRegex.test(selectedFranchise)) {
            params.franchiseId = selectedFranchise;
          }
        }
        
        const response = await attendanceService.getAllAttendances(params);
        
        // Process the response to match our expected format
        const processedData: Record<number, { present: number; absent: number; leave: number }> = {};
        
        // Process actual API response data and remove duplicates
        if (response.data?.data) {
          // Use a Map to track unique person-date combinations
          const uniqueRecords = new Map<string, any>();
          
          response.data.data.forEach((record: any) => {
            const personId = record.staffId || record.driverId || record.userId || 'unknown';
            const recordDate = new Date(record.date).toDateString();
            const uniqueKey = `${personId}-${recordDate}`;
            
            // Only keep one record per person per date (the first one)
            if (!uniqueRecords.has(uniqueKey)) {
              uniqueRecords.set(uniqueKey, record);
            }
          });
          
          // Process the deduplicated records
          Array.from(uniqueRecords.values()).forEach((record: any) => {
            const day = new Date(record.date).getDate();
            if (!processedData[day]) {
              processedData[day] = { present: 0, absent: 0, leave: 0 };
            }
            if (record.status === 'PRESENT') {
              processedData[day].present += 1;
            } else if (record.status === 'ABSENT') {
              processedData[day].absent += 1;
            } else if (record.status === 'LEAVE') {
              processedData[day].leave += 1;
            }
          });
        }
        setAttendanceData(processedData);
      } catch (error: any) {
        console.error('Error fetching attendance data:', error);
        
        // Handle authentication errors specifically
        if (error?.response?.status === 401 || error?.response?.status === 403) {
          console.error('Authentication failed. Please refresh the page or log in again.');
        }
        
        // Set empty data on error
        setAttendanceData({});
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceData();
  }, [currentDate]);

  // Get calendar data
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      day === selectedDate.getDate() &&
      month === selectedDate.getMonth() &&
      year === selectedDate.getFullYear()
    );
  };

  const handleDateClick = (day: number) => {
    setSelectedDate(new Date(year, month, day));
  };


  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Attendance Management</h1>
              <p className="text-gray-400">View and manage attendance records</p>
            </div>
            
            {/* Franchise Selection */}
            <div className="flex items-center gap-3">
              <label htmlFor="franchise-select" className="text-sm text-gray-300 whitespace-nowrap">
                Select Franchise:
              </label>
              <select
                id="franchise-select"
                value={selectedFranchise}
                onChange={(e) => setSelectedFranchise(e.target.value)}
                className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {franchises.map((franchise) => (
                  <option key={franchise.id} value={franchise.id}>
                    {franchise.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Online Members Count */}
        <div className="mb-6">
          <OnlineMembersCount franchiseId={franchiseId} />
        </div>
        
        {/* Attendance Summary */}
        <div className="mb-6">
          <AttendanceSummary date={selectedDate || undefined} />
        </div>

        {/* Attendance List */}
        <div className="mb-6">
          <AttendanceList 
            date={selectedDate || new Date()} 
            franchiseId={selectedFranchise || undefined} 
          />
        </div>

        {/* Real-time Attendance Monitor */}
        <div className="mb-6">
          <AttendanceMonitor franchiseId={selectedFranchise || undefined} />
        </div>



        {/* Calendar */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">
              {monthNames[month]} {year}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={previousMonth}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Previous
              </button>
              <button
                onClick={nextMonth}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Next
              </button>
            </div>
          </div>

          {/* Week Days Header */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-gray-400 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: startingDayOfWeek }).map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square" />
            ))}

            {/* Calendar days */}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const hasAttendance = attendanceData[day];

              return (
                <button
                  key={day}
                  onClick={() => handleDateClick(day)}
                  className={`
                    aspect-square p-2 rounded-lg border transition-colors
                    ${isToday(day)
                      ? "border-blue-500 bg-blue-500/10 text-blue-400"
                      : isSelected(day)
                      ? "border-blue-400 bg-blue-400/5 text-blue-300"
                      : "border-gray-800 hover:border-gray-700 hover:bg-gray-800/50 text-white"
                    }
                  `}
                >
                  <div className="flex flex-col h-full">
                    <span className="text-sm font-medium">{day}</span>
                    {hasAttendance && (
                      <div className="mt-auto flex gap-1 justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400" title="Present" />
                        {hasAttendance.absent > 0 && (
                          <div className="w-1.5 h-1.5 rounded-full bg-red-400" title="Absent" />
                        )}
                        {hasAttendance.leave > 0 && (
                          <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" title="Leave" />
                        )}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 mt-6 pt-6 border-t border-gray-800">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <span className="text-sm text-gray-300">Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <span className="text-sm text-gray-300">Absent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <span className="text-sm text-gray-300">Leave</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-blue-500 bg-blue-500/10" />
              <span className="text-sm text-gray-300">Today</span>
            </div>
          </div>
        </div>

        {/* Selected Date Details */}
        {selectedDate && (
          <div className="mt-6 bg-gray-900/50 border border-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Attendance Summary - {selectedDate.toLocaleDateString("en-US", { 
                weekday: "long", 
                year: "numeric", 
                month: "long", 
                day: "numeric" 
              })}
            </h3>
            
            {attendanceData[selectedDate.getDate()] ? (
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-400">
                    {attendanceData[selectedDate.getDate()].present}
                  </div>
                  <div className="text-sm text-gray-300">Present</div>
                </div>
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <div className="text-2xl font-bold text-red-400">
                    {attendanceData[selectedDate.getDate()].absent}
                  </div>
                  <div className="text-sm text-gray-300">Absent</div>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <div className="text-2xl font-bold text-yellow-400">
                    {attendanceData[selectedDate.getDate()].leave}
                  </div>
                  <div className="text-sm text-gray-300">On Leave</div>
                </div>
              </div>
            ) : (
              <p className="text-gray-400">No attendance data available for this date.</p>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
