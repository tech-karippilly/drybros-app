# Testing Penalty Deduction APIs

This guide shows how to test the penalty deduction APIs using the REST client or cURL.

## Prerequisites

1. Backend server running on `http://localhost:5000`
2. Valid authentication token
3. Default penalties seeded (run `npx tsx scripts/seed-default-penalties.ts`)

---

## Test Scenarios

### 1. Get All Penalties

**Request:**
```bash
GET http://localhost:5000/penalties?isActive=true
Authorization: Bearer YOUR_TOKEN
```

**Expected Response:**
```json
{
  "data": [
    {
      "id": "...",
      "name": "Late report",
      "amount": 100,
      "type": "PENALTY",
      "isActive": true
    },
    {
      "id": "...",
      "name": "Trip cancelled",
      "amount": 200,
      "type": "PENALTY",
      "isActive": true
    }
    // ... more penalties
  ]
}
```

**Expected:** 7 penalties returned (all default deductions)

---

### 2. Create a New Penalty

**Request:**
```bash
POST http://localhost:5000/penalties
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "name": "Uniform not worn",
  "description": "Penalty for not wearing proper uniform",
  "amount": 75
}
```

**Expected Response:**
```json
{
  "message": "Penalty created successfully",
  "data": {
    "id": "new-penalty-uuid",
    "name": "Uniform not worn",
    "description": "Penalty for not wearing proper uniform",
    "amount": 75,
    "type": "PENALTY",
    "isActive": true
  }
}
```

**Status:** 201 Created

---

### 3. Update a Penalty

**Request:**
```bash
PATCH http://localhost:5000/penalties/{penalty-id}
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "amount": 120,
  "description": "Updated penalty amount for late reporting"
}
```

**Expected Response:**
```json
{
  "message": "Penalty updated successfully",
  "data": {
    "id": "penalty-id",
    "name": "Late report",
    "amount": 120,
    "description": "Updated penalty amount for late reporting"
  }
}
```

**Status:** 200 OK

---

### 4. Apply Penalty to Driver

**Steps:**
1. Get list of penalties to find the penalty ID
2. Get list of drivers to find a driver ID
3. Apply penalty to driver

**Request:**
```bash
POST http://localhost:5000/penalties/apply/driver/{driver-id}
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "penaltyId": "{penalty-id-from-step-1}",
  "reason": "Driver reported 45 minutes late on February 6, 2026",
  "violationDate": "2026-02-06T09:45:00Z"
}
```

**Expected Response:**
```json
{
  "message": "Penalty applied successfully",
  "data": {
    "id": "driver-penalty-uuid",
    "driverId": "driver-uuid",
    "penaltyId": "penalty-uuid",
    "amount": 100,
    "reason": "Driver reported 45 minutes late on February 6, 2026",
    "violationDate": "2026-02-06T09:45:00.000Z",
    "appliedAt": "2026-02-06T10:30:00.000Z",
    "isActive": true
  }
}
```

**Status:** 201 Created

---

### 5. Delete (Deactivate) a Penalty

**Request:**
```bash
DELETE http://localhost:5000/penalties/{penalty-id}
Authorization: Bearer YOUR_TOKEN
```

**Expected Response:**
```json
{
  "message": "Penalty deleted successfully"
}
```

**Status:** 200 OK

**Note:** This performs a soft delete (sets `isActive` to false)

---

### 6. Get Penalty by ID

**Request:**
```bash
GET http://localhost:5000/penalties/{penalty-id}
Authorization: Bearer YOUR_TOKEN
```

**Expected Response:**
```json
{
  "data": {
    "id": "penalty-id",
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

**Status:** 200 OK

---

### 7. Apply Penalty to Multiple Drivers

**Request:**
```bash
POST http://localhost:5000/penalties/apply/drivers
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "driverIds": [
    "driver-uuid-1",
    "driver-uuid-2",
    "driver-uuid-3"
  ],
  "penaltyId": "{penalty-id}",
  "reason": "All drivers failed to attend mandatory safety training",
  "violationDate": "2026-02-06T14:00:00Z"
}
```

**Expected Response:**
```json
{
  "message": "Penalty applied to 3 driver(s)",
  "data": [
    {
      "id": "driver-penalty-1",
      "driverId": "driver-uuid-1",
      "amount": 100,
      "reason": "All drivers failed to attend mandatory safety training"
    },
    // ... 2 more entries
  ]
}
```

**Status:** 201 Created

---

## Error Test Cases

### Test: Create Penalty without Auth Token
**Request:**
```bash
POST http://localhost:5000/penalties
Content-Type: application/json

