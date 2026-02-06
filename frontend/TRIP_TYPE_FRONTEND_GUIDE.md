# Trip Type Creation - Frontend Implementation Guide

## 📋 Complete Structure Overview

### Old vs New API Comparison

#### **OLD Structure (Deprecated)**
```typescript
interface CreateTripTypeRequest {
    name: string;
    specialPrice?: boolean;      // ❌ Removed
    basePrice?: number;          // ❌ Moved to carTypePricing
    baseHour?: number;           // ✅ Kept but renamed
    baseDuration?: number;       // ❌ Merged with baseHour
    distance?: number;           // ❌ Renamed to baseDistance
    extraPerHour?: number;       // ✅ Kept
    extraPerHalfHour?: number;   // ✅ Kept
    description?: string;        // ✅ Kept
    distanceSlabs?: any[];       // ❌ Moved to carTypePricing
}
```

#### **NEW Structure (Current)**
```typescript
enum PricingMode {
    TIME_BASED = 'TIME_BASED',           // Pricing based on time
    DISTANCE_BASED = 'DISTANCE_BASED',   // Pricing based on distance slabs
}

enum CarType {
    MANUAL = 'MANUAL',
    AUTOMATIC = 'AUTOMATIC',
    PREMIUM_CARS = 'PREMIUM_CARS',
    LUXURY_CARS = 'LUXURY_CARS',
    SPORTY_CARS = 'SPORTY_CARS',
}

interface DistanceSlab {
    from: number;        // Starting distance in km
    to: number | null;   // Ending distance (null = open-ended)
    price: number;       // Price for this range
}

interface CarTypePricing {
    id?: string;
    carType: CarType;
    basePrice: number;
    distanceSlabs?: DistanceSlab[] | null;  // Only for DISTANCE_BASED
}

interface CreateTripTypeRequest {
    name: string;
    description?: string;
    pricingMode: PricingMode;              // ✅ NEW: Required
    
    // Common fields for both modes
    baseHour?: number;                      // ✅ Base hours included
    extraPerHour?: number;                  // ✅ Extra charge per hour
    extraPerHalfHour?: number;              // ✅ Extra charge per 30 min
    
    // Distance-based specific
    baseDistance?: number;                  // ✅ NEW: For DISTANCE_BASED
    
    // Car type pricing (ALL 5 REQUIRED)
    carTypePricing: CarTypePricing[];      // ✅ NEW: Must include all 5 car types
}
```

### Key Changes Summary

| Feature | Old | New |
|---------|-----|-----|
| **Pricing Strategy** | `specialPrice` boolean | `pricingMode` enum (TIME_BASED/DISTANCE_BASED) |
| **Base Price** | Single `basePrice` | Per car type in `carTypePricing[]` |
| **Car Types** | Only premium multiplier | All 5 car types required |
| **Distance Slabs** | Optional at root | Per car type in DISTANCE_BASED mode |
| **Required Data** | 3-4 fields | Complete pricing for all 5 car types |

---

## 🔧 TypeScript Interfaces

### Complete Type Definitions

