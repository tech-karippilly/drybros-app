import api from '@/lib/axios';

export enum HolidayType {
  PUBLIC = 'PUBLIC',
  COMPANY = 'COMPANY',
  OPTIONAL = 'OPTIONAL',
}

export interface Holiday {
  id: string;
  franchiseId: string | null;
  name: string;
  date: string;
  type: HolidayType;
  description?: string;
  isRecurring: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  Franchise?: {
    id: string;
    name: string;
    code: string;
  };
  User?: {
    id: string;
    fullName: string;
    email: string;
  };
}

export interface KeralaHoliday {
  name: string;
  date: string;
  fullDate: string;
  isRecurring: boolean;
  type: HolidayType;
}

export interface CreateHolidayInput {
  name: string;
  date: string;
  type?: HolidayType;
  description?: string;
  isRecurring?: boolean;
  franchiseId?: string | null;
}

export interface UpdateHolidayInput {
  name?: string;
  date?: string;
  type?: HolidayType;
  description?: string;
  isRecurring?: boolean;
}

export interface HolidayFilters {
  franchiseId?: string;
  startDate?: string;
  endDate?: string;
  type?: HolidayType;
  year?: number;
}

export const holidayService = {
  // Get all holidays
  getHolidays: (filters?: HolidayFilters) => 
    api.get('/holidays', { params: filters }),

  // Get holiday by ID
  getHolidayById: (id: string) => 
    api.get(`/holidays/${id}`),

  // Get Kerala public holidays
  getKeralaPublicHolidays: (year?: number) => 
    api.get('/holidays/public-kerala', { params: { year } }),

  // Create new holiday
  createHoliday: (data: CreateHolidayInput) => 
    api.post('/holidays', data),

  // Update holiday
  updateHoliday: (id: string, data: UpdateHolidayInput) => 
    api.put(`/holidays/${id}`, data),

  // Delete holiday
  deleteHoliday: (id: string) => 
    api.delete(`/holidays/${id}`),

  // Bulk create Kerala holidays
  bulkCreateKeralaHolidays: (year: number, franchiseId?: string | null) => 
    api.post('/holidays/bulk-kerala', { year, franchiseId }),
};
