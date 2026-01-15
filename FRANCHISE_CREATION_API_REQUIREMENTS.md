# Franchise Creation API - Field Requirements

**Date:** 2025-01-XX  
**Purpose:** Define fields needed for franchise creation API based on frontend form

---

## 📋 Frontend Form Fields Analysis

Based on `CreateFranchiseForm.tsx`, the frontend collects the following fields:

### Required Fields (from form validation)
1. **name** (string) - Franchise Name
   - Label: "Franchise Name"
   - Placeholder: "e.g. South Side Hub"
   - Required: ✅ Yes

2. **location** (string) - Region/Area
   - Label: "Region/Area"
   - Placeholder: "e.g. South District"
   - Required: ✅ Yes
   - **Note:** Used to generate `code` on frontend: `DB-${location.toUpperCase().substring(0, 3)}-${random}`

3. **address** (string) - Physical Address
   - Label: "Physical Address"
   - Placeholder: "Full street address, city, and zip code"
   - Required: ✅ Yes

4. **email** (string) - Official Email
   - Label: "Official Email"
   - Placeholder: "office@franchise.com"
   - Type: `email`
   - Required: ✅ Yes

5. **phone** (string) - Contact Number
   - Label: "Contact Number"
   - Placeholder: "+1 000 000 0000"
   - Required: ✅ Yes

6. **inchargeName** (string) - In-charge Name
   - Label: "In-charge Name"
   - Placeholder: "Name of the primary manager"
   - Required: ✅ Yes

### Optional Fields
7. **description** (string) - Description
   - Not shown in form but included in formData state
   - Optional: ✅ Yes

8. **image** (string/file) - Franchise Branding
   - Label: "Franchise Branding"
   - Placeholder for image upload
   - Type: File upload (PNG, JPG up to 5MB)
   - Optional: ✅ Yes
   - **Note:** Currently just a placeholder, not implemented

---

## 🗄️ Current Database Schema (Prisma)

From `schema.prisma`, the Franchise model currently has:

```prisma
model Franchise {
  id        Int        @id @default(autoincrement())
  code      String     @unique          // ✅ Exists
  name      String                      // ✅ Exists
  city      String                      // ✅ Exists
  address   String?                     // ✅ Exists (optional)
  phone     String?                     // ✅ Exists (optional)
  isActive  Boolean    @default(true)   // ✅ Exists
  createdAt DateTime   @default(now())
  updatedAt DateTime
  Customer  Customer[]
  Driver    Driver[]
  Trip      Trip[]
}
```

---

## 🔄 Field Mapping & Gaps Analysis

### Fields That Match (Direct Mapping)
| Frontend Field | Database Field | Status | Notes |
|---------------|----------------|--------|-------|
| `name` | `name` | ✅ Match | Direct mapping |
| `address` | `address` | ✅ Match | Direct mapping (optional in DB) |
| `phone` | `phone` | ✅ Match | Direct mapping (optional in DB) |

### Fields That Need Mapping/Transformation
| Frontend Field | Database Field | Transformation Needed |
|---------------|----------------|----------------------|
| `location` | `city` | Frontend uses "location" but DB has "city" - **Need to map** |
| `code` | `code` | Frontend generates: `DB-${location.toUpperCase().substring(0, 3)}-${random}` - **Backend should generate or validate** |
| `isActive` | `isActive` | Frontend sends `status: 'active'` but DB uses `isActive: boolean` - **Need to map** |

### Fields Missing in Database
| Frontend Field | Type | Required | Action Needed |
|---------------|------|----------|---------------|
| `email` | string | ✅ Yes | **ADD to schema** |
| `inchargeName` | string | ✅ Yes | **ADD to schema** |
| `description` | string | ❌ No | **ADD to schema** (optional) |
| `image` | string | ❌ No | **ADD to schema** (optional, for image URL/path) |

---

## 📝 Required API Fields Summary

### Request Body Fields (POST /franchises)