```typescript
// File: frontend/lib/features/tripType/tripTypeApi.ts

export enum PricingMode {
    TIME_BASED = 'TIME_BASED',
    DISTANCE_BASED = 'DISTANCE_BASED',
}

export enum CarType {
    MANUAL = 'MANUAL',
    AUTOMATIC = 'AUTOMATIC',
    PREMIUM_CARS = 'PREMIUM_CARS',
    LUXURY_CARS = 'LUXURY_CARS',
    SPORTY_CARS = 'SPORTY_CARS',
}

export const CAR_TYPE_METADATA: Record<CarType, { label: string; icon: string; color: string }> = {
    [CarType.MANUAL]: { label: 'Manual', icon: '⚙️', color: 'bg-blue-500' },
    [CarType.AUTOMATIC]: { label: 'Automatic', icon: '🚗', color: 'bg-green-500' },
    [CarType.PREMIUM_CARS]: { label: 'Premium Cars', icon: '✨', color: 'bg-purple-500' },
    [CarType.LUXURY_CARS]: { label: 'Luxury Cars', icon: '👑', color: 'bg-amber-500' },
    [CarType.SPORTY_CARS]: { label: 'Sporty Cars', icon: '🏎️', color: 'bg-red-500' },
};

export interface DistanceSlab {
    from: number;
    to: number | null;
    price: number;
}

export interface CarTypePricing {
    id?: string;
    carType: CarType;
    basePrice: number;
    distanceSlabs?: DistanceSlab[] | null;
}

export interface CreateTripTypeRequest {
    name: string;
    description?: string;
    pricingMode: PricingMode;
    baseHour?: number;
    extraPerHour?: number;
    extraPerHalfHour?: number;
    baseDistance?: number;
    carTypePricing: Omit<CarTypePricing, 'id'>[];
}

export interface TripTypeResponse {
    id: string;
    name: string;
    description?: string | null;
    pricingMode: PricingMode;
    baseHour?: number | null;
    extraPerHour?: number | null;
    extraPerHalfHour?: number | null;
    baseDistance?: number | null;
    carTypePricing: CarTypePricing[];
    status: 'ACTIVE' | 'INACTIVE';
    createdAt: Date | string;
    updatedAt: Date | string;
}
```

---

## 🎨 Form UI Layout

### Visual Structure

```
┌─────────────────────────────────────────────────────────────┐
│  Create Trip Type                                       [X] │
│  Configure pricing for all 5 car types                     │
├─────────────────────────────────────────────────────────────┤
│  ⚡ Quick Start Templates                                   │
│  ┌────────────────┐  ┌────────────────┐                    │
│  │ City Round     │  │ Long Round     │                    │
│  │ Time-based •   │  │ Distance-based │                    │
│  │ 3hrs • ₹400+   │  │ 200km • Slabs  │                    │
│  └────────────────┘  └────────────────┘                    │
├─────────────────────────────────────────────────────────────┤
│  📄 Basic Information                                       │
│  [Trip Type Name      ] [Description           ]           │
├─────────────────────────────────────────────────────────────┤
│  💰 Pricing Mode *                                          │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │ ⏰ Time-Based    │  │ 💵 Distance-Based│               │
│  │ Base hrs + extra │  │ Distance slabs   │               │
│  └──────────────────┘  └──────────────────┘               │
├─────────────────────────────────────────────────────────────┤
│  Common Configuration                                       │
│  [Base Hour] [Extra/Hr] [Extra/30min] [Base Distance]     │
├─────────────────────────────────────────────────────────────┤
│  🚗 Car Type Pricing (All 5 Required) *                    │
│                                                             │
│  ⚙️  Manual [Base: ₹400] [2 slabs] ▼                       │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ [Copy from...] [Select car type ▼]                   │ │
│  │ Base Price: [400]                                     │ │
│  │ Distance Slabs:                      [+ Add Slab]    │ │
│  │   Slab 1: [0] to [100] km = ₹[3000]     [🗑]        │ │
│  │   Slab 2: [101] to [∞] km = ₹[4500]     [🗑]        │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  🚗 Automatic [Base: ₹450] ▶                               │
│  ✨ Premium Cars [Base: ₹600] ▶                            │
│  👑 Luxury Cars [Base: ₹800] ▶                             │
│  🏎️  Sporty Cars [Base: ₹1000] ▶                          │
├─────────────────────────────────────────────────────────────┤
│                                   [Cancel] [💾 Create]     │
└─────────────────────────────────────────────────────────────┘
```

### Component Breakdown

1. **Header Section**
   - Title with mode indicator
   - Close button

2. **Template Presets** (Create mode only)
   - Quick buttons for common configurations
   - City Round (TIME_BASED)
   - Long Round (DISTANCE_BASED)

3. **Basic Information**
   - Trip type name (required, immutable after creation)
   - Description (optional)

4. **Pricing Mode Selector**
   - Large toggle buttons
   - TIME_BASED vs DISTANCE_BASED
   - Changes form fields dynamically

5. **Common Configuration**
   - Base Hour (required)
   - Extra Per Hour (optional)
   - Extra Per Half Hour (optional)
   - Base Distance (required for DISTANCE_BASED)

