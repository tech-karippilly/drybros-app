"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ClockButtons from "@/components/attendance/ClockButtons";
import { useAppSelector } from "@/lib/hooks";
import { selectCurrentUser } from "@/lib/features/auth/authSlice";

export default function StaffAttendancePage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const currentUser = useAppSelector(selectCurrentUser);

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

  // Mock attendance data for staff member - replace with actual API call
  const attendanceData: Record<number, { status: "present" | "absent" | "leave"; clockIn?: string; clockOut?: string }> = {
    1: { status: "present", clockIn: "09:15 AM", clockOut: "06:00 PM" },
    2: { status: "present", clockIn: "09:00 AM", clockOut: "06:10 PM" },
    3: { status: "leave" },
    5: { status: "present", clockIn: "09:10 AM", clockOut: "06:05 PM" },
    10: { status: "present", clockIn: "09:20 AM", clockOut: "06:00 PM" },
    15: { status: "present", clockIn: "09:05 AM", clockOut: "06:15 PM" },
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">My Attendance Calendar</h1>
          <p className="text-gray-400">View your attendance records and holidays</p>
        </div>

        {/* Clock In/Out Section */}
        {currentUser && (
          <div className="mb-6">
            <ClockButtons
              userId={currentUser.id}
              userName={currentUser.fullName}
              userRole={currentUser.role}
              staffId={currentUser.staffId}
              onStatusChange={() => {
                // Optionally refetch calendar data here
              }}
            />
          </div>
        )}

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
              const attendance = attendanceData[day];
              const statusColor = attendance?.status === "present" 
                ? "bg-green-500/10 border-green-500/30" 
                : attendance?.status === "leave"
                ? "bg-yellow-500/10 border-yellow-500/30"
                : attendance?.status === "absent"
                ? "bg-red-500/10 border-red-500/30"
                : "";

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
                      : attendance
                      ? `${statusColor} text-white`
                      : "border-gray-800 hover:border-gray-700 hover:bg-gray-800/50 text-white"
                    }
                  `}
                >
                  <div className="flex flex-col h-full items-center justify-center">
                    <span className="text-sm font-medium">{day}</span>
                    {attendance && (
                      <div className="mt-1">
                        <div 
                          className={`w-2 h-2 rounded-full ${
                            attendance.status === "present" 
                              ? "bg-green-400" 
                              : attendance.status === "leave"
                              ? "bg-yellow-400"
                              : "bg-red-400"
                          }`} 
                        />
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
              My Attendance - {selectedDate.toLocaleDateString("en-US", { 
                weekday: "long", 
                year: "numeric", 
                month: "long", 
                day: "numeric" 
              })}
            </h3>
            
            {attendanceData[selectedDate.getDate()] ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 w-24">Status:</span>
                  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${
                    attendanceData[selectedDate.getDate()].status === "present"
                      ? "bg-green-500/10 text-green-400 border-green-500/30"
                      : attendanceData[selectedDate.getDate()].status === "leave"
                      ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                      : "bg-red-500/10 text-red-400 border-red-500/30"
                  }`}>
                    {attendanceData[selectedDate.getDate()].status.toUpperCase()}
                  </span>
                </div>
                {attendanceData[selectedDate.getDate()].clockIn && (
                  <>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 w-24">Clock In:</span>
                      <span className="text-white">{attendanceData[selectedDate.getDate()].clockIn}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 w-24">Clock Out:</span>
                      <span className="text-white">{attendanceData[selectedDate.getDate()].clockOut}</span>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <p className="text-gray-400">No attendance record for this date.</p>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
