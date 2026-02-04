// represents db User
export interface User {
  _id        :number;
  email     :string;
  password  :string;
  fullName  :string;
  role      :UserRole;
  isActive  :boolean;
  createdAt :string;
  updatedAt :string;
}

// represents db Driver
export interface Driver {
    _id: number;
    franchiseId: number | null;
    franchiseName: string | null;
    firstName: string;
    lastName: string;
    driverPhone: string;
    driverAltPhone :string | null;
    status: DriverStatus;
    complaintCount: number;
    bannedGlobally: boolean;
    dailyTargetAmount: number | null;
    currentRating : number | null;
    createdAt :string; // ISO string
    updatedAt :string; // ISO string
    // trips : Trip[];

}

export interface CreateDriverInput{
    userId? :number; // foreign key to users table (optional for API)
    firstName: string;
    lastName: string;
    email: string;
    driverPhone: string;
    driverAltPhone? :string | null;
    password: string;
    phone:string;
    altPhone:string; // Required for creating driver

    // personal details
    dateOfBirth?: string; // ISO Date string (optional, not in backend DTO)
    gender?: GenderType; // Optional, not in backend DTO
    profilePhoto?: string | null; // Optional, not in backend DTO
    licenseNumber: string;
    licenseType?: string; // Optional, not in backend DTO
    licenseExpDate: string; // ISO Date string
    documentsCollected? :string[]; // Optional, mapped to boolean flags

    // Address Details
    address: string;
    city: string;
    state: string;
    pincode: string;

    // Employment Details
    franchiseId: number | string; // Can be number or UUID string
    dateOfJoining?: string; // ISO Date string (optional, not in backend DTO)
    assignedCity?: string; // Optional, not in backend DTO
    employmentType?: EmploymentType; // Optional, not in backend DTO

    // Bank Details
    bankAccountNumber: string;
    bankAccountName: string;
    bankIfscCode: string;
    upiId?: string | null; // Optional, not in backend DTO

    // Emergency Contact
    emergencyContactName: string;
    emergencyContactPhone: string;
    emergencyContactRelation: string;
    
    // Car types (required for backend)
    carTypes?: ('MANUAL' | 'AUTOMATIC' | 'PREMIUM_CARS' | 'LUXURY_CARS' | 'SPORTY_CARS')[];
    aadharCard: boolean;
    license: boolean;
    educationCert: boolean;
    previousExp: boolean;
}

// keeping the return values to null for the elements
// that is not updated
export interface UpdateDriverInput{
    _id?: number | string; // Can be number or UUID string
    userId? :number; // foreign key to users table (optional)
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    driverPhone: string | null;
    driverAltPhone :string | null;

    // personal details
    dateOfBirth: string | null; // ISO Date string
    gender: GenderType | null;
    profilePhoto: string | null;
    licenseNumber: string | null;
    licenseType: string | null;
    licenseExpiryDate: string | null; // ISO Date string
    documentsCollected :string[] | null;

    // Address Details
    address: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;

    // Employment Details
    franchiseId: number | string | null;
    dateOfJoining: string | null; // ISO Date string
    assignedCity: string | null;
    employmentType:EmploymentType | null;

    // Bank Details
    bankAccountNumber: string | null;
    accountHolderName: string | null;
    ifscCode: string | null;
    upiId: string | null;

    // Emergency Contact
    contactName: string | null;
    contactNumber: string | null;
    relationship: string | null;

    carTypes?: ('MANUAL' | 'AUTOMATIC' | 'PREMIUM_CARS' | 'LUXURY_CARS' | 'SPORTY_CARS')[] | null;
}


// no null values for necessary fields 
export interface GetDriver{
    _id: number;
    id?: string; // UUID string from backend (for API calls)
    userId :number; // foreign key to users table
    firstName: string;
    lastName: string;
    driverPhone: string;
    driverAltPhone :string | null;
    email: string;
    status: DriverStatus;
    complaintCount: number;
    bannedGlobally: boolean;
    dailyTargetAmount: number;
    currentRating : number;
    createdAt :string; // ISO string
    updatedAt :string; // ISO string
    // trips : Trip[];

    // personal details
    dateOfBirth: string; // ISO Date string
    gender: GenderType;
    profilePhoto: string ;
    licenseNumber: string ;
    licenseType: string ;
    licenseFront: string ;
    licenseBack: string ;
    licenseExpiryDate: string ; // ISO Date string
    documentsCollected: string[] ;

    // Address Details
    address: string ;
    city: string ;
    state: string ;
    pincode: string ;

    // Employment Details
    franchiseId: number ;
    franchiseName: string;
    dateOfJoining: string ; // ISO Date string
    assignedCity: string ;
    employmentType:EmploymentType ;
    remainingDailyLimit?: number | null;

    // Bank Details
    bankAccountNumber: string ;
    accountHolderName: string ;
    ifscCode: string ;
    upiId: string  | null;

    // Emergency Contact
    contactName: string | null;
    contactNumber: string | null;
    relationship: string | null;

    carTypes: ('MANUAL' | 'AUTOMATIC' | 'PREMIUM_CARS' | 'LUXURY_CARS' | 'SPORTY_CARS')[];

    // Daily Status (optional, populated from API)
    dailyStatus?: {
        dailyLimit: {
            driverId: string;
            driverName: string;
            dailyTargetAmount: number;
            remainingDailyLimit: number;
            usedDailyLimit: number;
            cashInHand: number;
        };
        dailyEarnings: {
            driverId: string;
            date: string;
            dailyTargetAmount: number;
            amountRunToday: number;
            tripsCountToday: number;
            incentiveToday: number;
            incentiveType: string | null;
            remainingToAchieve: number;
        };
    };
}




export enum DriverStatus {
  ACTIVE,
  INACTIVE,
  BLOCKED,
  TERMINATED,
}

export enum GenderType {
    MALE,
    FEMALE,
    OTHER,
}
export enum UserRole {
  ADMIN,
  OFFICE_STAFF,
  DRIVER,
}

/**
 * Frontend-facing employment type enum (Prisma format).
 * These values are mapped to API-facing strings when calling the backend:
 * - FULL_TIME → "full time"
 * - PART_TIME → "part time"
 * - CONTRACT → "contract"
 */
export enum EmploymentType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
}

