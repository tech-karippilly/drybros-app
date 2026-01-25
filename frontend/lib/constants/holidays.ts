/**
 * Public Holidays Constants
 * Contains Indian public holidays for the calendar display
 */

export interface Holiday {
  date: string; // Format: "YYYY-MM-DD"
  name: string;
  type: 'national' | 'regional' | 'religious';
}

/**
 * Indian Public Holidays for 2025-2026
 * Format: YYYY-MM-DD
 */
export const PUBLIC_HOLIDAYS: Holiday[] = [
  // 2025 Holidays
  { date: '2025-01-26', name: 'Republic Day', type: 'national' },
  { date: '2025-03-08', name: 'Holi', type: 'religious' },
  { date: '2025-03-29', name: 'Good Friday', type: 'religious' },
  { date: '2025-04-14', name: 'Ambedkar Jayanti', type: 'national' },
  { date: '2025-04-17', name: 'Ram Navami', type: 'religious' },
  { date: '2025-05-01', name: 'Labour Day', type: 'national' },
  { date: '2025-06-17', name: 'Eid ul-Fitr', type: 'religious' },
  { date: '2025-08-15', name: 'Independence Day', type: 'national' },
  { date: '2025-08-19', name: 'Raksha Bandhan', type: 'religious' },
  { date: '2025-08-26', name: 'Janmashtami', type: 'religious' },
  { date: '2025-10-02', name: 'Gandhi Jayanti', type: 'national' },
  { date: '2025-10-12', name: 'Dussehra', type: 'religious' },
  { date: '2025-10-20', name: 'Diwali', type: 'religious' },
  { date: '2025-10-21', name: 'Diwali', type: 'religious' },
  { date: '2025-11-01', name: 'Govardhan Puja', type: 'religious' },
  { date: '2025-12-25', name: 'Christmas', type: 'religious' },
  
  // 2026 Holidays
  { date: '2026-01-26', name: 'Republic Day', type: 'national' },
  { date: '2026-02-26', name: 'Holi', type: 'religious' },
  { date: '2026-04-03', name: 'Good Friday', type: 'religious' },
  { date: '2026-04-14', name: 'Ambedkar Jayanti', type: 'national' },
  { date: '2026-04-05', name: 'Ram Navami', type: 'religious' },
  { date: '2026-05-01', name: 'Labour Day', type: 'national' },
  { date: '2026-06-06', name: 'Eid ul-Fitr', type: 'religious' },
  { date: '2026-08-15', name: 'Independence Day', type: 'national' },
  { date: '2026-08-08', name: 'Raksha Bandhan', type: 'religious' },
  { date: '2026-08-15', name: 'Janmashtami', type: 'religious' },
  { date: '2026-10-02', name: 'Gandhi Jayanti', type: 'national' },
  { date: '2026-10-01', name: 'Dussehra', type: 'religious' },
  { date: '2026-10-09', name: 'Diwali', type: 'religious' },
  { date: '2026-10-10', name: 'Diwali', type: 'religious' },
  { date: '2026-10-20', name: 'Govardhan Puja', type: 'religious' },
  { date: '2026-12-25', name: 'Christmas', type: 'religious' },
];

/**
 * Get holidays for a specific date
 */
export function getHolidayForDate(date: Date): Holiday | undefined {
  const dateStr = formatDateForHoliday(date);
  return PUBLIC_HOLIDAYS.find((holiday) => holiday.date === dateStr);
}

/**
 * Get all holidays for a specific month
 */
export function getHolidaysForMonth(year: number, month: number): Holiday[] {
  return PUBLIC_HOLIDAYS.filter((holiday) => {
    const [holidayYear, holidayMonth] = holiday.date.split('-').map(Number);
    return holidayYear === year && holidayMonth === month;
  });
}

/**
 * Format date as YYYY-MM-DD for holiday matching
 */
function formatDateForHoliday(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
