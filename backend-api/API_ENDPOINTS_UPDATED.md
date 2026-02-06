# Trip Type Config API - Updated Endpoints

## 📋 **Overview**
All trip type endpoints now support car-specific pricing with two pricing modes:
- **TIME_BASED**: Base price per car type + time-based extras
- **DISTANCE_BASED**: Distance slabs per car type

**All 5 car types must be provided:** MANUAL, AUTOMATIC, PREMIUM_CARS, LUXURY_CARS, SPORTY_CARS

---

## 🔗 **Endpoints**

### 1. **GET /api/trip-types** - List All Trip Types
**Description:** Get all active trip types with optional pagination and car type filter

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `carType` (optional): Filter by car type - returns only pricing for specified car type
  - Values: `MANUAL`, `AUTOMATIC`, `PREMIUM_CARS`, `LUXURY_CARS`, `SPORTY_CARS`

**Examples:**

```bash
# Get all trip types
curl -X GET http://localhost:4000/api/trip-types \
  -H "Authorization: Bearer <token>"

# Get with pagination
curl -X GET "http://localhost:4000/api/trip-types?page=1&limit=10" \
  -H "Authorization: Bearer <token>"

# Get only MANUAL car pricing
curl -X GET "http://localhost:4000/api/trip-types?carType=MANUAL" \
  -H "Authorization: Bearer <token>"

# Get PREMIUM_CARS pricing with pagination
curl -X GET "http://localhost:4000/api/trip-types?page=1&limit=10&carType=PREMIUM_CARS" \
  -H "Authorization: Bearer <token>"
```

**Response (without carType filter):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "City Round Trip",
      "pricingMode": "TIME_BASED",
      "baseHour": 3,
      "extraPerHour": 100,
      "extraPerHalfHour": 50,
      "baseDistance": null,
      "status": "ACTIVE",
      "carTypePricing": [
        {
          "id": "pricing-id-1",
          "carType": "MANUAL",
          "basePrice": 400,
          "distanceSlabs": null
        },
        {
          "id": "pricing-id-2",
          "carType": "AUTOMATIC",
          "basePrice": 450,
          "distanceSlabs": null
        },
        {
          "id": "pricing-id-3",
          "carType": "PREMIUM_CARS",
          "basePrice": 600,
          "distanceSlabs": null
        },
        {
          "id": "pricing-id-4",
          "carType": "LUXURY_CARS",
          "basePrice": 800,
          "distanceSlabs": null
        },
        {
          "id": "pricing-id-5",
          "carType": "SPORTY_CARS",
          "basePrice": 1000,
          "distanceSlabs": null
        }
      ]
    }
  ]
}
```

**Response (with carType=MANUAL filter):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "City Round Trip",
      "pricingMode": "TIME_BASED",
      "baseHour": 3,
      "extraPerHour": 100,
      "extraPerHalfHour": 50,
      "carTypePricing": [
        {
          "id": "pricing-id-1",
          "carType": "MANUAL",
          "basePrice": 400,
          "distanceSlabs": null
        }
      ]
    }
  ]
}
```

---

### 2. **GET /api/trip-types/:id** - Get Trip Type By ID
**Description:** Get a specific trip type by ID with optional car type filter

**Query Parameters:**
- `carType` (optional): Filter to show only specific car type pricing

**Examples:**

```bash
# Get trip type with all car pricing
curl -X GET http://localhost:4000/api/trip-types/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <token>"

# Get trip type with only PREMIUM_CARS pricing
curl -X GET "http://localhost:4000/api/trip-types/550e8400-e29b-41d4-a716-446655440000?carType=PREMIUM_CARS" \
  -H "Authorization: Bearer <token>"
```

---

### 3. **POST /api/trip-types** - Create Trip Type
**Description:** Create a new trip type configuration

**Required Fields:**
- `name`: Trip type name
- `pricingMode`: "TIME_BASED" or "DISTANCE_BASED"
- `carTypePricing`: Array with all 5 car types

**Example 1: TIME_BASED Pricing**

