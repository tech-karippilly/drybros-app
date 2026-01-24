# Trip Creation Data Requirements

This document outlines all the data needed for creating a trip in the backend API.

## Two Trip Creation Endpoints

### 1. `POST /trips` - Create Trip (Legacy)
Creates a trip with a driver already assigned. Status: `ASSIGNED`

### 2. `POST /trips/phase1` - Create Trip Phase 1 (Recommended)
Creates a trip in `PENDING` status without a driver. Driver can be assigned later.

---

## Endpoint 1: `POST /trips` (Legacy - Direct Trip Creation)

### Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `franchiseId` | number | Franchise ID | `1` |
| `driverId` | number | Driver ID (must be active and in same franchise) | `1` |
| `customerId` | number | Customer ID (must exist) | `1` |
| `tripType` | string | Trip type enum | `"CITY_ROUND"` |
| `pickupLocation` | string | Pickup location (coordinates or place ID) | `"123 Main St"` |
| `baseAmount` | number | Base trip amount in rupees | `500` |

### Optional Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `dropLocation` | string \| null | Drop location | `"456 Oak Ave"` |
| `scheduledAt` | string \| null | ISO date string for scheduled time | `"2024-01-20T14:30:00Z"` |
| `extraAmount` | number | Extra charges | `100` |

### Notes
- Customer must exist before creating trip
- Driver must be active and belong to same franchise
- Trip is created with `ASSIGNED` status
- `totalAmount` and `finalAmount` are calculated automatically

---

## Endpoint 2: `POST /trips/phase1` (Recommended - Phase 1 Creation)

### Required Fields

#### Customer Information
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `customerName` | string | Full name of customer | `"John Doe"` |
| `customerPhone` | string | Customer phone number (used to find/create customer) | `"+1234567890"` |

#### Pickup Location
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `pickupLocation` | string | Google Place ID or coordinates | `"ChIJN1t_tDeuEmsRUsoyG83frY4"` |
| `pickupAddress` | string | Full formatted address | `"123 Main Street, New York, NY 10001"` |

#### Destination Location
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `destinationLocation` | string | Google Place ID or coordinates | `"ChIJN1t_tDeuEmsRUsoyG83frY5"` |
| `destinationAddress` | string | Full formatted address | `"456 Oak Avenue, New York, NY 10002"` |

#### Trip Configuration
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `franchiseId` | string (UUID) | Franchise ID | `"550e8400-e29b-41d4-a716-446655440000"` |
| `tripType` | string | Trip type enum | `"CITY_ROUND"` |
| | | Valid values: | `CITY_ROUND`, `CITY_DROPOFF`, `LONG_ROUND`, `LONG_DROPOFF` |

#### Car Preferences
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `carGearType` | string | Car gear type | `"MANUAL"` |
| | | Valid values: | `MANUAL`, `AUTOMATIC` |
| `carType` | string | Car category | `"PREMIUM"` |
| | | Valid values: | `PREMIUM`, `LUXURY`, `NORMAL` |

#### Schedule
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `tripDate` | string | Trip date in YYYY-MM-DD or DD/MM/YYYY format | `"2024-01-20"` or `"20/01/2024"` |
| `tripTime` | string | Trip time in HH:mm (24-hour) or 12-hour format | `"14:30"` or `"02:30 PM"` |

#### Confirmation Flags
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `isDetailsReconfirmed` | boolean | Details reconfirmed with customer | `true` |
| `isFareDiscussed` | boolean | Base fare discussed with customer | `true` |
| `isPriceAccepted` | boolean | Customer accepted the price | `true` |

### Optional Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `customerEmail` | string \| null | Customer email address | `"john.doe@example.com"` |
| `pickupLocationNote` | string \| null | Additional notes for pickup (max 500 chars) | `"Near the blue building"` |
| `destinationNote` | string \| null | Additional notes for destination (max 500 chars) | `"Building entrance, ring doorbell"` |
| `distance` | number \| null | Distance in kilometers (for price calculation) | `15.5` |
| `distanceScope` | string \| null | Distance scope identifier | `"LOCAL"` |
| `createdBy` | string (UUID) \| null | User ID who created the trip (from auth token) | `"660e8400-e29b-41d4-a716-446655440001"` |

### Notes
- Customer is automatically created/found based on phone number
- Trip is created with `PENDING` status (no driver assigned)
- Driver can be assigned later using `POST /trips/{id}/assign-driver`
- Pricing is calculated automatically if `distance` is provided
- If pricing calculation fails, trip is still created with `baseAmount: 0`
- `carType` is stored as JSON: `{"gearType": "MANUAL", "category": "PREMIUM"}`

---

## Trip Type Enum Values

| Value | Description |
|-------|-------------|
| `CITY_ROUND` | City round trip |
| `CITY_DROPOFF` | City dropoff (one-way) |
| `LONG_ROUND` | Long distance round trip |
| `LONG_DROPOFF` | Long distance dropoff (one-way) |

---

## Car Gear Type Enum Values