6. **Car Type Pricing Sections** (Collapsible)
   - All 5 car types shown
   - Expandable/collapsible sections
   - Copy pricing between car types
   - Base price input
   - Distance slabs (for DISTANCE_BASED)
     - Add/remove slabs dynamically
     - Auto-calculated ranges
     - Open-ended last slab

7. **Action Buttons**
   - Cancel (closes form)
   - Create/Update (submits with validation)

---

## 🔧 Implementation Details

### Form State Management

```typescript
const [formData, setFormData] = useState({
    name: '',
    description: '',
    pricingMode: PricingMode.TIME_BASED,
    baseHour: 1,
    extraPerHour: 0,
    extraPerHalfHour: 0,
    baseDistance: 0,
    carTypePricing: initializeCarTypePricing(PricingMode.TIME_BASED),
});

const [expandedCarTypes, setExpandedCarTypes] = useState<Set<CarType>>(
    new Set([CarType.MANUAL])
);

const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
```

### Validation Rules

#### Basic Validation
```typescript
// Name is required
if (!formData.name.trim()) {
    errors.name = 'Trip type name is required';
}

// Base hour must be positive
if (formData.baseHour <= 0) {
    errors.baseHour = 'Base hour must be greater than 0';
}

// Base distance required for DISTANCE_BASED
if (formData.pricingMode === PricingMode.DISTANCE_BASED && formData.baseDistance <= 0) {
    errors.baseDistance = 'Base distance must be greater than 0 for distance-based pricing';
}
```

#### Car Type Pricing Validation
```typescript
formData.carTypePricing.forEach(cp => {
    // Base price required
    if (cp.basePrice <= 0) {
        errors[`${cp.carType}_basePrice`] = 'Base price must be greater than 0';
    }

    // Distance slabs validation (DISTANCE_BASED only)
    if (formData.pricingMode === PricingMode.DISTANCE_BASED) {
        if (!cp.distanceSlabs || cp.distanceSlabs.length === 0) {
            errors[`${cp.carType}_slabs`] = 'Must have at least one distance slab';
        } else {
            cp.distanceSlabs.forEach((slab, idx) => {
                if (slab.price <= 0) {
                    errors[`${cp.carType}_slab_${idx}_price`] = 'Price must be > 0';
                }
                if (slab.to !== null && slab.to <= slab.from) {
                    errors[`${cp.carType}_slab_${idx}_to`] = "'to' must be > 'from'";
                }
            });
        }
    }
});
```

#### All 5 Car Types Required
```typescript
const ALL_CAR_TYPES = [
    CarType.MANUAL,
    CarType.AUTOMATIC,
    CarType.PREMIUM_CARS,
    CarType.LUXURY_CARS,
    CarType.SPORTY_CARS,
];

const providedCarTypes = formData.carTypePricing.map(cp => cp.carType);
const missingCarTypes = ALL_CAR_TYPES.filter(ct => !providedCarTypes.includes(ct));

if (missingCarTypes.length > 0) {
    errors.carTypePricing = `Missing pricing for: ${missingCarTypes.join(', ')}`;
}
```

### Distance Slab Management

#### Add Distance Slab
```typescript
const addDistanceSlab = (carType: CarType) => {
    setFormData(prev => ({
        ...prev,
        carTypePricing: prev.carTypePricing.map(cp => {
            if (cp.carType === carType && cp.distanceSlabs) {
                const lastSlab = cp.distanceSlabs[cp.distanceSlabs.length - 1];
                const newFrom = lastSlab.to !== null ? lastSlab.to + 1 : 0;
                
                return {
                    ...cp,
                    distanceSlabs: [
                        ...cp.distanceSlabs.slice(0, -1),
                        { ...lastSlab, to: newFrom - 1 },  // Close previous slab
                        { from: newFrom, to: newFrom + 99, price: lastSlab.price }  // New slab
                    ]
                };
            }
            return cp;
        })
    }));
};
```