#### Required Fields:
```typescript
{
  name: string;           // ✅ Required - Franchise name
  location: string;       // ✅ Required - Region/Area (maps to city in DB)
  address: string;        // ✅ Required - Physical address
  email: string;          // ✅ Required - Official email (NEW - needs DB migration)
  phone: string;          // ✅ Required - Contact number
  inchargeName: string;   // ✅ Required - In-charge name (NEW - needs DB migration)
}
```

#### Optional Fields:
```typescript
{
  description?: string;   // Optional - Description (NEW - needs DB migration)
  image?: string;         // Optional - Image URL/path (NEW - needs DB migration)
}
```

#### Auto-Generated Fields (Backend):
```typescript
{
  code: string;           // Auto-generated from location or provided
  isActive: boolean;      // Default: true
  createdAt: DateTime;    // Auto-generated
  updatedAt: DateTime;    // Auto-generated
}
```

---

## 🔧 Database Migration Required

### New Fields to Add to Franchise Model:

```prisma
model Franchise {
  id          Int        @id @default(autoincrement())
  code        String     @unique
  name        String
  city        String
  address     String?
  phone       String?
  email       String?    // ⬅️ NEW - Add this field
  inchargeName String?   // ⬅️ NEW - Add this field
  description String?    // ⬅️ NEW - Add this field (optional)
  image       String?    // ⬅️ NEW - Add this field (optional, for image URL)
  isActive    Boolean    @default(true)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime
  Customer    Customer[]
  Driver      Driver[]
  Trip        Trip[]
}
```

**Note:** Consider making `email` required (non-nullable) since frontend requires it:
```prisma
email       String      // Required, not nullable
inchargeName String     // Required, not nullable
```

---

## 📋 Field Validation Requirements

### Validation Rules Needed:

1. **name** (string)
   - Required: ✅
   - Min length: 2 characters
   - Max length: 100 characters
   - Pattern: Allow letters, numbers, spaces, hyphens

2. **location** (string) - Maps to `city` in DB
   - Required: ✅
   - Min length: 2 characters
   - Max length: 50 characters
   - Pattern: Allow letters, numbers, spaces

3. **address** (string)
   - Required: ✅
   - Min length: 10 characters
   - Max length: 500 characters

4. **email** (string)
   - Required: ✅
   - Format: Valid email format
   - Unique: Should be unique across franchises (consider adding unique constraint)

5. **phone** (string)
   - Required: ✅
   - Format: Should validate phone number format
   - Pattern: Allow +, digits, spaces, hyphens
   - Min length: 10 characters
   - Max length: 20 characters

6. **inchargeName** (string)
   - Required: ✅
   - Min length: 2 characters
   - Max length: 100 characters
   - Pattern: Allow letters, spaces, hyphens, apostrophes

7. **description** (string, optional)
   - Max length: 1000 characters

8. **image** (string, optional)
   - Format: URL or file path
   - Max length: 500 characters

9. **code** (string, auto-generated)
   - Format: Should be unique
   - Pattern: `DB-{LOCATION_CODE}-{NUMBER}` or custom format
   - **Recommendation:** Backend should generate this, not frontend

---

## 🔄 Field Transformation Logic

### Frontend → Backend Mapping:

```typescript
// Frontend sends:
{
  name: "South Side Hub",
  location: "South District",      // ⬅️ Maps to city
  address: "123 Main St...",
  email: "office@franchise.com",
  phone: "+1 234 567 8900",
  inchargeName: "John Manager",
  description: "Optional description",
  image: "url_or_path"             // If implemented
}

// Backend should transform to:
{
  name: "South Side Hub",
  city: "South District",          // ⬅️ location → city
  address: "123 Main St...",
  email: "office@franchise.com",
  phone: "+1 234 567 8900",
  inchargeName: "John Manager",
  description: "Optional description",
  image: "url_or_path",
  code: "DB-SOU-001",              // ⬅️ Auto-generated
  isActive: true                    // ⬅️ Default value
}
```

---

## 🎯 API Endpoint Specification

### POST /franchises