```bash
curl -X POST http://localhost:4000/api/trip-types \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "City Round Trip",
    "pricingMode": "TIME_BASED",
    "baseHour": 3,
    "extraPerHour": 100,
    "extraPerHalfHour": 50,
    "description": "City round trip with time-based pricing",
    "carTypePricing": [
      {
        "carType": "MANUAL",
        "basePrice": 400
      },
      {
        "carType": "AUTOMATIC",
        "basePrice": 450
      },
      {
        "carType": "PREMIUM_CARS",
        "basePrice": 600
      },
      {
        "carType": "LUXURY_CARS",
        "basePrice": 800
      },
      {
        "carType": "SPORTY_CARS",
        "basePrice": 1000
      }
    ]
  }'
```

**Example 2: DISTANCE_BASED Pricing**

```bash
curl -X POST http://localhost:4000/api/trip-types \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Long Round",
    "pricingMode": "DISTANCE_BASED",
    "baseHour": 8,
    "baseDistance": 200,
    "extraPerHour": 150,
    "extraPerHalfHour": 75,
    "description": "Long round trip with distance-based pricing",
    "carTypePricing": [
      {
        "carType": "MANUAL",
        "basePrice": 3000,
        "distanceSlabs": [
          {"from": 0, "to": 100, "price": 3000},
          {"from": 101, "to": 200, "price": 4500},
          {"from": 201, "to": null, "price": 6000}
        ]
      },
      {
        "carType": "AUTOMATIC",
        "basePrice": 3300,
        "distanceSlabs": [
          {"from": 0, "to": 100, "price": 3300},
          {"from": 101, "to": 200, "price": 5000},
          {"from": 201, "to": null, "price": 6500}
        ]
      },
      {
        "carType": "PREMIUM_CARS",
        "basePrice": 4500,
        "distanceSlabs": [
          {"from": 0, "to": 100, "price": 4500},
          {"from": 101, "to": 200, "price": 6500},
          {"from": 201, "to": null, "price": 8500}
        ]
      },
      {
        "carType": "LUXURY_CARS",
        "basePrice": 6000,
        "distanceSlabs": [
          {"from": 0, "to": 100, "price": 6000},
          {"from": 101, "to": 200, "price": 8500},
          {"from": 201, "to": null, "price": 11000}
        ]
      },
      {
        "carType": "SPORTY_CARS",
        "basePrice": 8000,
        "distanceSlabs": [
          {"from": 0, "to": 100, "price": 8000},
          {"from": 101, "to": 200, "price": 11000},
          {"from": 201, "to": null, "price": 14000}
        ]
      }
    ]
  }'
```

**Success Response (201):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "City Round Trip",
    "pricingMode": "TIME_BASED",
    "baseHour": 3,
    "extraPerHour": 100,
    "extraPerHalfHour": 50,
    "baseDistance": null,
    "status": "ACTIVE",
    "carTypePricing": [
      {
        "id": "pricing-id-1",
        "carType": "MANUAL",
        "basePrice": 400,
        "distanceSlabs": null
      }
      // ... other car types
    ],
    "createdAt": "2026-02-06T10:00:00.000Z",
    "updatedAt": "2026-02-06T10:00:00.000Z"
  }
}
```

**Error Response (400):**
```json
{
  "error": "Missing pricing for car types: LUXURY_CARS, SPORTY_CARS. All car types must have pricing configured."
}
```

---

### 4. **PUT /api/trip-types/:id** - Update Trip Type
**Description:** Update an existing trip type (all fields optional)

**Example 1: Update Common Fields**

```bash
curl -X PUT http://localhost:4000/api/trip-types/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "baseHour": 4,
    "extraPerHour": 120,
    "extraPerHalfHour": 60,
    "description": "Updated description"
  }'
```

**Example 2: Update Specific Car Type Pricing**

```bash
curl -X PUT http://localhost:4000/api/trip-types/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "carTypePricing": [
      {
        "carType": "MANUAL",
        "basePrice": 450
      },
      {
        "carType": "PREMIUM_CARS",
        "basePrice": 700
      }
    ]
  }'
