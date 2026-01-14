# Frontend Developer Guide - Adding New Features

This guide explains how to add a new feature/page to the Drybros frontend application and link it with the dashboard. We'll use the **Penalties Management** feature as a reference example.

## Table of Contents
1. [Project Structure](#project-structure)
2. [Step-by-Step: Adding a New Feature](#step-by-step-adding-a-new-feature)
3. [Example: Driver Management Setup](#example-driver-management-setup)
4. [Best Practices](#best-practices)
5. [Common Patterns](#common-patterns)

---

## Project Structure

```
frontend/
├── app/                          # Next.js App Router pages
│   ├── dashboard/               # Dashboard page
│   ├── penalties/               # Feature page (example)
│   └── (auth)/                  # Auth routes
├── components/
│   └── dashboard/
│       ├── penalties/           # Feature components (example)
│       ├── AdminDashboard.tsx   # Main dashboard component
│       └── DashboardLayout.tsx  # Shared layout
├── lib/
│   ├── constants/              # All constants (routes, strings, etc.)
│   ├── features/               # Redux slices
│   ├── types/                  # TypeScript types
│   └── store.ts                # Redux store
```

---

## Step-by-Step: Adding a New Feature

### Step 1: Create Constants

**Location:** `frontend/lib/constants/[feature-name].ts`

Create a constants file for your feature with routes, API endpoints, and UI strings.

**Example:** `lib/constants/drivers.ts`

```typescript
export const DRIVERS_ROUTES = {
    LIST: '/drivers',
    CREATE: '/drivers/create',
    EDIT: '/drivers/edit',
} as const;

export const DRIVERS_API_ENDPOINTS = {
    LIST: '/drivers',
    CREATE: '/drivers',
    UPDATE: '/drivers',
    DELETE: '/drivers',
} as const;

export const DRIVERS_STRINGS = {
    TITLE: 'Driver Management',
    LIST_TITLE: 'Drivers',
    CREATE_TITLE: 'Create New Driver',
    EDIT_TITLE: 'Edit Driver',
    NAME: 'Driver Name',
    NAME_PLACEHOLDER: 'Enter driver name',
    // ... more strings
} as const;
```

**Export it:** Add to `lib/constants/index.ts`
```typescript
export * from './drivers';
```

---

### Step 2: Create TypeScript Types

**Location:** `frontend/lib/types/[feature-name].ts`

**Example:** `lib/types/drivers.ts`

```typescript
export interface Driver {
    id: number;
    firstName: string;
    lastName: string;
    phone: string;
    status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
    // ... more fields
}

export interface CreateDriverInput {
    firstName: string;
    lastName: string;
    phone: string;
    // ... more fields
}
```

**Export it:** Add to `lib/types/index.ts`
```typescript
export * from './drivers';
```

---

### Step 3: Create Redux Slice (Optional - if you need state management)

**Location:** `frontend/lib/features/[feature-name]/[feature-name]Slice.ts`

**Example:** `lib/features/drivers/driversSlice.ts`

```typescript
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Driver, CreateDriverInput } from '../../types/drivers';
import { DRIVERS_API_ENDPOINTS } from '../../constants/drivers';

interface DriversState {
    drivers: Driver[];
    isLoading: boolean;
    error: string | null;
}

const initialState: DriversState = {
    drivers: [],
    isLoading: false,
    error: null,
};

// Async thunks
export const fetchDrivers = createAsyncThunk(
    'drivers/fetchDrivers',
    async () => {
        // Your API call or dummy data
        return [];
    }
);

const driversSlice = createSlice({
    name: 'drivers',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        // Handle async thunks
    },
});

export default driversSlice.reducer;
```

**Add to store:** Update `lib/store.ts`
```typescript
import driversReducer from './features/drivers/driversSlice';

export const makeStore = () => {
    return configureStore({
        reducer: {
            // ... existing reducers
            drivers: driversReducer,
        },
    });
};
```

---

### Step 4: Create Feature Components

**Location:** `frontend/components/dashboard/[feature-name]/`

Create your feature components:

**Example structure:**
```
components/dashboard/drivers/
├── DriversList.tsx          # List view component
├── DriverForm.tsx           # Create/Edit form
├── DriversManager.tsx       # Main orchestrator component
└── DriverDetails.tsx        # Details view (optional)
```

**Example:** `components/dashboard/drivers/DriversManager.tsx`

```typescript
"use client";

import React, { useState } from 'react';
import { DriversList } from './DriversList';
import { DriverForm } from './DriverForm';
import { Driver } from '@/lib/types/drivers';

export function DriversManager() {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

    const handleCreateClick = () => {
        setSelectedDriver(null);
        setIsFormOpen(true);
    };

    const handleEditClick = (driver: Driver) => {
        setSelectedDriver(driver);
        setIsFormOpen(true);
    };

    return (
        <>
            <DriversList
                onCreateClick={handleCreateClick}
                onEditClick={handleEditClick}
            />
            <DriverForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                driver={selectedDriver}
            />
        </>
    );
}
```

---

### Step 5: Create Page Route (Optional - if you want a standalone page)

**Location:** `frontend/app/[feature-name]/page.tsx`

**Example:** `app/drivers/page.tsx`

```typescript
"use client";

import React from 'react';
import { DriversManager } from '@/components/dashboard/drivers/DriversManager';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

export default function DriversPage() {
    return (
        <DashboardLayout>
            <div className="p-6">
                <DriversManager />
            </div>
        </DashboardLayout>
    );
}
```

---

### Step 6: Add Menu Item to Dashboard Constants

**Location:** `frontend/lib/constants/dashboard.ts`

Add your feature to the menu items:

```typescript
import { Truck, Users } from 'lucide-react';

export const ROLE_MENUS: Record<string, NavItem[]> = {
    admin: [
        // ... existing items
        { icon: Truck, label: 'Drivers', id: 'drivers' },
    ],
    staff: [
        // ... existing items
        { icon: Truck, label: 'Drivers', id: 'drivers' },
    ],
};
```

**Note:** The `id` must match what you'll use in the dashboard switch statement.

---

### Step 7: Integrate with Dashboard

**Location:** `frontend/components/dashboard/AdminDashboard.tsx` (and `StaffDashboard.tsx`)

Add your feature to the dashboard's switch statement:

```typescript
import { DriversManager } from './drivers/DriversManager';

export function AdminDashboard() {
    const { activeTab } = useAppSelector((state) => state.auth);

    const renderContent = () => {
        switch (activeTab) {
            // ... existing cases
            case 'drivers':
                return <DriversManager />;
            default:
                return null;
        }
    };

    return (
        <DashboardLayout>
            {renderContent()}
        </DashboardLayout>
    );
}
```

**Do the same for StaffDashboard.tsx** if staff should also access it.

---

## Example: Driver Management Setup

Here's a complete example of how to set up Driver Management:

### 1. Constants File

```typescript
// lib/constants/drivers.ts
export const DRIVERS_ROUTES = {
    LIST: '/drivers',
    CREATE: '/drivers/create',
} as const;

export const DRIVERS_STRINGS = {
    TITLE: 'Driver Management',
    LIST_TITLE: 'Drivers',
    CREATE_TITLE: 'Create New Driver',
} as const;
```

### 2. Types File

```typescript
// lib/types/drivers.ts
export interface Driver {
    id: number;
    firstName: string;
    lastName: string;
    phone: string;
    status: 'ACTIVE' | 'INACTIVE';
}
```

### 3. Component Structure

```
components/dashboard/drivers/
├── DriversList.tsx
├── DriverForm.tsx
└── DriversManager.tsx
```

### 4. Dashboard Integration

```typescript
// components/dashboard/AdminDashboard.tsx
import { DriversManager } from './drivers/DriversManager';

// In renderContent():
case 'drivers':
    return <DriversManager />;
```

### 5. Menu Configuration

```typescript
// lib/constants/dashboard.ts
admin: [
    { icon: Truck, label: 'Drivers', id: 'drivers' },
]
```

---

## Best Practices

### 1. **Always Use Constants**
- ❌ Don't hardcode strings: `"Create Driver"`
- ✅ Use constants: `DRIVERS_STRINGS.CREATE_TITLE`

### 2. **Follow the Pattern**
- Use the same structure as existing features (like penalties)
- Keep components modular and reusable
- Use TypeScript types for all data structures

### 3. **Responsive Design**
- Use Tailwind responsive classes: `sm:`, `md:`, `lg:`
- Test on mobile, tablet, and desktop
- Example: `className="w-full sm:w-auto"`

### 4. **Performance**
- Use `useCallback` for event handlers
- Use `useMemo` for expensive computations
- Avoid unnecessary re-renders

### 5. **Error Handling**
- Use toast notifications for user feedback
- Don't use `console.log` in production code
- Handle loading and error states

### 6. **Code Organization**
```
✅ Good:
components/dashboard/drivers/
  ├── DriversList.tsx
  ├── DriverForm.tsx
  └── DriversManager.tsx

❌ Bad:
components/
  ├── DriversList.tsx
  ├── DriverForm.tsx
  └── DriversManager.tsx
```

---

## Common Patterns

### Pattern 1: List with Create/Edit Modal

```typescript
// Manager component orchestrates everything
export function DriversManager() {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

    return (
        <>
            <DriversList
                onCreateClick={() => {
                    setSelectedDriver(null);
                    setIsFormOpen(true);
                }}
                onEditClick={(driver) => {
                    setSelectedDriver(driver);
                    setIsFormOpen(true);
                }}
            />
            <DriverForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                driver={selectedDriver}
            />
        </>
    );
}
```

### Pattern 2: Using Redux

```typescript
// In your component
const { drivers, isLoading } = useAppSelector((state) => state.drivers);
const dispatch = useAppDispatch();

useEffect(() => {
    dispatch(fetchDrivers());
}, [dispatch]);
```

### Pattern 3: Form Validation

```typescript
const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
        newErrors.name = 'Name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
}, [formData]);
```

### Pattern 4: Toast Notifications

```typescript
import { useToast } from '@/components/ui/toast';

const { toast } = useToast();

// Success
toast({
    title: "Success",
    description: "Driver created successfully",
    variant: "success",
});

// Error
toast({
    title: "Error",
    description: "Failed to create driver",
    variant: "error",
});
```

---

## Quick Checklist

When adding a new feature, make sure you:

- [ ] Created constants file (`lib/constants/[feature].ts`)
- [ ] Created types file (`lib/types/[feature].ts`)
- [ ] Exported from index files
- [ ] Created Redux slice (if needed) and added to store
- [ ] Created feature components in `components/dashboard/[feature]/`
- [ ] Created Manager component to orchestrate
- [ ] Added menu item to `dashboard.ts` constants
- [ ] Added case to `AdminDashboard.tsx` switch statement
- [ ] Added case to `StaffDashboard.tsx` (if needed)
- [ ] Made UI responsive
- [ ] Added proper error handling
- [ ] Used constants instead of hardcoded strings
- [ ] Removed all console.log statements

---

## Reference: Penalties Management Feature

The **Penalties Management** feature is a complete example you can reference:

- **Constants:** `lib/constants/penalties.ts`
- **Types:** `lib/types/penalties.ts`
- **Redux:** `lib/features/penalties/penaltiesSlice.ts`
- **Components:** `components/dashboard/penalties/`
- **Dashboard Integration:** See `AdminDashboard.tsx` line ~156

Study this feature to understand the patterns and structure used in the codebase.

---

## Need Help?

If you're stuck:
1. Check the penalties management feature as a reference
2. Look at existing features (staff, franchise) for patterns
3. Follow the file structure and naming conventions
4. Use TypeScript types - the IDE will help you

---

## Summary

**To add Driver Management (Quick Steps):**

1. ✅ Create `lib/constants/drivers.ts` with routes and strings
2. ✅ Create `lib/types/drivers.ts` with TypeScript interfaces
3. ✅ Create `components/dashboard/drivers/` folder with components
4. ✅ Add `{ icon: Truck, label: 'Drivers', id: 'drivers' }` to `dashboard.ts`
5. ✅ Add `case 'drivers': return <DriversManager />;` to `AdminDashboard.tsx`

That's it! The sidebar will automatically show the menu item, and clicking it will render your component.

---

## Visual Flow Diagram

```
User clicks "Drivers" in sidebar
         ↓
Sidebar sets activeTab = 'drivers' (via Redux)
         ↓
AdminDashboard.renderContent() checks activeTab
         ↓
Switch statement matches case 'drivers'
         ↓
Returns <DriversManager />
         ↓
DriversManager renders DriversList + DriverForm
         ↓
User sees the Driver Management UI
```

---

## File Mapping Reference

| What You Need | Where It Goes | Example |
|--------------|---------------|---------|
| Constants | `lib/constants/[feature].ts` | `lib/constants/drivers.ts` |
| Types | `lib/types/[feature].ts` | `lib/types/drivers.ts` |
| Redux Slice | `lib/features/[feature]/[feature]Slice.ts` | `lib/features/drivers/driversSlice.ts` |
| Components | `components/dashboard/[feature]/` | `components/dashboard/drivers/` |
| Menu Config | `lib/constants/dashboard.ts` | Add to `ROLE_MENUS` |
| Dashboard Link | `components/dashboard/AdminDashboard.tsx` | Add case in switch |
| Standalone Page | `app/[feature]/page.tsx` | `app/drivers/page.tsx` (optional) |

---

## Common Questions

### Q: How does the sidebar know what to show?
**A:** The sidebar reads from `ROLE_MENUS` in `lib/constants/dashboard.ts`. Each menu item has an `id` that matches the case in the dashboard switch statement.

### Q: Do I need to create a page in `app/` folder?
**A:** No! If you add it to the dashboard switch statement, it will render when the menu item is clicked. The `app/` folder is only needed if you want a standalone route (like `/drivers`).

### Q: How do I make it accessible to both admin and staff?
**A:** Add the menu item to both `admin` and `staff` arrays in `ROLE_MENUS`, and add the case to both `AdminDashboard.tsx` and `StaffDashboard.tsx`.

### Q: What if I need Redux state management?
**A:** Create a slice in `lib/features/[feature]/[feature]Slice.ts` and add it to the store in `lib/store.ts`. See the penalties feature for a complete example.

### Q: How do I style components?
**A:** Use Tailwind CSS classes. Follow the existing patterns in penalties/staff components. Always make it responsive with `sm:`, `md:`, `lg:` breakpoints.

---

## Quick Copy-Paste Template

### Step 1: Constants Template
```typescript
// lib/constants/drivers.ts
export const DRIVERS_ROUTES = {
    LIST: '/drivers',
} as const;

export const DRIVERS_STRINGS = {
    TITLE: 'Driver Management',
} as const;
```

### Step 2: Types Template
```typescript
// lib/types/drivers.ts
export interface Driver {
    id: number;
    name: string;
}
```

### Step 3: Component Template
```typescript
// components/dashboard/drivers/DriversManager.tsx
"use client";

import React from 'react';

export function DriversManager() {
    return (
        <div>
            <h1>Driver Management</h1>
        </div>
    );
}
```

### Step 4: Dashboard Integration
```typescript
// In AdminDashboard.tsx
import { DriversManager } from './drivers/DriversManager';

// In renderContent() switch:
case 'drivers':
    return <DriversManager />;
```

### Step 5: Menu Item
```typescript
// In lib/constants/dashboard.ts
admin: [
    { icon: Truck, label: 'Drivers', id: 'drivers' },
]
```

**That's all you need to get started!** 🚀