**Request Body:**
```typescript
interface CreateFranchiseRequest {
  name: string;           // Required
  location: string;       // Required (maps to city)
  address: string;        // Required
  email: string;          // Required
  phone: string;         // Required
  inchargeName: string;  // Required
  description?: string;  // Optional
  image?: string;        // Optional
}
```

**Response:**
```typescript
interface CreateFranchiseResponse {
  data: {
    id: number;
    code: string;
    name: string;
    city: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    inchargeName: string | null;
    description: string | null;
    image: string | null;
    isActive: boolean;
    createdAt: string;  // ISO date string
    updatedAt: string;  // ISO date string
  };
}
```

**Status Codes:**
- `201 Created` - Success
- `400 Bad Request` - Validation error
- `409 Conflict` - Code or email already exists
- `500 Internal Server Error` - Server error

---

## 📊 Summary Checklist

### Database Changes Needed:
- [ ] Add `email` field to Franchise model (String, required)
- [ ] Add `inchargeName` field to Franchise model (String, required)
- [ ] Add `description` field to Franchise model (String?, optional)
- [ ] Add `image` field to Franchise model (String?, optional)
- [ ] Create migration file
- [ ] Consider adding unique constraint on `email` (if emails should be unique)

### API Implementation Needed:
- [ ] Create POST `/franchises` endpoint
- [ ] Add validation middleware (Zod schema)
- [ ] Implement field mapping: `location` → `city`
- [ ] Implement code generation logic
- [ ] Add email uniqueness check (if unique constraint added)
- [ ] Add error handling
- [ ] Add authentication/authorization (only ADMIN should create)

### Validation Needed:
- [ ] Validate all required fields
- [ ] Validate email format
- [ ] Validate phone format
- [ ] Validate string lengths
- [ ] Check code uniqueness
- [ ] Check email uniqueness (if applicable)

---

## 🔍 Additional Considerations

1. **Code Generation:**
   - Frontend generates: `DB-${location.toUpperCase().substring(0, 3)}-${random}`
   - **Recommendation:** Backend should generate codes to ensure uniqueness
   - Format: `DB-{CITY_CODE}-{SEQUENTIAL_NUMBER}` or `DB-{CITY_CODE}-{TIMESTAMP}`

2. **Email Uniqueness:**
   - Should franchise emails be unique? Consider business requirements
   - If yes, add unique constraint in database

3. **Image Upload:**
   - Frontend has placeholder for image upload
   - Currently not implemented
   - **Recommendation:** Store image URL/path in database, handle file upload separately

4. **Status vs isActive:**
   - Frontend uses `status: 'active' | 'blocked'`
   - Database uses `isActive: boolean`
   - **Mapping:** `status === 'active'` → `isActive = true`

5. **Location vs City:**
   - Frontend uses "location" (Region/Area)
   - Database uses "city"
   - **Mapping:** `location` → `city` field

---

## 📝 Example Request/Response

### Request:
```json
POST /franchises
Content-Type: application/json

{
  "name": "South Side Hub",
  "location": "South District",
  "address": "123 Main Street, Downtown, City 12345",
  "email": "southside@drybros.com",
  "phone": "+1 234 567 8900",
  "inchargeName": "John Manager",
  "description": "Primary operations hub for southern region"
}
```

### Response:
```json
{
  "data": {
    "id": 3,
    "code": "DB-SOU-003",
    "name": "South Side Hub",
    "city": "South District",
    "address": "123 Main Street, Downtown, City 12345",
    "phone": "+1 234 567 8900",
    "email": "southside@drybros.com",
    "inchargeName": "John Manager",
    "description": "Primary operations hub for southern region",
    "image": null,
    "isActive": true,
    "createdAt": "2025-01-XXT10:00:00.000Z",
    "updatedAt": "2025-01-XXT10:00:00.000Z"
  }
}
```

---

**Document Created By:** AI Code Reviewer  
**Date:** 2025-01-XX  
**Next Steps:** 
1. Create database migration for new fields
2. Implement POST /franchises endpoint
3. Add validation schema
4. Test API with frontend