```

**Example 3: Switch from TIME_BASED to DISTANCE_BASED**

```bash
curl -X PUT http://localhost:4000/api/trip-types/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "pricingMode": "DISTANCE_BASED",
    "baseDistance": 150,
    "carTypePricing": [
      {
        "carType": "MANUAL",
        "basePrice": 3000,
        "distanceSlabs": [
          {"from": 0, "to": 100, "price": 3000},
          {"from": 101, "to": null, "price": 4500}
        ]
      },
      {
        "carType": "AUTOMATIC",
        "basePrice": 3300,
        "distanceSlabs": [
          {"from": 0, "to": 100, "price": 3300},
          {"from": 101, "to": null, "price": 5000}
        ]
      },
      {
        "carType": "PREMIUM_CARS",
        "basePrice": 4500,
        "distanceSlabs": [
          {"from": 0, "to": 100, "price": 4500},
          {"from": 101, "to": null, "price": 6500}
        ]
      },
      {
        "carType": "LUXURY_CARS",
        "basePrice": 6000,
        "distanceSlabs": [
          {"from": 0, "to": 100, "price": 6000},
          {"from": 101, "to": null, "price": 8500}
        ]
      },
      {
        "carType": "SPORTY_CARS",
        "basePrice": 8000,
        "distanceSlabs": [
          {"from": 0, "to": 100, "price": 8000},
          {"from": 101, "to": null, "price": 11000}
        ]
      }
    ]
  }'
```

---

### 5. **DELETE /api/trip-types/:id** - Delete Trip Type
**Description:** Soft delete a trip type (sets status to INACTIVE)

```bash
curl -X DELETE http://localhost:4000/api/trip-types/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <token>"
```

**Response (200):**
```json
{
  "message": "Trip type deleted successfully"
}
```

---

## 📊 **Use Cases**

### Use Case 1: Mobile App - Show Trip Types for Selected Car
```bash
# User selects PREMIUM_CARS in mobile app
GET /api/trip-types?carType=PREMIUM_CARS

# Response shows only PREMIUM_CARS pricing
{
  "data": [
    {
      "name": "City Round Trip",
      "pricingMode": "TIME_BASED",
      "baseHour": 3,
      "extraPerHour": 100,
      "carTypePricing": [
        {
          "carType": "PREMIUM_CARS",
          "basePrice": 600
        }
      ]
    },
    {
      "name": "Long Round",
      "pricingMode": "DISTANCE_BASED",
      "carTypePricing": [
        {
          "carType": "PREMIUM_CARS",
          "basePrice": 4500,
          "distanceSlabs": [
            {"from": 0, "to": 100, "price": 4500},
            {"from": 101, "to": 200, "price": 6500}
          ]
        }
      ]
    }
  ]
}
```

### Use Case 2: Admin Panel - Create New Trip Type
```bash
# Admin creates a new City Drop trip type
POST /api/trip-types
{
  "name": "City Drop",
  "pricingMode": "TIME_BASED",
  "baseHour": 1,
  "extraPerHour": 50,
  "extraPerHalfHour": 25,
  "description": "City dropoff service",
  "carTypePricing": [
    {"carType": "MANUAL", "basePrice": 200},
    {"carType": "AUTOMATIC", "basePrice": 250},
    {"carType": "PREMIUM_CARS", "basePrice": 350},
    {"carType": "LUXURY_CARS", "basePrice": 500},
    {"carType": "SPORTY_CARS", "basePrice": 700}
  ]
}
```

### Use Case 3: Admin Panel - Update Only Luxury Car Pricing
```bash
# Admin wants to increase LUXURY_CARS price
PUT /api/trip-types/{id}
{
  "carTypePricing": [
    {
      "carType": "LUXURY_CARS",
      "basePrice": 900
    }
  ]
}
# Other car types remain unchanged
```

---

## ⚠️ **Validation Rules**

1. **All 5 car types required** when creating a trip type
2. **Distance slabs required** for DISTANCE_BASED mode
3. **Distance slabs not allowed** for TIME_BASED mode
4. **Base price must be >= 0** for all car types
5. **Slab 'to' must be >= 'from'** (or null for open-ended)
6. **Trip type name must be unique**
7. **carType query parameter** must be valid enum value

---

## 🎯 **Key Changes**

✅ **Added carType query parameter** to GET endpoints
✅ **Updated request/response structure** with carTypePricing array
✅ **Replaced specialPrice with pricingMode** enum
✅ **All 5 car types required** when creating
✅ **Partial updates supported** for car type pricing
✅ **Swagger documentation updated** with new examples
✅ **Backward compatible** - old fields removed but API structure improved

---

## 📚 **Next Steps**

1. Update frontend/mobile to use carType filter
2. Update trip calculation to pass selected car type
3. Test all endpoints with Postman/curl
4. Update pricing calculation service to use new structure
