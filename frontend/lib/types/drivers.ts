import { Franchise } from "./franchise";

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
    userId :number; // foreign key to users table
    firstName: string;
    lastName: string;
    email: string;
    driverPhone: string;
    driverAltPhone :string | null;

    // personal details
    dateOfBirth: string; // ISO Date string
    gender: GenderType;
    profilePhoto: string | null;
    licenseNumber: string;
    licenseType: string;
    licenseExpiryDate: string; // ISO Date string
    documentsCollected :string[];

    // Address Details
    address: string;
    city: string;
    state: string;
    pincode: string;

    // Employment Details
    franchiseId: number;
    dateOfJoining: string; // ISO Date string
    assignedCity: string;
    employmentType:EmploymentType;

    // Bank Details
    bankAccountNumber: string;
    accountHolderName: string;
    ifscCode: string;
    upiId: string | null;

    // Emergency Contact
    contactName: string;
    contactNumber: string;
    relationship: string;
}

// keeping the return values to null for the elements
// that is not updated
export interface UpdateDriverInput{
    _id: number;
    userId :number; // foreign key to users table
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
    franchiseId: number | null;
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
}


// no null values for necessary fields 
export interface GetDriver{
    _id: number;
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

    // Bank Details
    bankAccountNumber: string ;
    accountHolderName: string ;
    ifscCode: string ;
    upiId: string  | null;

    // Emergency Contact
    contactName: string | null;
    contactNumber: string | null;
    relationship: string | null;
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

export enum EmploymentType {
  FULL_TIME,
  PART_TIME,
  CONTRACT,
}