{
  "name": "Test penalty",
  "amount": 100
}
```

**Expected Response:** 401 Unauthorized

---

### Test: Create Penalty with Invalid Amount
**Request:**
```bash
POST http://localhost:5000/penalties
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "name": "Test penalty",
  "amount": -50
}
```

**Expected Response:** 400 Bad Request

---

### Test: Get Non-existent Penalty
**Request:**
```bash
GET http://localhost:5000/penalties/00000000-0000-0000-0000-000000000000
Authorization: Bearer YOUR_TOKEN
```

**Expected Response:** 404 Not Found

---

### Test: Driver Role Trying to Create Penalty
**Request:**
```bash
POST http://localhost:5000/penalties
Authorization: Bearer DRIVER_TOKEN
Content-Type: application/json

{
  "name": "Test penalty",
  "amount": 100
}
```

**Expected Response:** 403 Forbidden

---

## Verification Checklist

- [ ] Can retrieve all penalties (GET /penalties)
- [ ] Can create new penalty (POST /penalties) - Admin/Manager only
- [ ] Can get specific penalty by ID (GET /penalties/:id)
- [ ] Can update penalty (PATCH /penalties/:id) - Admin/Manager only
- [ ] Can delete penalty (DELETE /penalties/:id) - Admin/Manager only
- [ ] Can apply penalty to single driver (POST /penalties/apply/driver/:driverId)
- [ ] Can apply penalty to multiple drivers (POST /penalties/apply/drivers)
- [ ] Unauthorized users get 401 error
- [ ] Non-admin/manager users get 403 error for protected endpoints
- [ ] Invalid IDs return 404 error
- [ ] Default penalties are in database (7 penalties)

---

## Database Verification

Check penalties in database:
```sql
-- View all penalties
SELECT id, name, amount, type, "isActive" 
FROM "Penalty" 
WHERE "isActive" = true;

-- View penalties applied to drivers
SELECT 
  dp.id,
  d."fullName" as driver_name,
  p.name as penalty_name,
  dp.amount,
  dp.reason,
  dp."violationDate"
FROM "DriverPenalty" dp
JOIN "Driver" d ON dp."driverId" = d.id
JOIN "Penalty" p ON dp."penaltyId" = p.id
ORDER BY dp."appliedAt" DESC
LIMIT 10;
```

---

## Quick Test Script (Bash)

```bash
#!/bin/bash

# Set your auth token
TOKEN="your-auth-token-here"
BASE_URL="http://localhost:5000"

echo "Testing Penalty APIs..."

# Test 1: Get all penalties
echo "1. Getting all penalties..."
curl -s -X GET "$BASE_URL/penalties?isActive=true" \
  -H "Authorization: Bearer $TOKEN" | jq

# Test 2: Create a penalty
echo "2. Creating a new penalty..."
PENALTY_ID=$(curl -s -X POST "$BASE_URL/penalties" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Penalty","amount":100,"description":"Test"}' | jq -r '.data.id')
echo "Created penalty ID: $PENALTY_ID"

# Test 3: Get penalty by ID
echo "3. Getting penalty by ID..."
curl -s -X GET "$BASE_URL/penalties/$PENALTY_ID" \
  -H "Authorization: Bearer $TOKEN" | jq

# Test 4: Update penalty
echo "4. Updating penalty..."
curl -s -X PATCH "$BASE_URL/penalties/$PENALTY_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":150}' | jq

# Test 5: Delete penalty
echo "5. Deleting penalty..."
curl -s -X DELETE "$BASE_URL/penalties/$PENALTY_ID" \
  -H "Authorization: Bearer $TOKEN" | jq

echo "All tests completed!"
```