#### Remove Distance Slab
```typescript
const removeDistanceSlab = (carType: CarType, index: number) => {
    setFormData(prev => ({
        ...prev,
        carTypePricing: prev.carTypePricing.map(cp => {
            if (cp.carType === carType && cp.distanceSlabs && cp.distanceSlabs.length > 1) {
                const newSlabs = cp.distanceSlabs.filter((_, i) => i !== index);
                // Make last slab open-ended
                newSlabs[newSlabs.length - 1].to = null;
                return { ...cp, distanceSlabs: newSlabs };
            }
            return cp;
        })
    }));
};
```

#### Auto-Calculate Ranges
```typescript
const updateDistanceSlab = (
    carType: CarType,
    slabIndex: number,
    field: keyof DistanceSlab,
    value: number | null
) => {
    setFormData(prev => ({
        ...prev,
        carTypePricing: prev.carTypePricing.map(cp => {
            if (cp.carType === carType && cp.distanceSlabs) {
                const newSlabs = [...cp.distanceSlabs];
                newSlabs[slabIndex] = { ...newSlabs[slabIndex], [field]: value };
                
                // Auto-adjust next slab's 'from' when updating 'to'
                if (field === 'to' && slabIndex < newSlabs.length - 1 && value !== null) {
                    newSlabs[slabIndex + 1].from = value + 1;
                }
                
                return { ...cp, distanceSlabs: newSlabs };
            }
            return cp;
        })
    }));
};
```

### Pricing Mode Toggle

```typescript
const handlePricingModeChange = (mode: PricingMode) => {
    setFormData(prev => ({
        ...prev,
        pricingMode: mode,
        carTypePricing: prev.carTypePricing.map(cp => ({
            ...cp,
            distanceSlabs: mode === PricingMode.DISTANCE_BASED
                ? (cp.distanceSlabs || [{ from: 0, to: 100, price: cp.basePrice }])
                : undefined
        }))
    }));
};
```

---

## 💡 UI/UX Features

### 1. Collapsible Car Type Sections

```typescript
const [expandedCarTypes, setExpandedCarTypes] = useState<Set<CarType>>(
    new Set([CarType.MANUAL])  // Default: Manual expanded
);

const toggleCarType = (carType: CarType) => {
    setExpandedCarTypes(prev => {
        const newSet = new Set(prev);
        if (newSet.has(carType)) {
            newSet.delete(carType);
        } else {
            newSet.add(carType);
        }
        return newSet;
    });
};
```

### 2. Template Presets

```typescript
const TEMPLATES = {
    CITY_ROUND: {
        name: 'City Round',
        pricingMode: PricingMode.TIME_BASED,
        baseHour: 3,
        extraPerHour: 100,
        extraPerHalfHour: 50,
        carTypePricing: [
            { carType: CarType.MANUAL, basePrice: 400 },
            { carType: CarType.AUTOMATIC, basePrice: 450 },
            { carType: CarType.PREMIUM_CARS, basePrice: 600 },
            { carType: CarType.LUXURY_CARS, basePrice: 800 },
            { carType: CarType.SPORTY_CARS, basePrice: 1000 },
        ]
    },
    LONG_ROUND: { /* ... */ }
};

const applyTemplate = (templateKey: keyof typeof TEMPLATES) => {
    const template = TEMPLATES[templateKey];
    setFormData({ /* ... apply template data ... */ });
};
```

### 3. Currency Formatting

```typescript
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

// Usage: formatCurrency(1000) => "₹1,000"
```

### 4. Auto-Calculated Slab Ranges

- When updating a slab's `to` value, automatically sets next slab's `from` to `to + 1`
- Last slab is always open-ended (`to: null`)
- First slab always starts from 0

### 5. Duplicate Pricing Between Car Types

```typescript
const duplicatePricing = (fromCarType: CarType, toCarType: CarType) => {
    const sourcePricing = formData.carTypePricing.find(cp => cp.carType === fromCarType);
    if (!sourcePricing) return;

    setFormData(prev => ({
        ...prev,
        carTypePricing: prev.carTypePricing.map(cp =>
            cp.carType === toCarType ? {
                ...cp,
                basePrice: sourcePricing.basePrice,
                distanceSlabs: sourcePricing.distanceSlabs
                    ? JSON.parse(JSON.stringify(sourcePricing.distanceSlabs))
                    : undefined
            } : cp
        )
    }));
};
```

