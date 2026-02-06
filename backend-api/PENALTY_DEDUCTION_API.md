# Penalty Deduction API Documentation

Complete API reference for managing driver penalty deductions.

## Base URL
```
http://localhost:5000/penalties
```

## Authentication
All endpoints require Bearer token authentication.

```
Authorization: Bearer <your-token>
```

---

## Penalty Deduction Management

### 1. Create Penalty Deduction

Create a new penalty/deduction type.

**Endpoint:** `POST /penalties`

**Permissions:** Admin, Manager

**Request Body:**
```json
{
  "name": "Late report",
  "description": "Penalty for reporting late to work",
  "amount": 100,
  "type": "PENALTY",
  "isActive": true
}
```

**Fields:**
- `name` (string, required): Name of the penalty
- `description` (string, optional): Description of the penalty
- `amount` (integer, required): Penalty amount in Rupees
- `type` (string, optional): Either "PENALTY" or "DEDUCTION" (default: "PENALTY")
- `isActive` (boolean, optional): Whether penalty is active (default: true)

**Response (201):**
```json
{
  "message": "Penalty created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Late report",
    "description": "Penalty for reporting late to work",
    "amount": 100,
    "type": "PENALTY",
    "isActive": true,
    "createdAt": "2026-02-06T10:00:00.000Z",
    "updatedAt": "2026-02-06T10:00:00.000Z"
  }
}
```

**Example (cURL):**
```bash
curl -X POST http://localhost:5000/penalties \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Late report",
    "description": "Penalty for reporting late to work",
    "amount": 100
  }'
```

---

### 2. Get All Penalty Deductions

Retrieve all penalty types with optional filtering.

**Endpoint:** `GET /penalties`

**Permissions:** All authenticated users

**Query Parameters:**
- `isActive` (boolean, optional): Filter by active status
- `type` (string, optional): Filter by type (PENALTY or DEDUCTION)
- `page` (integer, optional): Page number for pagination
- `limit` (integer, optional): Items per page (default: 10)

**Response (200):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Late report",
      "description": "Penalty for reporting late to work",
      "amount": 100,
      "type": "PENALTY",
      "isActive": true,
      "createdAt": "2026-02-06T10:00:00.000Z",
      "updatedAt": "2026-02-06T10:00:00.000Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Trip cancelled",
      "description": "Penalty for cancelling an assigned trip",
      "amount": 200,
      "type": "PENALTY",
      "isActive": true,
      "createdAt": "2026-02-06T10:00:00.000Z",
      "updatedAt": "2026-02-06T10:00:00.000Z"
    }
  ]
}
```

**With Pagination:**
```json
{
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalItems": 25,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

**Example (cURL):**
```bash
# Get all active penalties
curl -X GET "http://localhost:5000/penalties?isActive=true&type=PENALTY" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get with pagination
curl -X GET "http://localhost:5000/penalties?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 3. Get Penalty by ID

Get a specific penalty by its ID.

**Endpoint:** `GET /penalties/:id`

**Permissions:** All authenticated users

**Path Parameters:**
- `id` (string, required): Penalty UUID

**Response (200):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Late report",
    "description": "Penalty for reporting late to work",
    "amount": 100,
    "type": "PENALTY",
    "isActive": true,
    "createdAt": "2026-02-06T10:00:00.000Z",
    "updatedAt": "2026-02-06T10:00:00.000Z"
  }
}
```

**Example (cURL):**
```bash
curl -X GET http://localhost:5000/penalties/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 4. Update Penalty Deduction

Update an existing penalty's details.

**Endpoint:** `PATCH /penalties/:id`

**Permissions:** Admin, Manager

**Path Parameters:**
- `id` (string, required): Penalty UUID

**Request Body (all fields optional):**
```json
{
  "name": "Late report (updated)",
  "description": "Updated description",
  "amount": 150,
  "isActive": false
}
```

**Response (200):**
```json
{
  "message": "Penalty updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Late report (updated)",
    "description": "Updated description",
    "amount": 150,
    "type": "PENALTY",
    "isActive": false,
    "createdAt": "2026-02-06T10:00:00.000Z",
    "updatedAt": "2026-02-06T11:00:00.000Z"
  }
}
```

**Example (cURL):**
```bash
curl -X PATCH http://localhost:5000/penalties/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 150,
    "description": "Updated description"
  }'
```

---

### 5. Delete Penalty Deduction

Soft delete a penalty (sets isActive to false).

**Endpoint:** `DELETE /penalties/:id`

**Permissions:** Admin, Manager

**Path Parameters:**
- `id` (string, required): Penalty UUID

**Response (200):**
```json
{
  "message": "Penalty deleted successfully"
}
```

**Example (cURL):**
```bash
curl -X DELETE http://localhost:5000/penalties/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Applying Penalties to Drivers

