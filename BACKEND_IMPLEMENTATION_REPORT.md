# Backend Implementation Report

## Overview
This document provides a comprehensive overview of all implemented backend features, database models, fields, and API endpoints in the Drybros application.

---

## Database Models & Fields

### 1. User Model
**Purpose**: Authentication and user management

**Fields Saved:**
- `id` (UUID, Primary Key)
- `email` (String, Unique)
- `password` (String, Hashed)
- `fullName` (String)
- `role` (UserRole Enum: ADMIN, MANAGER, OFFICE_STAFF, DRIVER, STAFF, CUSTOMER)
- `isActive` (Boolean, Default: true)
- `phone` (String, Optional)
- `failedAttempts` (Int, Default: 0)
- `lockedUntil` (DateTime, Optional)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

**Relations:**
- Has many `Trip` records (createdBy)

---

### 2. Franchise Model
**Purpose**: Franchise/location management

**Fields Saved:**
- `id` (UUID, Primary Key)
- `code` (String, Unique)
- `name` (String)
- `city` (String)
- `region` (String, Optional)
- `address` (String, Optional)
- `phone` (String, Optional)
- `inchargeName` (String, Optional)
- `storeImage` (String, Optional - URL)
- `legalDocumentsCollected` (Boolean, Default: false)
- `status` (FranchiseStatus Enum: ACTIVE, BLOCKED, TEMPORARILY_CLOSED)
- `isActive` (Boolean, Default: true)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

**Relations:**
- Has many `Customer` records
- Has many `Trip` records
- Has many `Driver` records (via franchiseId)

---

### 3. Driver Model
**Purpose**: Driver management and profiles

**Fields Saved:**
- `id` (UUID, Primary Key)
- `franchiseId` (UUID, Foreign Key)
- `firstName` (String)
- `lastName` (String)
- `phone` (String, Unique)
- `email` (String, Unique)
- `altPhone` (String, Optional)
- `driverCode` (String, Unique)
- `password` (String, Hashed)
- `emergencyContactName` (String)
- `emergencyContactPhone` (String)
- `emergencyContactRelation` (String)
- `address` (String)
- `city` (String)
- `state` (String)
- `pincode` (String)
- `licenseNumber` (String)
- `licenseExpDate` (DateTime)
- `bankAccountName` (String)
- `bankAccountNumber` (String)
- `bankIfscCode` (String)
- `aadharCard` (Boolean, Default: false)
- `license` (Boolean, Default: false)
- `educationCert` (Boolean, Default: false)
- `previousExp` (Boolean, Default: false)
- `carTypes` (String - JSON array of CarType enum values)
- `status` (DriverStatus Enum: ACTIVE, INACTIVE, BLOCKED, TERMINATED)
- `driverTripStatus` (DriverTripStatus Enum: AVAILABLE, ON_TRIP)
- `complaintCount` (Int, Default: 0)
- `bannedGlobally` (Boolean, Default: false)
- `dailyTargetAmount` (Int, Optional)
- `currentRating` (Float, Optional)
- `isActive` (Boolean, Default: true)
- `createdBy` (UUID, Optional - User ID)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

**Relations:**
- Belongs to `Franchise` (via franchiseId)
- Has many `Trip` records

---

### 4. Staff Model
**Purpose**: Staff/employee management

**Fields Saved:**
- `id` (UUID, Primary Key)
- `name` (String)
- `phone` (String, Unique)
- `password` (String, Hashed)
- `franchiseId` (UUID, Foreign Key)
- `email` (String, Unique)
- `monthlySalary` (Decimal(10,2))
- `address` (String)
- `emergencyContact` (String)
- `emergencyContactRelation` (String)
- `profilePic` (String, Optional - URL)
- `isActive` (Boolean, Default: true)
- `govtId` (Boolean, Default: false)
- `addressProof` (Boolean, Default: false)
- `certificates` (Boolean, Default: false)
- `previousExperienceCert` (Boolean, Default: false)
- `status` (StaffStatus Enum: ACTIVE, FIRED, SUSPENDED, BLOCKED)
- `suspendedUntil` (DateTime, Optional)
- `joinDate` (DateTime, Default: now())
- `relieveDate` (DateTime, Optional)
- `relieveReason` (RelieveReason Enum: RESIGNATION, TERMINATION, RETIREMENT, CONTRACT_ENDED, PERFORMANCE_ISSUES, MISCONDUCT, OTHER)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