---

## 📝 Code Examples

### React Component Structure

```typescript
// File: frontend/components/dashboard/trips/TripTypeCreateFormNew.tsx

export function TripTypeCreateFormNew({ onClose, tripType }: Props) {
    // State
    const [formData, setFormData] = useState({ /* ... */ });
    const [expandedCarTypes, setExpandedCarTypes] = useState<Set<CarType>>();
    const [validationErrors, setValidationErrors] = useState({});
    
    // Handlers
    const handlePricingModeChange = (mode: PricingMode) => { /* ... */ };
    const updateCarTypePricing = (carType, field, value) => { /* ... */ };
    const addDistanceSlab = (carType) => { /* ... */ };
    const removeDistanceSlab = (carType, index) => { /* ... */ };
    const duplicatePricing = (from, to) => { /* ... */ };
    
    // Validation
    const validateForm = () => { /* ... */ };
    
    // Submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        
        const payload = {
            name: formData.name.trim(),
            pricingMode: formData.pricingMode,
            baseHour: formData.baseHour,
            extraPerHour: formData.extraPerHour,
            extraPerHalfHour: formData.extraPerHalfHour,
            baseDistance: formData.pricingMode === PricingMode.DISTANCE_BASED 
                ? formData.baseDistance 
                : undefined,
            carTypePricing: formData.carTypePricing
        };
        
        await dispatch(tripType ? updateTripType({ id: tripType.id, data: payload }) : createTripType(payload));
        onClose();
    };
    
    return (/* JSX */)
}
```

### API Integration Functions

```typescript
// File: frontend/lib/features/tripType/tripTypeApi.ts

export async function createTripType(data: CreateTripTypeRequest): Promise<TripTypeResponse> {
    const response = await api.post<CreateTripTypeResponse>(
        TRIP_TYPE_ENDPOINTS.BASE,
        data
    );
    return response.data.data;
}

export async function updateTripType(
    id: string,
    data: UpdateTripTypeRequest
): Promise<TripTypeResponse> {
    const response = await api.put<TripTypeDetailResponse>(
        TRIP_TYPE_ENDPOINTS.BY_ID(id),
        data
    );
    return response.data.data;
}
```

### Form Handlers

```typescript
// Update basic field
const handleBasicFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
    });
};

// Update car type pricing field
const updateCarTypePricing = (carType: CarType, field: string, value: any) => {
    setFormData(prev => ({
        ...prev,
        carTypePricing: prev.carTypePricing.map(cp =>
            cp.carType === carType ? { ...cp, [field]: value } : cp
        )
    }));
};
```

### Error Handling

```typescript
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!validateForm()) {
        return;
    }
    
    setIsSubmitting(true);
    
    try {
        const payload = buildPayload();
        
        if (tripType) {
            await dispatch(updateTripType({ id: tripType.id, data: payload })).unwrap();
        } else {
            await dispatch(createTripType(payload)).unwrap();
        }
        
        dispatch(fetchTripTypesPaginated({ page: 1, limit: 10 }));
        onClose();
    } catch (err: any) {
        setError(
            err?.message ||
            err?.response?.data?.error ||
            `Failed to ${tripType ? 'update' : 'create'} trip type`
        );
    } finally {
        setIsSubmitting(false);
    }
};
```

---

## ✅ Testing Checklist

### Create Scenarios

- [ ] **Create TIME_BASED trip type**
  - [ ] Fill name and description
  - [ ] Select TIME_BASED mode
  - [ ] Set base hour, extra per hour/half-hour
  - [ ] Fill base price for all 5 car types
  - [ ] Submit and verify creation

- [ ] **Create DISTANCE_BASED trip type**
  - [ ] Fill name and description
  - [ ] Select DISTANCE_BASED mode
  - [ ] Set base hour, base distance, extras
  - [ ] Configure distance slabs for all 5 car types
  - [ ] Add multiple slabs
  - [ ] Remove slabs
  - [ ] Submit and verify creation