| Value | Description |
|-------|-------------|
| `MANUAL` | Manual transmission |
| `AUTOMATIC` | Automatic transmission |

---

## Car Type Category Enum Values

| Value | Description |
|-------|-------------|
| `NORMAL` | Normal/standard car |
| `PREMIUM` | Premium car |
| `LUXURY` | Luxury car |

---

## Example Request Body (Phase 1)

```json
{
  "customerName": "John Doe",
  "customerPhone": "+1234567890",
  "customerEmail": "john.doe@example.com",
  "pickupLocation": "ChIJN1t_tDeuEmsRUsoyG83frY4",
  "pickupAddress": "123 Main Street, New York, NY 10001",
  "pickupLocationNote": "Near the blue building, entrance on the right",
  "destinationLocation": "ChIJN1t_tDeuEmsRUsoyG83frY5",
  "destinationAddress": "456 Oak Avenue, New York, NY 10002",
  "destinationNote": "Building entrance, ring doorbell",
  "franchiseId": "550e8400-e29b-41d4-a716-446655440000",
  "tripType": "CITY_ROUND",
  "carGearType": "MANUAL",
  "carType": "PREMIUM",
  "tripDate": "2024-01-20",
  "tripTime": "14:30",
  "distance": 15.5,
  "isDetailsReconfirmed": true,
  "isFareDiscussed": true,
  "isPriceAccepted": true
}
```

---

## Response Structure (Phase 1)

```json
{
  "data": {
    "trip": {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "franchiseId": "550e8400-e29b-41d4-a716-446655440000",
      "customerId": 1,
      "customerName": "John Doe",
      "customerPhone": "+1234567890",
      "customerEmail": "john.doe@example.com",
      "tripType": "CITY_ROUND",
      "status": "PENDING",
      "pickupLocation": "ChIJN1t_tDeuEmsRUsoyG83frY4",
      "pickupAddress": "123 Main Street, New York, NY 10001",
      "dropLocation": "ChIJN1t_tDeuEmsRUsoyG83frY5",
      "dropAddress": "456 Oak Avenue, New York, NY 10002",
      "carType": "{\"gearType\":\"MANUAL\",\"category\":\"PREMIUM\"}",
      "scheduledAt": "2024-01-20T14:30:00Z",
      "baseAmount": 500,
      "extraAmount": 0,
      "totalAmount": 500,
      "finalAmount": 500,
      "paymentStatus": "PENDING"
    },
    "customer": {
      "id": 1,
      "name": "John Doe",
      "phone": "+1234567890",
      "email": "john.doe@example.com",
      "isExisting": false
    },
    "pricing": {
      "calculated": true,
      "breakdown": { ... },
      "configUsed": { ... }
    }
  }
}
```

---

## Validation Rules

1. **Customer Name**: Required, min length 1, max length 100
2. **Customer Phone**: Required, must match phone pattern
3. **Pickup Location**: Required, cannot be empty or whitespace
4. **Pickup Address**: Required, min length 1, max length 500
5. **Destination Location**: Required, cannot be empty or whitespace
6. **Destination Address**: Required, min length 1, max length 500
7. **Franchise ID**: Required, must be valid UUID
8. **Trip Type**: Required, must be one of: `CITY_ROUND`, `CITY_DROPOFF`, `LONG_ROUND`, `LONG_DROPOFF`
9. **Car Gear Type**: Required, must be `MANUAL` or `AUTOMATIC`
10. **Car Type**: Required, must be `PREMIUM`, `LUXURY`, or `NORMAL`
11. **Trip Date**: Required, must be valid date format
12. **Trip Time**: Required, must be valid time format (HH:mm or 12-hour with AM/PM)
13. **Confirmation Flags**: All three flags (`isDetailsReconfirmed`, `isFareDiscussed`, `isPriceAccepted`) must be `true`

---

## Auto-Generated Fields

The following fields are automatically generated and should NOT be sent in the request:

- `id` - Trip UUID (auto-generated)
- `status` - Set to `PENDING` for Phase 1, `ASSIGNED` for direct creation
- `createdAt` - Timestamp (auto-generated)
- `updatedAt` - Timestamp (auto-updated)
- `tripPlacedDate` - Timestamp (auto-generated)
- `paymentStatus` - Set to `PENDING` by default
- `baseAmount`, `extraAmount`, `totalAmount`, `finalAmount` - Calculated if distance provided, otherwise 0

---

## Related Endpoints

After creating a trip in Phase 1, you can:

1. **Assign Driver**: `POST /trips/{id}/assign-driver`
   - Body: `{ "driverId": "uuid" }`

2. **Get Available Drivers**: `GET /trips/{id}/available-drivers`
   - Returns list of available drivers for the trip

3. **Driver Accept**: `PATCH /trips/{id}/driver-accept`
   - Body: `{ "driverId": "uuid" }`

4. **Start Trip**: `PATCH /trips/{id}/start`
   - Requires OTP generation first

5. **End Trip**: `PATCH /trips/{id}/end`
   - Requires OTP generation first
