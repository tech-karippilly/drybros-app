export type DriverStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'TERMINATED';
export type DriverTripStatus = 'AVAILABLE' | 'ON_TRIP';
export type EmploymentType = 'part time' | 'full time' | 'contract';

// Car and Transmission types from backend
export type CarCategory = 'NORMAL' | 'PREMIUM' | 'LUXURY' | 'SPORTS';
export type TransmissionType = 'MANUAL' | 'AUTOMATIC' | 'EV';

// Legacy car types from backend
export type LegacyCarType = 'MANUAL' | 'AUTOMATIC' | 'PREMIUM_CARS' | 'LUXURY_CARS' | 'SPORTY_CARS';

export interface DriverCar {
  id: string;
  driverId: string;
  carType: 'HATCHBACK' | 'SEDAN' | 'SUV' | 'LUXURY';
  transmission: 'MANUAL' | 'AUTOMATIC';
  brand: string | null;
  model: string | null;
  registrationNo: string;
  color: string | null;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Driver {
  id: string;
  franchiseId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  altPhone: string | null;
  driverCode: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  licenseNumber: string;
  licenseType: string | null;
  employmentType: EmploymentType | null;
  licenseExpDate: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankIfscCode: string;
  aadharCard: boolean;
  license: boolean;
  educationCert: boolean;
  previousExp: boolean;
  status: DriverStatus;
  driverTripStatus: DriverTripStatus;
  complaintCount: number;
  warningCount: number;
  blacklisted: boolean;
  bannedGlobally: boolean;
  currentRating: number | null;
  onlineStatus: boolean;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  cars?: DriverCar[];
  // Additional fields for listing
  franchiseName?: string;
  transmissionTypes?: TransmissionType[];
  carCategories?: CarCategory[];
  carTypes?: LegacyCarType[];
}

export interface CreateDriverRequest {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  altPhone?: string;
  password: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  licenseNumber: string;
  licenseType?: string;
  employmentType: EmploymentType;
  licenseExpDate: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankIfscCode: string;
  aadharCard: boolean;
  license: boolean;
  educationCert: boolean;
  previousExp: boolean;
  franchiseId?: string;
  transmissionTypes?: TransmissionType[];
  carCategories?: CarCategory[];
  carTypes?: LegacyCarType[];
}

export interface UpdateDriverRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  altPhone?: string | null;
  password?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  licenseNumber?: string;
  licenseType?: string;
  employmentType?: EmploymentType | null;
  licenseExpDate?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  aadharCard?: boolean;
  license?: boolean;
  educationCert?: boolean;
  previousExp?: boolean;
}

export interface UpdateDriverStatusRequest {
  status: DriverStatus;
}

export interface DriverListResponse {
  success: boolean;
  message: string;
  data: Driver[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface DriverResponse {
  success: boolean;
  message: string;
  data: Driver;
}

export interface DriverFilters {
  page?: number;
  limit?: number;
  franchiseId?: string;
  status?: DriverStatus;
  employmentType?: EmploymentType;
  search?: string;
  includeInactive?: boolean;
  includePerformance?: boolean;
}

export interface DriverPerformance {
  driverId: string;
  totalTrips: number;
  completedTrips: number;
  cancelledTrips: number;
  totalEarnings: number;
  averageRating: number;
  attendancePercentage: number;
}

export interface DriverWithPerformance extends Driver {
  performance?: DriverPerformance;
}

// Constants for dropdowns
export const DRIVER_STATUS_OPTIONS: { value: DriverStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'BLOCKED', label: 'Blocked' },
  { value: 'TERMINATED', label: 'Terminated' },
];

export const EMPLOYMENT_TYPE_OPTIONS: { value: EmploymentType; label: string }[] = [
  { value: 'full time', label: 'Full-time' },
  { value: 'part time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
];

export const TRANSMISSION_TYPE_OPTIONS: { value: TransmissionType; label: string }[] = [
  { value: 'MANUAL', label: 'Manual' },
  { value: 'AUTOMATIC', label: 'Automatic' },
  { value: 'EV', label: 'Electric Vehicle' },
];

export const CAR_CATEGORY_OPTIONS: { value: CarCategory; label: string }[] = [
  { value: 'NORMAL', label: 'Normal' },
  { value: 'PREMIUM', label: 'Premium' },
  { value: 'LUXURY', label: 'Luxury' },
  { value: 'SPORTS', label: 'Sports' },
];

export const EMERGENCY_CONTACT_RELATIONS = [
  'Spouse',
  'Parent',
  'Sibling',
  'Child',
  'Friend',
  'Relative',
  'Other',
];