- [ ] **Use template presets**
  - [ ] Apply City Round template
  - [ ] Verify all fields populated
  - [ ] Apply Long Round template
  - [ ] Verify distance slabs created

### Edit Scenarios

- [ ] **Edit existing TIME_BASED trip type**
  - [ ] Load existing data correctly
  - [ ] Modify pricing
  - [ ] Submit and verify update

- [ ] **Edit existing DISTANCE_BASED trip type**
  - [ ] Load with distance slabs
  - [ ] Modify slabs
  - [ ] Add/remove slabs
  - [ ] Submit and verify update

- [ ] **Switch pricing mode**
  - [ ] Change from TIME_BASED to DISTANCE_BASED
  - [ ] Verify distance slabs initialized
  - [ ] Change from DISTANCE_BASED to TIME_BASED
  - [ ] Verify slabs removed

### Validation Edge Cases

- [ ] **Empty name** → Error: "Trip type name is required"
- [ ] **Base hour = 0** → Error: "Base hour must be greater than 0"
- [ ] **DISTANCE_BASED without base distance** → Error shown
- [ ] **Base price = 0 for any car type** → Error for that car type
- [ ] **Missing car type pricing** → Should not happen (initialized)
- [ ] **Invalid distance slab range** (to < from) → Error
- [ ] **Negative price** → Error
- [ ] **No distance slabs in DISTANCE_BASED** → Error

### Mode Switching Behavior

- [ ] **TIME_BASED → DISTANCE_BASED**
  - [ ] Distance slabs auto-initialized with base price
  - [ ] Base distance field appears
  - [ ] All car types get default slab

- [ ] **DISTANCE_BASED → TIME_BASED**
  - [ ] Distance slabs removed
  - [ ] Base distance field hidden
  - [ ] Base prices retained

### Distance Slab Features

- [ ] **Add distance slab**
  - [ ] New slab created with auto-calculated range
  - [ ] Previous slab closed (to value set)
  - [ ] New slab is open-ended

- [ ] **Remove distance slab**
  - [ ] Slab removed
  - [ ] Last slab becomes open-ended
  - [ ] Cannot remove if only one slab

- [ ] **Update slab 'to' value**
  - [ ] Next slab's 'from' auto-updates to 'to + 1'
  - [ ] Range validation works

- [ ] **Last slab is always open-ended**
  - [ ] 'to' field disabled
  - [ ] Shows "∞" placeholder

### Duplicate Pricing

- [ ] **Copy pricing from Manual to Automatic**
  - [ ] Base price copied
  - [ ] Distance slabs deep-copied (if present)

- [ ] **Copy between different modes**
  - [ ] TIME_BASED: Only base price copied
  - [ ] DISTANCE_BASED: Base price + slabs copied

### UI/UX

- [ ] **Collapsible sections work**
  - [ ] Click to expand/collapse
  - [ ] Multiple sections can be open
  - [ ] Shows summary when collapsed (base price, slab count)

- [ ] **Currency formatting**
  - [ ] Displays ₹ symbol
  - [ ] Indian number format (₹1,000 not $1,000)

- [ ] **Loading states**
  - [ ] Submit button shows "Creating..." / "Updating..."
  - [ ] Spinner icon rotates
  - [ ] Form fields disabled during submission

- [ ] **Error display**
  - [ ] General error at top
  - [ ] Field-specific errors below inputs
  - [ ] Errors clear when field corrected

### API Integration

- [ ] **Successful creation**
  - [ ] POST request sent with correct payload
  - [ ] Response handled
  - [ ] List refreshed
  - [ ] Form closed

- [ ] **Successful update**
  - [ ] PUT request sent
  - [ ] Response handled
  - [ ] List refreshed

- [ ] **API error handling**
  - [ ] 400 Bad Request → Show error message
  - [ ] 500 Server Error → Show generic error
  - [ ] Network error → Show connection error

### Accessibility

- [ ] All inputs have labels
- [ ] Required fields marked with *
- [ ] Keyboard navigation works
- [ ] Tab order logical
- [ ] Focus states visible
- [ ] Error announcements

