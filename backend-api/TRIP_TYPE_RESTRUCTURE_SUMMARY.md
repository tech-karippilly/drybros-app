# Trip Type Config Restructure - Implementation Summary

## ✅ **COMPLETED CHANGES**

### 1. **Database Schema (Prisma)**
- ✅ Created `PricingMode` enum (`TIME_BASED`, `DISTANCE_BASED`)
- ✅ Updated `TripTypeConfig` table structure:
  - Removed: `specialPrice`, `basePrice`, `baseDuration`, `basePricePerHour`, `extraPerKm`, `premiumCarMultiplier`, `forPremiumCars`, `distanceSlabs`
  - Added: `pricingMode` (enum), `baseHour` (nullable)
  - Kept: `extraPerHour`, `extraPerHalfHour`, `baseDistance`
- ✅ Created new `CarTypePricing` table:
  - Fields: `id`, `tripTypeConfigId`, `carType`, `basePrice`, `distanceSlabs` (JSON), timestamps
  - Unique constraint: `[tripTypeConfigId, carType]`
  - Cascade delete when parent TripTypeConfig is deleted
- ✅ Generated and applied migration (deleted old data)

### 2. **Repository Layer (`pricing.repository.ts`)**
- ✅ Updated all functions to include `carTypePricing` relations
- ✅ Added new functions:
  - `upsertCarTypePricing()` - Create or update car type pricing
  - `deleteCarTypePricing()` - Delete car type pricing
  - `getCarTypePricing()` - Get specific car type pricing
- ✅ Updated `createTripTypeConfig()` to handle nested car type pricing creation
- ✅ Updated all queries to include `carTypePricing` in the response

### 3. **Service Layer (`tripType.service.ts`)**
- ✅ Completely rewritten with new structure
- ✅ New interfaces:
  - `CarTypePricingInput` - Input for car type pricing
  - `CreateTripTypeInput` - Updated with `pricingMode` and `carTypePricing[]`
  - `UpdateTripTypeInput` - Updated for partial updates
- ✅ Validation logic:
  - **Requires pricing for ALL car types** (MANUAL, AUTOMATIC, PREMIUM_CARS, LUXURY_CARS, SPORTY_CARS)
  - Validates distance slabs only for `DISTANCE_BASED` mode
  - Validates all required fields per pricing mode
- ✅ Create/Update/Delete operations working with new structure

---

## 🔨 **REMAINING WORK**

### 4. **Pricing Calculation Service (`pricing.service.ts`)** ⚠️
**Status:** NOT STARTED - This is critical!

**What needs to be done:**
- Update `calculateTripPrice()` function to:
  - Accept `carType` (CarType enum from Prisma) instead of `CarTypeCategory`
  - Fetch car-specific pricing from `carTypePricing` relation
  - Handle `TIME_BASED` vs `DISTANCE_BASED` modes
  - Calculate price based on car type's base price and distance slabs
- Update `PriceCalculationResult` interface
- Remove old pricing logic that used `specialPrice`, `baseDuration`, etc.

**Example flow:**
```typescript
// Get trip type config with car type pricing
const config = await getTripTypeConfigForPricing(tripType);
const carPricing = config.carTypePricing.find(p => p.carType === carType);

if (config.pricingMode === 'TIME_BASED') {
  // Use carPricing.basePrice + config.extraPerHour * extra hours
} else {
  // Use carPricing.distanceSlabs to find price for distance range
}
```

### 5. **Controller (`tripType.controller.ts`)**
**Status:** Should be mostly working but check errors

**What might need updates:**
- No changes needed if service layer handles everything
- Just verify controller passes data correctly

### 6. **API Documentation (`openapi.yaml`)**
**Status:** NOT STARTED

**What needs to be done:**
- Update `TripTypeConfig` schema to show new structure:
  - Replace `specialPrice` with `pricingMode` enum
  - Remove old fields (basePrice, baseHour at root level)
  - Add `carTypePricing` array
- Update `CreateTripTypeRequest` schema:
  - Show `pricingMode` field
  - Show `carTypePricing` array with all 5 car types required
  - Show examples for both TIME_BASED and DISTANCE_BASED modes
- Update `UpdateTripTypeRequest` schema
- Update response examples

**Example new structure:**
```yaml
TripTypeConfig:
  properties:
    id: uuid
    name: string
    pricingMode: enum (TIME_BASED, DISTANCE_BASED)
    baseHour: number (optional)
    extraPerHour: number (optional)
    extraPerHalfHour: number (optional)
    baseDistance: number (optional, for DISTANCE_BASED)
    carTypePricing:
      type: array
      items:
        properties:
          carType: enum (MANUAL, AUTOMATIC, PREMIUM_CARS, LUXURY_CARS, SPORTY_CARS)
          basePrice: number
          distanceSlabs: array (for DISTANCE_BASED mode)
```

