# Frontend Update Instructions: Trip Type Config Page

## 🎯 **Objective**
Update the existing Trip Type Config creation/edit page in the frontend to work with the new API structure that supports:
- Two pricing modes: `TIME_BASED` and `DISTANCE_BASED`
- Separate pricing for each car type: `MANUAL`, `AUTOMATIC`, `PREMIUM_CARS`, `LUXURY_CARS`, `SPORTY_CARS`
- Distance slabs for distance-based pricing

---

## 📋 **API Changes Summary**

### **Old Structure (Deprecated):**
```typescript
{
  name: string;
  specialPrice: boolean;
  basePrice?: number;      // Single price for all cars
  baseHour?: number;
  extraPerHour?: number;
  distanceSlabs?: Array;   // Single slabs for all cars
}
```

### **New Structure (Current):**
```typescript
{
  name: string;
  pricingMode: "TIME_BASED" | "DISTANCE_BASED";
  baseHour?: number;
  extraPerHour?: number;
  extraPerHalfHour?: number;
  baseDistance?: number;   // For DISTANCE_BASED mode
  description?: string;
  carTypePricing: [        // Required: All 5 car types
    {
      carType: "MANUAL" | "AUTOMATIC" | "PREMIUM_CARS" | "LUXURY_CARS" | "SPORTY_CARS";
      basePrice: number;
      distanceSlabs?: Array<{from: number, to: number | null, price: number}>;
    }
  ];
}
```

---

## 🔧 **Required Frontend Changes**

### **1. Update Form State/Interface**

```typescript
interface CarTypePricing {
  carType: 'MANUAL' | 'AUTOMATIC' | 'PREMIUM_CARS' | 'LUXURY_CARS' | 'SPORTY_CARS';
  basePrice: number;
  distanceSlabs?: DistanceSlab[];
}

interface DistanceSlab {
  from: number;
  to: number | null;
  price: number;
}

interface TripTypeFormData {
  name: string;
  pricingMode: 'TIME_BASED' | 'DISTANCE_BASED';
  baseHour?: number;
  extraPerHour?: number;
  extraPerHalfHour?: number;
  baseDistance?: number;
  description?: string;
  carTypePricing: CarTypePricing[];
}

// Initial state
const initialState: TripTypeFormData = {
  name: '',
  pricingMode: 'TIME_BASED',
  baseHour: 0,
  extraPerHour: 0,
  extraPerHalfHour: 0,
  baseDistance: 0,
  description: '',
  carTypePricing: [
    { carType: 'MANUAL', basePrice: 0, distanceSlabs: [] },
    { carType: 'AUTOMATIC', basePrice: 0, distanceSlabs: [] },
    { carType: 'PREMIUM_CARS', basePrice: 0, distanceSlabs: [] },
    { carType: 'LUXURY_CARS', basePrice: 0, distanceSlabs: [] },
    { carType: 'SPORTY_CARS', basePrice: 0, distanceSlabs: [] },
  ]
};
```

---

### **2. Form UI Structure**

The form should have these sections:

#### **Section 1: Basic Information**
```
┌─────────────────────────────────────┐
│ Basic Information                   │
├─────────────────────────────────────┤
│ Trip Type Name: [_______________]   │
│ Description:    [_______________]   │
│                                     │
│ Pricing Mode:                       │
│ ○ TIME_BASED    ○ DISTANCE_BASED   │
└─────────────────────────────────────┘
```

#### **Section 2: Common Settings**
```
┌─────────────────────────────────────┐
│ Common Settings                     │
├─────────────────────────────────────┤
│ Base Hour:          [___] hours     │
│ Extra Per Hour:     ₹[___]          │
│ Extra Per Half Hr:  ₹[___]          │
│                                     │
│ [Show only if DISTANCE_BASED]      │
│ Base Distance:      [___] km        │
└─────────────────────────────────────┘
```