### 6. Apply Penalty to a Driver

Apply a penalty deduction to a specific driver.

**Endpoint:** `POST /penalties/apply/driver/:driverId`

**Permissions:** Admin, Manager

**Path Parameters:**
- `driverId` (string, required): Driver UUID

**Request Body:**
```json
{
  "penaltyId": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 100,
  "reason": "Driver reported 30 minutes late on 2026-02-06",
  "violationDate": "2026-02-06T09:30:00Z"
}
```

**Fields:**
- `penaltyId` (string, required): UUID of the penalty type
- `amount` (integer, optional): Override default penalty amount
- `reason` (string, optional): Specific reason for applying penalty
- `violationDate` (datetime, optional): When violation occurred (default: now)

**Response (201):**
```json
{
  "message": "Penalty applied successfully",
  "data": {
    "id": "driver-penalty-uuid",
    "driverId": "driver-uuid",
    "penaltyId": "penalty-uuid",
    "amount": 100,
    "reason": "Driver reported 30 minutes late on 2026-02-06",
    "violationDate": "2026-02-06T09:30:00.000Z",
    "appliedAt": "2026-02-06T10:00:00.000Z",
    "appliedBy": "admin-user-uuid",
    "isActive": true
  }
}
```

**Example (cURL):**
```bash
curl -X POST http://localhost:5000/penalties/apply/driver/DRIVER_UUID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "penaltyId": "PENALTY_UUID",
    "amount": 100,
    "reason": "Reported late",
    "violationDate": "2026-02-06T09:30:00Z"
  }'
```

---

### 7. Apply Penalty to Multiple Drivers

Apply the same penalty to multiple drivers at once.

**Endpoint:** `POST /penalties/apply/drivers`

**Permissions:** Admin, Manager

**Request Body:**
```json
{
  "driverIds": [
    "driver-uuid-1",
    "driver-uuid-2",
    "driver-uuid-3"
  ],
  "penaltyId": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 100,
  "reason": "Did not attend mandatory meeting",
  "violationDate": "2026-02-06T09:00:00Z"
}
```

**Response (201):**
```json
{
  "message": "Penalty applied to 3 driver(s)",
  "data": [
    {
      "id": "driver-penalty-uuid-1",
      "driverId": "driver-uuid-1",
      "penaltyId": "penalty-uuid",
      "amount": 100,
      "reason": "Did not attend mandatory meeting",
      "violationDate": "2026-02-06T09:00:00.000Z",
      "appliedAt": "2026-02-06T10:00:00.000Z"
    },
    // ... more entries
  ]
}
```

---

## Database Schema

### Penalty Table
```prisma
model Penalty {
  id              String          @id @default(uuid())
  name            String          // e.g., "Late report"
  description     String?         // Description of penalty
  driverId        String?         // Optional: for driver-specific penalties
  amount          Int             // Default penalty amount in Rupees
  type            PenaltyType     // PENALTY or DEDUCTION
  isActive        Boolean         @default(true)
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
}
```

### DriverPenalty Table
```prisma
model DriverPenalty {
  id            String   @id @default(uuid())
  driverId      String   // Driver who received penalty
  penaltyId     String   // Reference to Penalty table
  amount        Int      // Actual amount applied
  reason        String?  // Specific reason for penalty
  violationDate DateTime // Date of violation
  appliedAt     DateTime // When penalty was applied
  appliedBy     String?  // User ID who applied penalty
  isActive      Boolean  @default(true)
}
```

---

## Standard Penalty Deductions

| Detection ID | Name | Amount |
|--------------|------|--------|
| 1 | Late report | ₹100 |
| 2 | Trip cancelled | ₹200 |
| 3 | Phone not answered | ₹50 |
| 4 | Money not submitted before 10 PM | ₹50 |
| 5 | Uninformed leave | ₹720 |
| 6 | Not reporting office | ₹50 |
| 7 | Customer complaint | ₹250 |

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid amount",
  "message": "Amount must be greater than 0"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "You don't have permission to perform this action"
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Penalty not found"
}
```

---

## Quick Start Guide

### 1. Seed Default Penalties
```bash
cd backend-api
npx tsx scripts/seed-default-penalties.ts
```

### 2. Get All Penalty Types
```bash
curl -X GET "http://localhost:5000/penalties?isActive=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Apply Penalty to Driver
```bash
curl -X POST http://localhost:5000/penalties/apply/driver/DRIVER_UUID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "penaltyId": "PENALTY_UUID",
    "reason": "Late to work"
  }'
```