**Relations:**
- Belongs to `Franchise` (via franchiseId)
- Has many `StaffHistory` records

---

### 5. StaffHistory Model
**Purpose**: Audit log for staff changes

**Fields Saved:**
- `id` (UUID, Primary Key)
- `staffId` (UUID, Foreign Key)
- `action` (String)
- `description` (String, Optional)
- `changedBy` (String, Optional)
- `oldValue` (String, Optional)
- `newValue` (String, Optional)
- `createdAt` (DateTime)

**Relations:**
- Belongs to `Staff` (via staffId)

---

### 6. Customer Model
**Purpose**: Customer management

**Fields Saved:**
- `id` (Int, Primary Key, Auto-increment)
- `fullName` (String)
- `phone` (String, Unique)
- `email` (String, Optional)
- `city` (String, Optional)
- `notes` (String, Optional)
- `franchiseId` (UUID, Foreign Key)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

**Relations:**
- Belongs to `Franchise` (via franchiseId)
- Has many `Trip` records

---

### 7. Trip Model
**Purpose**: Trip/booking management

**Fields Saved:**
- `id` (UUID, Primary Key)
- `franchiseId` (UUID, Foreign Key)
- `driverId` (UUID, Optional, Foreign Key)
- `customerId` (Int, Optional, Foreign Key)
- `customerName` (String)
- `customerPhone` (String)
- `customerEmail` (String, Optional)
- `tripType` (TripType Enum: CITY_ROUND, CITY_DROPOFF, LONG_ROUND, LONG_DROPOFF)
- `status` (TripStatus Enum: PENDING, NOT_ASSIGNED, ASSIGNED, TRIP_STARTED, TRIP_PROGRESS, TRIP_ENDED, COMPLETED, PAYMENT_DONE, REQUESTED, DRIVER_ON_THE_WAY, IN_PROGRESS, CANCELLED_BY_CUSTOMER, CANCELLED_BY_OFFICE, REJECTED_BY_DRIVER, DRIVER_ACCEPTED)
- `pickupLocation` (String)
- `pickupAddress` (String, Optional)
- `pickupLocationNote` (String, Optional)
- `dropLocation` (String, Optional)
- `dropAddress` (String, Optional)
- `dropLocationNote` (String, Optional)
- `alternativePhone` (String, Optional)
- `carType` (String, Optional)
- `scheduledAt` (DateTime, Optional)
- `startedAt` (DateTime, Optional)
- `endedAt` (DateTime, Optional)
- `startOtp` (String, Optional)
- `endOtp` (String, Optional)
- `baseAmount` (Int)
- `extraAmount` (Int, Default: 0)
- `totalAmount` (Int)
- `finalAmount` (Int)
- `isAmountOverridden` (Boolean, Default: false)
- `overrideReason` (String, Optional)
- `paymentStatus` (PaymentStatus Enum: PENDING, COMPLETED, PAID, PARTIALLY_PAID)
- `paymentMode` (PaymentMode Enum: UPI, IN_HAND, CASH, CARD, OTHER)
- `paymentReference` (String, Optional)
- `isDetailsReconfirmed` (Boolean, Default: false)
- `isFareDiscussed` (Boolean, Default: false)
- `isPriceAccepted` (Boolean, Default: false)
- `tripPlacedDate` (DateTime, Default: now())
- `createdBy` (UUID, Optional, Foreign Key)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

**Relations:**
- Belongs to `Franchise` (via franchiseId)
- Belongs to `Driver` (via driverId, optional)
- Belongs to `Customer` (via customerId, optional)
- Belongs to `User` (via createdBy, optional)

---

### 8. Role Model
**Purpose**: Role management system

**Fields Saved:**
- `id` (UUID, Primary Key)
- `name` (String, Unique)
- `description` (String, Optional)
- `isActive` (Boolean, Default: true)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

---

### 9. TripTypeConfig Model
**Purpose**: Trip type pricing configuration