#### **Section 3: Car Type Pricing** (Most Important)
```
┌─────────────────────────────────────────────────────────────┐
│ Car Type Pricing (All 5 Required)                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 🚗 MANUAL                                                   │
│   Base Price: ₹[___]                                        │
│   [Show if DISTANCE_BASED:]                                │
│   Distance Slabs:                                           │
│     From 0 km to 100 km    → ₹[___]  [Remove]             │
│     From 101 km to 200 km  → ₹[___]  [Remove]             │
│     From 201 km to ∞       → ₹[___]  [Remove]             │
│   [+ Add Slab]                                             │
│                                                             │
│ 🚙 AUTOMATIC                                                │
│   Base Price: ₹[___]                                        │
│   [Same slab structure...]                                  │
│                                                             │
│ 🚗 PREMIUM_CARS                                             │
│   Base Price: ₹[___]                                        │
│   [Same slab structure...]                                  │
│                                                             │
│ 🏎️ LUXURY_CARS                                              │
│   Base Price: ₹[___]                                        │
│   [Same slab structure...]                                  │
│                                                             │
│ 🏁 SPORTY_CARS                                              │
│   Base Price: ₹[___]                                        │
│   [Same slab structure...]                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### **3. Form Validation Rules**

```typescript
const validateForm = (data: TripTypeFormData): string[] => {
  const errors: string[] = [];
  
  // Basic validation
  if (!data.name || data.name.trim().length === 0) {
    errors.push('Trip type name is required');
  }
  
  if (!data.pricingMode) {
    errors.push('Pricing mode is required');
  }
  
  // Validate all 5 car types are present
  const requiredCarTypes = ['MANUAL', 'AUTOMATIC', 'PREMIUM_CARS', 'LUXURY_CARS', 'SPORTY_CARS'];
  const providedCarTypes = data.carTypePricing.map(p => p.carType);
  const missingCarTypes = requiredCarTypes.filter(ct => !providedCarTypes.includes(ct));
  
  if (missingCarTypes.length > 0) {
    errors.push(`Missing pricing for: ${missingCarTypes.join(', ')}`);
  }
  
  // Validate each car type pricing
  data.carTypePricing.forEach(pricing => {
    if (!pricing.basePrice || pricing.basePrice < 0) {
      errors.push(`${pricing.carType}: Base price must be greater than 0`);
    }
    
    // For DISTANCE_BASED mode, validate distance slabs
    if (data.pricingMode === 'DISTANCE_BASED') {
      if (!pricing.distanceSlabs || pricing.distanceSlabs.length === 0) {
        errors.push(`${pricing.carType}: Distance slabs are required for DISTANCE_BASED mode`);
      } else {
        pricing.distanceSlabs.forEach((slab, idx) => {
          if (slab.from < 0) {
            errors.push(`${pricing.carType} Slab ${idx + 1}: 'from' must be >= 0`);
          }
          if (slab.to !== null && slab.to < slab.from) {
            errors.push(`${pricing.carType} Slab ${idx + 1}: 'to' must be >= 'from'`);
          }
          if (slab.price < 0) {
            errors.push(`${pricing.carType} Slab ${idx + 1}: price must be >= 0`);
          }
        });
      }
    }
  });
  
  return errors;
};
```

---

### **4. UI/UX Recommendations**

#### **A. Pricing Mode Toggle**
- Use radio buttons or toggle switch
- Show/hide `baseDistance` field based on mode
- Show/hide distance slabs section based on mode

#### **B. Car Type Pricing Section**
- Use accordion or collapsible cards for each car type
- Show car type icon/emoji for visual identification
- Highlight required fields with asterisk (*)
- Use currency formatting for price inputs (₹)

#### **C. Distance Slabs Management**
- Only show for DISTANCE_BASED mode
- Allow adding/removing slabs dynamically
- Auto-calculate "from" value based on previous slab's "to" + 1
- Last slab should have "to: null" (infinity symbol ∞)
- Add validation to prevent overlapping ranges

#### **D. Quick Fill Options**
Provide preset templates for common scenarios:

```typescript
const presetTemplates = {
  cityRound: {
    name: 'City Round Trip',
    pricingMode: 'TIME_BASED',
    baseHour: 3,
    extraPerHour: 100,
    extraPerHalfHour: 50,
    carTypePricing: [
      { carType: 'MANUAL', basePrice: 400 },
      { carType: 'AUTOMATIC', basePrice: 450 },
      { carType: 'PREMIUM_CARS', basePrice: 600 },
      { carType: 'LUXURY_CARS', basePrice: 800 },
      { carType: 'SPORTY_CARS', basePrice: 1000 },
    ]
  },
  longRound: {
    name: 'Long Round',
    pricingMode: 'DISTANCE_BASED',
    baseHour: 8,
    baseDistance: 200,
    extraPerHour: 150,
    carTypePricing: [
      {
        carType: 'MANUAL',
        basePrice: 3000,
        distanceSlabs: [
          { from: 0, to: 100, price: 3000 },
          { from: 101, to: 200, price: 4500 },
          { from: 201, to: null, price: 6000 },
        ]
      },
      // ... other car types with similar structure
    ]
  }
};
```

---

### **5. API Integration**

#### **Create Trip Type**
```typescript
const createTripType = async (formData: TripTypeFormData) => {
  try {
    const response = await fetch('http://localhost:4000/api/trip-types', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create trip type');
    }
    
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error creating trip type:', error);
    throw error;
  }
};
```

#### **Update Trip Type**
```typescript
const updateTripType = async (id: string, formData: Partial<TripTypeFormData>) => {
  try {
    const response = await fetch(`http://localhost:4000/api/trip-types/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update trip type');
    }
    
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error updating trip type:', error);
    throw error;
  }
};
```

#### **Fetch Trip Types (with car type filter)**
```typescript
const fetchTripTypes = async (carType?: string) => {
  try {
    const params = new URLSearchParams();
    if (carType) params.append('carType', carType);
    
    const response = await fetch(
      `http://localhost:4000/api/trip-types?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch trip types');
    }
    
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching trip types:', error);
    throw error;
  }
};
```

---

### **6. Example Component Structure (React/Next.js)**

```typescript
// components/TripTypeForm.tsx
import { useState } from 'react';

