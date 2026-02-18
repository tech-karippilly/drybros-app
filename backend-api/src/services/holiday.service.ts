// src/services/holiday.service.ts
import prisma from "../config/prismaClient";
// Holiday type enum (matches Prisma schema)
export enum HolidayType {
  PUBLIC = "PUBLIC",
  COMPANY = "COMPANY",
  OPTIONAL = "OPTIONAL",
}
import { NotFoundError, BadRequestError } from "../utils/errors";

// Kerala Public Holidays (2024-2025)
// Note: Variable dates (like Onam, Eid) need to be updated yearly
export const KERALA_PUBLIC_HOLIDAYS = [
  { name: "New Year's Day", date: "01-01", isRecurring: true, type: HolidayType.PUBLIC },
  { name: "Republic Day", date: "01-26", isRecurring: true, type: HolidayType.PUBLIC },
  { name: "Maha Shivaratri", date: "03-08", isRecurring: false, type: HolidayType.PUBLIC }, // 2024 date
  { name: "Holi", date: "03-25", isRecurring: false, type: HolidayType.PUBLIC }, // 2024 date
  { name: "Good Friday", date: "03-29", isRecurring: false, type: HolidayType.PUBLIC }, // 2024 date
  { name: "Easter", date: "03-31", isRecurring: false, type: HolidayType.PUBLIC }, // 2024 date
  { name: "May Day", date: "05-01", isRecurring: true, type: HolidayType.PUBLIC },
  { name: "Eid-ul-Fitr", date: "04-11", isRecurring: false, type: HolidayType.PUBLIC }, // 2024 date
  { name: "Independence Day", date: "08-15", isRecurring: true, type: HolidayType.PUBLIC },
  { name: "Thiruvonam", date: "09-15", isRecurring: false, type: HolidayType.PUBLIC }, // 2024 date
  { name: "Gandhi Jayanti", date: "10-02", isRecurring: true, type: HolidayType.PUBLIC },
  { name: "Maha Navami", date: "10-12", isRecurring: false, type: HolidayType.PUBLIC }, // 2024 date
  { name: "Vijaya Dashami", date: "10-13", isRecurring: false, type: HolidayType.PUBLIC }, // 2024 date
  { name: "Deepavali", date: "11-01", isRecurring: false, type: HolidayType.PUBLIC }, // 2024 date
  { name: "Christmas", date: "12-25", isRecurring: true, type: HolidayType.PUBLIC },
];

export interface CreateHolidayInput {
  name: string;
  date: Date;
  type?: HolidayType;
  description?: string;
  isRecurring?: boolean;
  franchiseId?: string | null;
  createdBy: string;
}

export interface UpdateHolidayInput {
  name?: string;
  date?: Date;
  type?: HolidayType;
  description?: string;
  isRecurring?: boolean;
}

export interface HolidayFilters {
  franchiseId?: string;
  startDate?: Date;
  endDate?: Date;
  type?: HolidayType;
  year?: number;
}

/**
 * Get all holidays with optional filters
 */