**Fields Saved:**
- `id` (UUID, Primary Key)
- `name` (String)
- `description` (String, Optional)
- `distanceScopeId` (UUID, Foreign Key)
- `tripPatternId` (UUID, Foreign Key)
- `basePrice` (Float)
- `basePricePerHour` (Float, Optional)
- `baseDuration` (Float, Optional - hours)
- `baseDistance` (Float, Optional - km)
- `extraPerHour` (Float, Default: 0)
- `extraPerHalfHour` (Float, Optional)
- `extraPerKm` (Float, Optional)
- `premiumCarMultiplier` (Float, Optional)
- `forPremiumCars` (JSON, Optional)
- `distanceSlabs` (JSON, Optional)
- `status` (TripTypeConfigStatus Enum: ACTIVE, INACTIVE)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

**Relations:**
- Belongs to `DistanceScope` (via distanceScopeId)
- Belongs to `TripPattern` (via tripPatternId)

---

### 10. DistanceScope Model
**Purpose**: Distance scope categorization

**Fields Saved:**
- `id` (UUID, Primary Key)
- `name` (String)
- `description` (String, Optional)
- `status` (DistanceScopeStatus Enum: ACTIVE, INACTIVE)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

**Relations:**
- Has many `TripTypeConfig` records

---

### 11. TripPattern Model
**Purpose**: Trip pattern categorization

**Fields Saved:**
- `id` (UUID, Primary Key)
- `name` (String)
- `description` (String, Optional)
- `status` (TripPatternStatus Enum: ACTIVE, INACTIVE)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

**Relations:**
- Has many `TripTypeConfig` records

---

## API Endpoints

### Authentication Routes (`/auth`)

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| POST | `/auth/register-admin` | Register new admin user | No | - |
| POST | `/auth/login` | Login for all users | No | - |
| POST | `/auth/forgot-password` | Request password reset | No | - |
| POST | `/auth/reset-password` | Reset password with token | No | - |
| POST | `/auth/refresh-token` | Refresh access token | No | - |
| POST | `/auth/logout` | Logout user | Yes | - |
| GET | `/auth/me` | Get current authenticated user | Yes | - |

---

### Driver Routes (`/drivers`)

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| POST | `/drivers/login` | Driver login (public) | No | - |
| GET | `/drivers` | Get list of drivers (with pagination) | Yes | - |
| GET | `/drivers/:id` | Get driver by ID | Yes | - |
| GET | `/drivers/:id/with-performance` | Get driver with performance metrics | Yes | - |
| GET | `/drivers/:id/performance` | Get driver performance metrics only | Yes | - |
| POST | `/drivers` | Create new driver | Yes | ADMIN, OFFICE_STAFF |
| PATCH | `/drivers/:id` | Update driver | Yes | ADMIN, OFFICE_STAFF |
| PATCH | `/drivers/:id/status` | Update driver status | Yes | ADMIN, OFFICE_STAFF |
| DELETE | `/drivers/:id` | Soft delete driver | Yes | ADMIN, OFFICE_STAFF |

---

### Franchise Routes (`/franchises`)

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| GET | `/franchises` | Get list of franchises (with pagination) | Yes | - |
| GET | `/franchises/:id` | Get franchise by ID | Yes | - |
| GET | `/franchises/:id/staff` | Get staff by franchise ID | Yes | - |
| GET | `/franchises/:id/drivers` | Get drivers by franchise ID | Yes | - |
| POST | `/franchises` | Create new franchise | Yes | ADMIN |
| PUT | `/franchises/:id` | Update franchise | Yes | ADMIN, MANAGER |
| DELETE | `/franchises/:id` | Soft delete franchise | Yes | ADMIN |
| PATCH | `/franchises/:id/status` | Update franchise status | Yes | ADMIN |

---

### Staff Routes (`/staff`)

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| GET | `/staff` | Get list of staff (with pagination) | Yes | - |
| GET | `/staff/:id` | Get staff by ID | Yes | - |
| GET | `/staff/:id/history` | Get staff history/audit log | Yes | - |
| POST | `/staff` | Create new staff member | Yes | - |
| PATCH | `/staff/:id` | Update staff member | Yes | - |
| PATCH | `/staff/:id/status` | Update staff status | Yes | - |
| DELETE | `/staff/:id` | Delete staff member | Yes | - |

---

### Customer Routes (`/customers`)

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| GET | `/customers` | Get list of customers | Yes | - |
| GET | `/customers/:id` | Get customer by ID | Yes | - |
| POST | `/customers` | Create new customer | Yes | - |

---