export default function TripTypeForm() {
  const [formData, setFormData] = useState<TripTypeFormData>(initialState);
  const [errors, setErrors] = useState<string[]>([]);
  
  const handlePricingModeChange = (mode: 'TIME_BASED' | 'DISTANCE_BASED') => {
    setFormData(prev => ({
      ...prev,
      pricingMode: mode,
      // Clear distance slabs if switching to TIME_BASED
      carTypePricing: mode === 'TIME_BASED' 
        ? prev.carTypePricing.map(p => ({ ...p, distanceSlabs: [] }))
        : prev.carTypePricing
    }));
  };
  
  const handleCarTypePriceChange = (carType: string, basePrice: number) => {
    setFormData(prev => ({
      ...prev,
      carTypePricing: prev.carTypePricing.map(p =>
        p.carType === carType ? { ...p, basePrice } : p
      )
    }));
  };
  
  const handleAddSlab = (carType: string) => {
    setFormData(prev => ({
      ...prev,
      carTypePricing: prev.carTypePricing.map(p => {
        if (p.carType === carType) {
          const lastSlab = p.distanceSlabs?.[p.distanceSlabs.length - 1];
          const newFrom = lastSlab?.to !== null ? (lastSlab?.to || 0) + 1 : 0;
          return {
            ...p,
            distanceSlabs: [
              ...(p.distanceSlabs || []),
              { from: newFrom, to: newFrom + 100, price: 0 }
            ]
          };
        }
        return p;
      })
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    const validationErrors = validateForm(formData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    try {
      await createTripType(formData);
      // Success - redirect or show success message
      alert('Trip type created successfully!');
    } catch (error) {
      setErrors([error.message]);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields here */}
    </form>
  );
}
```

---

### **7. Important Notes**

✅ **Required Changes:**
- Replace `specialPrice` boolean with `pricingMode` enum
- Remove single `basePrice` field (now per car type)
- Add car type pricing section with all 5 car types
- Add distance slabs management for DISTANCE_BASED mode
- Update validation to require all 5 car types

⚠️ **Key Validations:**
- All 5 car types must have pricing
- Distance slabs required only for DISTANCE_BASED mode
- Base price must be > 0 for each car type
- Slab ranges must not overlap
- Last slab should have `to: null` for open-ended

🎨 **UI Enhancements:**
- Show car type icons/emojis
- Use currency formatting (₹)
- Collapsible sections for each car type
- Live preview of pricing calculation
- Template presets for quick setup
- Duplicate pricing button (copy from one car type to others)

---

### **8. Migration Notes**

If there are existing trip types in the old format:
- The backend has already been migrated (old data deleted)
- Frontend should not expect old format in responses
- All new creations must use the new structure
- Update TypeScript interfaces to remove old fields

---

### **9. Testing Checklist**

- [ ] Can create TIME_BASED trip type with all 5 car types
- [ ] Can create DISTANCE_BASED trip type with distance slabs
- [ ] Can add/remove distance slabs dynamically
- [ ] Validation shows errors for missing car types
- [ ] Validation shows errors for invalid slab ranges
- [ ] Can switch between pricing modes
- [ ] Can edit existing trip type
- [ ] Can view trip types filtered by car type
- [ ] Form resets properly after submission
- [ ] Error messages are clear and helpful

---

## 📚 **Reference Documentation**

- Full API Documentation: `backend-api/API_ENDPOINTS_UPDATED.md`
- Implementation Summary: `backend-api/TRIP_TYPE_RESTRUCTURE_SUMMARY.md`
- Swagger/OpenAPI: `backend-api/src/docs/openapi.yaml`

---

## 🚀 **Quick Start**

1. Update TypeScript interfaces with new structure
2. Update form state to include `carTypePricing` array
3. Add pricing mode toggle (TIME_BASED/DISTANCE_BASED)
4. Create car type pricing section with 5 accordion items
5. Add distance slab management for DISTANCE_BASED mode
6. Update form validation logic
7. Update API integration with new payload structure
8. Test create/edit/view flows
9. Add preset templates for quick setup
10. Deploy and test end-to-end

Good luck! 🎉