export async function getHolidays(filters?: HolidayFilters) {
  const where: any = {};

  if (filters?.franchiseId) {
    where.OR = [
      { franchiseId: filters.franchiseId },
      { franchiseId: null }, // Include global holidays
    ];
  }

  if (filters?.type) {
    where.type = filters.type;
  }

  if (filters?.startDate && filters?.endDate) {
    where.date = {
      gte: filters.startDate,
      lte: filters.endDate,
    };
  } else if (filters?.year) {
    const startOfYear = new Date(filters.year, 0, 1);
    const endOfYear = new Date(filters.year, 11, 31);
    where.date = {
      gte: startOfYear,
      lte: endOfYear,
    };
  }

  const holidays = await prisma.holiday.findMany({
    where,
    include: {
      Franchise: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      User: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
    orderBy: {
      date: "asc",
    },
  });

  return holidays;
}

/**
 * Get holiday by ID
 */
export async function getHolidayById(id: string) {
  const holiday = await prisma.holiday.findUnique({
    where: { id },
    include: {
      Franchise: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      User: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  if (!holiday) {
    throw new NotFoundError("Holiday not found");
  }

  return holiday;
}

/**
 * Create a new holiday
 */
export async function createHoliday(input: CreateHolidayInput) {
  // Check if holiday already exists for this date and franchise
  const existingHoliday = await prisma.holiday.findFirst({
    where: {
      date: input.date,
      franchiseId: input.franchiseId || null,
    },
  });

  if (existingHoliday) {
    throw new BadRequestError("A holiday already exists for this date");
  }

  const holiday = await prisma.holiday.create({
    data: {
      name: input.name,
      date: input.date,
      type: input.type || HolidayType.PUBLIC,
      description: input.description,
      isRecurring: input.isRecurring || false,
      franchiseId: input.franchiseId,
      createdBy: input.createdBy,
    },
    include: {
      Franchise: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
  });

  return holiday;
}

/**
 * Update a holiday
 */
export async function updateHoliday(id: string, input: UpdateHolidayInput) {
  const existingHoliday = await prisma.holiday.findUnique({
    where: { id },
  });

  if (!existingHoliday) {
    throw new NotFoundError("Holiday not found");
  }

  const holiday = await prisma.holiday.update({
    where: { id },
    data: {
      name: input.name,
      date: input.date,
      type: input.type,
      description: input.description,
      isRecurring: input.isRecurring,
    },
    include: {
      Franchise: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
  });

  return holiday;
}

/**
 * Delete a holiday
 */
export async function deleteHoliday(id: string) {
  const existingHoliday = await prisma.holiday.findUnique({
    where: { id },
  });

  if (!existingHoliday) {
    throw new NotFoundError("Holiday not found");
  }

  await prisma.holiday.delete({
    where: { id },
  });

  return { success: true, message: "Holiday deleted successfully" };
}

/**
 * Get predefined Kerala public holidays
 */
export function getKeralaPublicHolidays(year?: number) {
  const targetYear = year || new Date().getFullYear();
  
  return KERALA_PUBLIC_HOLIDAYS.map((holiday) => {
    const [month, day] = holiday.date.split("-");
    const date = new Date(targetYear, parseInt(month) - 1, parseInt(day));
    
    return {
      ...holiday,
      date: date.toISOString().split("T")[0],
      fullDate: date,
    };
  });
}

/**
 * Check if a date is a holiday
 */
export async function isHoliday(date: Date, franchiseId?: string): Promise<boolean> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const where: any = {
    date: {
      gte: startOfDay,
      lte: endOfDay,
    },
  };

  if (franchiseId) {
    where.OR = [
      { franchiseId },
      { franchiseId: null },
    ];
  }

  const holiday = await prisma.holiday.findFirst({
    where,
  });

  return !!holiday;
}

/**
 * Bulk create holidays from Kerala public holidays list
 */
export async function bulkCreateKeralaHolidays(
  year: number,
  franchiseId: string | null,
  createdBy: string
) {
  const holidays = getKeralaPublicHolidays(year);
  const results = [];

  for (const holiday of holidays) {
    try {
      const created = await createHoliday({
        name: holiday.name,
        date: holiday.fullDate,
        type: holiday.type,
        description: `Kerala Public Holiday - ${holiday.name}`,
        isRecurring: holiday.isRecurring,
        franchiseId,
        createdBy,
      });
      results.push({ success: true, data: created });
    } catch (error: any) {
      // Skip if holiday already exists
      if (error.message?.includes("already exists")) {
        results.push({ success: false, error: "Already exists", name: holiday.name });
      } else {
        results.push({ success: false, error: error.message, name: holiday.name });
      }
    }
  }

  return {
    total: holidays.length,
    created: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    details: results,
  };
}