---

## 🎯 Example Payloads

### TIME_BASED Example (City Round)

```json
{
  "name": "City Round",
  "description": "City round trip for local travel",
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

**Price Calculation Example:**
- **Manual car, 4 hours:** ₹400 (3 base hours) + ₹100 (1 extra hour) = **₹500**
- **Luxury car, 5 hours:** ₹800 (3 base hours) + ₹200 (2 extra hours) = **₹1,000**

### DISTANCE_BASED Example (Long Round)

```json
{
  "name": "Long Round",
  "description": "Long distance round trip",
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
      "carType": "AUTOMATIC",
      "basePrice": 3300,
      "distanceSlabs": [
        { "from": 0, "to": 100, "price": 3300 },
        { "from": 101, "to": 200, "price": 5000 },
        { "from": 201, "to": null, "price": 6500 }
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
    {
      "carType": "LUXURY_CARS",
      "basePrice": 6000,
      "distanceSlabs": [
        { "from": 0, "to": 100, "price": 6000 },
        { "from": 101, "to": 200, "price": 8500 },
        { "from": 201, "to": null, "price": 11000 }
      ]
    },
    {
      "carType": "SPORTY_CARS",
      "basePrice": 8000,
      "distanceSlabs": [
        { "from": 0, "to": 100, "price": 8000 },
        { "from": 101, "to": 200, "price": 11000 },
        { "from": 201, "to": null, "price": 14000 }
      ]
    }
  ]
}
```

**Price Calculation Example:**
- **Manual car, 50 km:** ₹3,000 (0-100km slab) + time extras = **₹3,000+**
- **Manual car, 150 km:** ₹4,500 (101-200km slab) + time extras = **₹4,500+**
- **Manual car, 250 km:** ₹6,000 (201+km slab) + time extras = **₹6,000+**

---

## 🚀 Integration Guide

### Step 1: Import the New Component

```typescript
// File: frontend/components/dashboard/trips/TripManager.tsx

import { TripTypeCreateFormNew } from './TripTypeCreateFormNew';
```

### Step 2: Replace Old Form

```typescript
// OLD
{showCreateForm && (
    <TripTypeCreateForm 
        onClose={() => setShowCreateForm(false)} 
        tripType={selectedTripType} 
    />
)}

// NEW
{showCreateForm && (
    <TripTypeCreateFormNew 
        onClose={() => setShowCreateForm(false)} 
        tripType={selectedTripType} 
    />
)}
```

### Step 3: Update Trip Type List Display

Ensure the list component handles the new structure:

```typescript
// Display pricing mode
<span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
    {tripType.pricingMode === PricingMode.TIME_BASED ? '⏰ Time' : '📏 Distance'}
</span>

// Display car type count
<span className="text-xs text-gray-600">
    {tripType.carTypePricing.length} car types
</span>
```

---

## 🔍 Troubleshooting

### Common Issues

1. **"Missing pricing for car types" error**
   - Ensure `initializeCarTypePricing()` creates all 5 car types
   - Check validation doesn't skip any car type

2. **Distance slabs not saving**
   - Verify `pricingMode === DISTANCE_BASED` condition
   - Check slabs are not `undefined` in payload

3. **Form not loading edit data**
   - Ensure `useEffect` dependency array includes `tripType`
   - Check API response includes `carTypePricing` array

4. **Auto-calculated ranges not working**
   - Verify `updateDistanceSlab` checks for `field === 'to'`
   - Ensure next slab index exists before updating

5. **Duplicate pricing not working**
   - Use `JSON.parse(JSON.stringify())` for deep copy
   - Check source car type exists in form data

---

## 📚 Additional Resources

- [Backend API Documentation](../backend-api/API_ENDPOINTS_UPDATED.md)
- [Trip Type Restructure Summary](../backend-api/TRIP_TYPE_RESTRUCTURE_SUMMARY.md)
- [Prisma Schema](../backend-api/prisma/schema.prisma)

---

**Last Updated:** February 6, 2026  
**Version:** 2.0.0  
**Status:** ✅ Ready for Production