### 7. **Frontend/Mobile Updates**
**Status:** NOT STARTED

**What needs to be done:**
- Update API call interfaces/types
- Update UI to show/edit pricing per car type
- Update trip type creation/edit forms
- Update trip calculation to pass carType

---

## 📊 **NEW DATA STRUCTURE EXAMPLES**

### Example 1: TIME_BASED Pricing (City Round Trip)
```json
{
  "name": "City Round Trip",
  "pricingMode": "TIME_BASED",
  "baseHour": 3,
  "extraPerHour": 100,
  "extraPerHalfHour": 50,
  "carTypePricing": [
    { "carType": "MANUAL", "basePrice": 400 },
    { "carType": "AUTOMATIC", "basePrice": 450 },
    { "carType": "PREMIUM_CARS", "basePrice": 600 },
    { "carType": "LUXURY_CARS", "basePrice": 800 },
    { "carType": "SPORTY_CARS", "basePrice": 1000 }
  ]
}
```

**Calculation:**
- MANUAL car for 4 hours: ₹400 (base) + ₹100 (1 extra hour) = ₹500
- PREMIUM_CARS for 4 hours: ₹600 (base) + ₹100 (1 extra hour) = ₹700

### Example 2: DISTANCE_BASED Pricing (Long Round)
```json
{
  "name": "Long Round",
  "pricingMode": "DISTANCE_BASED",
  "baseHour": 8,
  "baseDistance": 200,
  "extraPerHour": 150,
  "extraPerHalfHour": 75,
  "carTypePricing": [
    {
      "carType": "MANUAL",
      "basePrice": 3000,
      "distanceSlabs": [
        { "from": 0, "to": 100, "price": 3000 },
        { "from": 101, "to": 200, "price": 4500 },
        { "from": 201, "to": null, "price": 6000 }
      ]
    },
    {
      "carType": "PREMIUM_CARS",
      "basePrice": 4500,
      "distanceSlabs": [
        { "from": 0, "to": 100, "price": 4500 },
        { "from": 101, "to": 200, "price": 6500 },
        { "from": 201, "to": null, "price": 8500 }
      ]
    },
    // ... other car types
  ]
}
```

**Calculation:**
- MANUAL car for 150km: ₹4500 (101-200 slab) + time-based extras
- PREMIUM_CARS for 150km: ₹6500 (101-200 slab) + time-based extras

---

## 🚨 **CRITICAL NEXT STEPS**

1. **Update pricing.service.ts** - This is the most important remaining task
2. **Test the API** - Create trip types and verify pricing calculation works
3. **Update OpenAPI documentation**
4. **Update frontend/mobile apps**

---

## 📝 **API Endpoints (No changes)**

- `GET /trip-types` - List all trip types
- `GET /trip-types/:id` - Get trip type by ID
- `POST /trip-types` - Create trip type (now requires carTypePricing for all car types)
- `PUT /trip-types/:id` - Update trip type
- `DELETE /trip-types/:id` - Delete trip type (soft delete)

---

## 🔧 **Testing**

After completing remaining work, test with:

```bash
# Create a TIME_BASED trip type
curl -X POST http://localhost:4000/api/trip-types \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "City Round Test",
    "pricingMode": "TIME_BASED",
    "baseHour": 3,
    "extraPerHour": 100,
    "extraPerHalfHour": 50,
    "carTypePricing": [
      {"carType": "MANUAL", "basePrice": 400},
      {"carType": "AUTOMATIC", "basePrice": 450},
      {"carType": "PREMIUM_CARS", "basePrice": 600},
      {"carType": "LUXURY_CARS", "basePrice": 800},
      {"carType": "SPORTY_CARS", "basePrice": 1000}
    ]
  }'

# Create a DISTANCE_BASED trip type
curl -X POST http://localhost:4000/api/trip-types \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Long Round Test",
    "pricingMode": "DISTANCE_BASED",
    "baseHour": 8,
    "baseDistance": 200,
    "extraPerHour": 150,
    "extraPerHalfHour": 75,
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

---

## 📚 **Files Changed**

1. ✅ `prisma/schema.prisma` - Schema updated
2. ✅ `prisma/migrations/20260206104310_restructure_trip_type_config_with_car_pricing/migration.sql` - Migration created
3. ✅ `src/repositories/pricing.repository.ts` - Repository updated
4. ✅ `src/services/tripType.service.ts` - Service rewritten
5. ⚠️ `src/services/pricing.service.ts` - NEEDS UPDATE
6. ⚠️ `src/docs/openapi.yaml` - NEEDS UPDATE
7. 💾 `src/services/tripType.service.ts.backup` - Backup of old service

---

**Status:** 60% Complete
**Priority:** Update pricing.service.ts ASAP to make the system functional
