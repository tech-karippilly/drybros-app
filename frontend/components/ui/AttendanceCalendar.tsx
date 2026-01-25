"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
    addMonths,
    eachDayOfInterval,
    endOfMonth,
    endOfWeek,
    format,
    isSameDay,
    isSameMonth,
    isToday,
    startOfMonth,
    startOfWeek,
    subMonths,
    getMonth,
    getYear,
} from "date-fns";
import { cn } from "@/lib/utils";
import { getHolidayForDate, getHolidaysForMonth, type Holiday } from "@/lib/constants/holidays";

export interface AttendanceCalendarProps {
    className?: string;
    value?: Date;
    onChange?: (date: Date) => void;
    attendanceDates?: Set<string>; // Set of dates with attendance in "YYYY-MM-DD" format
    showHolidays?: boolean;
}

const AttendanceCalendar = ({ 
    className, 
    value, 
    onChange,
    attendanceDates = new Set(),
    showHolidays = true,
}: AttendanceCalendarProps) => {
    const [currentMonth, setCurrentMonth] = React.useState(new Date());
    const selectedDate = value;

    const onPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const onNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // Get holidays for current month
    const monthHolidays = React.useMemo(() => {
        if (!showHolidays) return new Map<string, Holiday>();
        const holidays = getHolidaysForMonth(getYear(currentMonth), getMonth(currentMonth) + 1);
        const holidayMap = new Map<string, Holiday>();
        holidays.forEach((holiday) => {
            holidayMap.set(holiday.date, holiday);
        });
        return holidayMap;
    }, [currentMonth, showHolidays]);

    const formatDateKey = (date: Date): string => {
        return format(date, "yyyy-MM-dd");
    };

    const hasAttendance = (date: Date): boolean => {
        return attendanceDates.has(formatDateKey(date));
    };

    return (
        <div className={cn("p-3 w-full border rounded-xl bg-white dark:bg-gray-900 shadow-sm", className)}>
            <div className="flex items-center justify-between space-x-4 pb-2 mb-2 border-b border-gray-200 dark:border-gray-800">
                <h4 className="text-xl font-semibold text-[#0d121c] dark:text-white">
                    {format(currentMonth, "MMMM yyyy")}
                </h4>
                <div className="flex items-center space-x-1">
                    <button
                        onClick={onPreviousMonth}
                        className={cn(
                            "h-8 w-8 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 p-0 opacity-50 hover:opacity-100 rounded-md flex items-center justify-center transition-colors",
                        )}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                        onClick={onNextMonth}
                        className={cn(
                            "h-8 w-8 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 p-0 opacity-50 hover:opacity-100 rounded-md flex items-center justify-center transition-colors",
                        )}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center mb-1">
                {weekDays.map((day) => (
                    <div key={day} className="text-gray-500 dark:text-gray-400 font-semibold text-sm py-1">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day) => {
                    const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const dateKey = formatDateKey(day);
                    const holiday = monthHolidays.get(dateKey);
                    const hasAtt = hasAttendance(day);
                    const isTodayDate = isToday(day);

                    return (
                        <button
                            key={day.toString()}
                            onClick={() => onChange?.(day)}
                            className={cn(
                                "h-24 w-full p-1.5 font-normal text-base rounded-lg flex flex-col items-center justify-center transition-colors relative",
                                !isCurrentMonth && "text-gray-300 dark:text-gray-600 pointer-events-none",
                                isCurrentMonth && "text-[#0d121c] dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800",
                                isSelected && "bg-[#0d59f2] text-white hover:bg-[#0d59f2]/90 dark:bg-[#0d59f2] dark:text-white",
                                isTodayDate && !isSelected && "text-[#0d59f2] font-semibold bg-blue-50 dark:bg-blue-900/30",
                                holiday && !isSelected && "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800",
                            )}
                            title={holiday ? holiday.name : undefined}
                        >
                            <span className={cn(
                                "text-lg font-semibold",
                                holiday && !isSelected && "text-amber-700 dark:text-amber-400",
                            )}>
                                {format(day, "d")}
                            </span>
                            {holiday && (
                                <span className="text-[10px] leading-tight text-amber-600 dark:text-amber-400 truncate w-full px-1 mt-0.5">
                                    {holiday.name.length > 10 ? holiday.name.substring(0, 9) + '...' : holiday.name}
                                </span>
                            )}
                            {hasAtt && !holiday && (
                                <span className="absolute bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-green-500" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-800 flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800" />
                    <span className="text-gray-600 dark:text-gray-400">Public Holiday</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-green-500" />
                    <span className="text-gray-600 dark:text-gray-400">Has Attendance</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-blue-50 dark:bg-blue-900/30 border border-[#0d59f2]" />
                    <span className="text-gray-600 dark:text-gray-400">Today</span>
                </div>
            </div>
        </div>
    );
};

export { AttendanceCalendar };