### Trip Routes (`/trips`)

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| GET | `/trips` | Get list of all trips | Yes | - |
| GET | `/trips/unassigned` | Get unassigned trips | Yes | - |
| GET | `/trips/:id` | Get trip by ID | Yes | - |
| GET | `/trips/:id/available-drivers` | Get available drivers for trip | Yes | - |
| POST | `/trips` | Create new trip | Yes | - |
| POST | `/trips/phase1` | Create trip phase 1 (initial booking) | Yes | - |
| POST | `/trips/:id/assign-driver` | Assign driver to trip | Yes | - |
| PATCH | `/trips/:id/driver-accept` | Driver accepts trip | Yes | - |
| PATCH | `/trips/:id/driver-reject` | Driver rejects trip | Yes | - |
| POST | `/trips/:id/generate-start-otp` | Generate start OTP | Yes | - |
| PATCH | `/trips/:id/start` | Start trip | Yes | - |
| POST | `/trips/:id/generate-end-otp` | Generate end OTP | Yes | - |
| PATCH | `/trips/:id/end` | End trip | Yes | - |

---

### Trip Type Routes (`/trip-types`)

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| GET | `/trip-types` | List all trip types | Yes | - |
| GET | `/trip-types/:id` | Get trip type by ID | Yes | - |
| POST | `/trip-types` | Create new trip type | Yes | ADMIN, MANAGER |
| PUT | `/trip-types/:id` | Update trip type | Yes | ADMIN, MANAGER |
| DELETE | `/trip-types/:id` | Delete trip type | Yes | ADMIN, MANAGER |

---

### Role Routes (`/roles`)

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| GET | `/roles` | Get list of roles | Yes | - |
| GET | `/roles/:id` | Get role by ID | Yes | - |
| POST | `/roles` | Create new role | Yes | - |
| PUT | `/roles/:id` | Update role | Yes | - |
| DELETE | `/roles/:id` | Delete role | Yes | - |

---

### Health & Version Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/health` | Health check endpoint | No |
| GET | `/version` | Get API version | No |

---

## Enums

### UserRole
- ADMIN
- MANAGER
- OFFICE_STAFF
- DRIVER
- STAFF
- CUSTOMER

### DriverStatus
- ACTIVE
- INACTIVE
- BLOCKED
- TERMINATED

### DriverTripStatus
- AVAILABLE
- ON_TRIP

### StaffStatus
- ACTIVE
- FIRED
- SUSPENDED
- BLOCKED

### FranchiseStatus
- ACTIVE
- BLOCKED
- TEMPORARILY_CLOSED

### TripStatus
- PENDING
- NOT_ASSIGNED
- ASSIGNED
- TRIP_STARTED
- TRIP_PROGRESS
- TRIP_ENDED
- COMPLETED
- PAYMENT_DONE
- REQUESTED
- DRIVER_ON_THE_WAY
- IN_PROGRESS
- CANCELLED_BY_CUSTOMER
- CANCELLED_BY_OFFICE
- REJECTED_BY_DRIVER
- DRIVER_ACCEPTED

### TripType
- CITY_ROUND
- CITY_DROPOFF
- LONG_ROUND
- LONG_DROPOFF

### PaymentStatus
- PENDING
- COMPLETED
- PAID
- PARTIALLY_PAID

### PaymentMode
- UPI
- IN_HAND
- CASH
- CARD
- OTHER

### RelieveReason
- RESIGNATION
- TERMINATION
- RETIREMENT
- CONTRACT_ENDED
- PERFORMANCE_ISSUES
- MISCONDUCT
- OTHER

### CarType
- MANUAL
- AUTOMATIC
- PREMIUM_CARS
- LUXURY_CARS
- SPORTY_CARS

---

## Summary

**Total Models**: 11
**Total Endpoints**: 59
**Database**: PostgreSQL with Prisma ORM
**Authentication**: JWT-based with refresh tokens
**Authorization**: Role-based access control (RBAC)

---

## Notes

- All timestamps (`createdAt`, `updatedAt`) are automatically managed by Prisma
- UUIDs are used for most primary keys (except Customer which uses Int)
- Soft deletes are implemented for Driver and Franchise models
- Password fields are hashed before storage
- Rate limiting and account lockout are implemented for authentication
- All endpoints support pagination where applicable
- CORS is configured for frontend and mobile app access
- Swagger/OpenAPI documentation is available at `/api-docs`
