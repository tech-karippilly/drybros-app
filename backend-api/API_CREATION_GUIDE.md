# API Creation Guide for DryBros Backend

This guide explains how to create new APIs in the DryBros backend following the established patterns and best practices.

## 1. API Structure Overview

The backend follows a structured MVC-like pattern with the following layers:

- **Routes Layer** (`/src/routes/`): Defines API endpoints and handles routing
- **Controller Layer** (`/src/controllers/`): Handles HTTP request/response logic
- **Service Layer** (`/src/services/`): Contains business logic
- **Repository Layer** (`/src/repositories/`): Handles database operations
- **DTO Types** (`/src/types/`): Type definitions and validation schemas
- **Middlewares** (`/src/middlewares/`): Authentication, validation, etc.

## 2. Step-by-Step API Creation Process

### Step 1: Define Your Data Model (if needed)

First, if you need a new database entity, add it to the Prisma schema:

```prisma
// In prisma/schema.prisma
model YourEntity {
  id          String   @id @default(uuid())
  name        String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  // Add other fields as needed
}
```

Then run:
```bash
cd backend-api
npx prisma db pull  # If you're connecting to an existing DB
npx prisma generate # Generate Prisma client
```

### Step 2: Create DTO Types and Validation Schemas

Create a DTO file in `/src/types/`:

```typescript
// src/types/your-entity.dto.ts
import { z } from "zod";

// Request body validation
export const createYourEntitySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

export const updateYourEntitySchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().optional(),
});

// Parameter validation (for route params like /api/your-entities/:id)
export const yourEntityParamsSchema = z.object({
  id: z.string().uuid("Invalid ID format"),
});

// Query validation (for query params like /api/your-entities?active=true)
export const yourEntityQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
  active: z.enum(["true", "false"]).optional(),
});

// Response types
export type CreateYourEntityDTO = z.infer<typeof createYourEntitySchema>;
export type UpdateYourEntityDTO = z.infer<typeof updateYourEntitySchema>;

export interface YourEntityResponseDTO {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateYourEntityResponseDTO {
  message: string;
  data: YourEntityResponseDTO;
}
```

### Step 3: Create Repository Functions

Create a repository file in `/src/repositories/`:

```typescript
// src/repositories/your-entity.repository.ts
import prisma from "../config/prismaClient";
import { Prisma } from "@prisma/client";

// Get all entities
export async function getAllYourEntities(includeInactive: boolean = false) {
  return prisma.yourEntity.findMany({
    where: {
      isActive: includeInactive ? undefined : true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

// Get entity by ID
export async function getYourEntityById(id: string) {
  return prisma.yourEntity.findUnique({
    where: { id },
  });
}

// Create entity
export async function createYourEntity(data: Prisma.YourEntityCreateInput) {
  return prisma.yourEntity.create({
    data,
  });
}

// Update entity
export async function updateYourEntity(id: string, data: Prisma.YourEntityUpdateInput) {
  return prisma.yourEntity.update({
    where: { id },
    data,
  });
}

// Soft delete (mark as inactive)
export async function softDeleteYourEntity(id: string) {
  return prisma.yourEntity.update({
    where: { id },
    data: { isActive: false }, // assuming you have an isActive field
  });
}

// Other custom queries as needed...
```

### Step 4: Create Service Functions

Create a service file in `/src/services/`:

```typescript
// src/services/your-entity.service.ts
import {
  getAllYourEntities,
  getYourEntityById,
  createYourEntity,
  updateYourEntity,
  softDeleteYourEntity
} from "../repositories/your-entity.repository";
import { CreateYourEntityDTO, UpdateYourEntityDTO, YourEntityResponseDTO } from "../types/your-entity.dto";
import { NotFoundError, ConflictError } from "../utils/errors";
import { ERROR_MESSAGES } from "../constants/errors";

// Map database entity to response format
function mapYourEntityToResponse(entity: any): YourEntityResponseDTO {
  return {
    id: entity.id,
    name: entity.name,
    description: entity.description,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}

// Service function to get all entities
export async function listYourEntities(includeInactive: boolean = false) {
  const entities = await getAllYourEntities(includeInactive);
  return entities.map(mapYourEntityToResponse);
}

// Service function to get single entity
export async function getYourEntity(id: string) {
  const entity = await getYourEntityById(id);
  if (!entity) {
    throw new NotFoundError(ERROR_MESSAGES.ENTITY_NOT_FOUND);
  }
  return mapYourEntityToResponse(entity);
}

// Service function to create entity
export async function createYourEntityService(input: CreateYourEntityDTO) {
  // Add any business logic here (validation, calculations, etc.)
  
  const entity = await createYourEntity({
    name: input.name,
    description: input.description,
    // Add other fields as needed
  });

  return {
    message: "Entity created successfully",
    data: mapYourEntityToResponse(entity),
  };
}

// Service function to update entity
export async function updateYourEntityService(id: string, input: UpdateYourEntityDTO) {
  // Check if entity exists
  const existingEntity = await getYourEntityById(id);
  if (!existingEntity) {
    throw new NotFoundError(ERROR_MESSAGES.ENTITY_NOT_FOUND);
  }

  // Perform update
  const updatedEntity = await updateYourEntity(id, {
    name: input.name,
    description: input.description,
    // Add other fields as needed
  });

  return {
    message: "Entity updated successfully",
    data: mapYourEntityToResponse(updatedEntity),
  };
}

// Service function to delete entity
export async function deleteYourEntityService(id: string) {
  // Check if entity exists
  const existingEntity = await getYourEntityById(id);
  if (!existingEntity) {
    throw new NotFoundError(ERROR_MESSAGES.ENTITY_NOT_FOUND);
  }

  // Perform soft delete
  await softDeleteYourEntity(id);

  return {
    message: "Entity deleted successfully",
  };
}
```

### Step 5: Create Controller Functions

Create a controller file in `/src/controllers/`:

```typescript
// src/controllers/your-entity.controller.ts
import { Request, Response, NextFunction } from "express";
import {
  listYourEntities,
  getYourEntity,
  createYourEntityService,
  updateYourEntityService,
  deleteYourEntityService
} from "../services/your-entity.service";

// Controller function to get all entities
export async function getYourEntities(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const includeInactive = req.query.includeInactive === "true";
    const entities = await listYourEntities(includeInactive);
    res.json({ 
      success: true, 
      message: "Entities retrieved successfully", 
      data: entities 
    });
  } catch (err) {
    next(err);
  }
}

// Controller function to get single entity
export async function getYourEntityById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id as string;
    const entity = await getYourEntity(id);
    res.json({ data: entity });
  } catch (err) {
    next(err);
  }
}

// Controller function to create entity
export async function createYourEntityHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await createYourEntityService(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

// Controller function to update entity
export async function updateYourEntityHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id as string;
    const result = await updateYourEntityService(id, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

// Controller function to delete entity
export async function deleteYourEntityHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id as string;
    const result = await deleteYourEntityService(id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
```

### Step 6: Create Route Definitions

Create a route file in `/src/routes/`:

```typescript
// src/routes/your-entity.routes.ts
import express from "express";
import {
  getYourEntities,
  getYourEntityById,
  createYourEntityHandler,
  updateYourEntityHandler,
  deleteYourEntityHandler
} from "../controllers/your-entity.controller";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { UserRole } from "@prisma/client";
import { validate, validateParams, validateQuery } from "../middlewares/validation";
import {
  createYourEntitySchema,
  updateYourEntitySchema,
  yourEntityParamsSchema,
  yourEntityQuerySchema
} from "../types/your-entity.dto";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// GET /your-entities (with optional query parameters)
router.get(
  "/",
  validateQuery(yourEntityQuerySchema),
  getYourEntities
);

// GET /your-entities/:id
router.get(
  "/:id",
  validateParams(yourEntityParamsSchema),
  getYourEntityById
);

// POST /your-entities (only certain roles can create)
router.post(
  "/",
  requireRole(UserRole.ADMIN, UserRole.MANAGER),
  validate(createYourEntitySchema),
  createYourEntityHandler
);

// PATCH /your-entities/:id (only certain roles can update)
router.patch(
  "/:id",
  requireRole(UserRole.ADMIN, UserRole.MANAGER),
  validateParams(yourEntityParamsSchema),
  validate(updateYourEntitySchema),
  updateYourEntityHandler
);

// DELETE /your-entities/:id (only certain roles can delete)
router.delete(
  "/:id",
  requireRole(UserRole.ADMIN),
  validateParams(yourEntityParamsSchema),
  deleteYourEntityHandler
);

export default router;
```

### Step 7: Register Routes in Main Application

Add your new routes to the main application file (`src/index.ts`):

```typescript
// In src/index.ts, add your route import and registration
import yourEntityRoutes from "./routes/your-entity.routes";


app.use("/api/your-entities", yourEntityRoutes);
```

## 3. Best Practices

### Security
- Always use authentication middleware for protected routes
- Use role-based access control with `requireRole()` middleware
- Validate all inputs using Zod schemas
- Never expose sensitive information in error messages

### Error Handling
- Use custom error classes (NotFoundError, ConflictError, etc.)
- Always pass errors to the `next()` function for centralized error handling
- Return appropriate HTTP status codes

### Validation
- Use Zod for input validation
- Validate route parameters, query parameters, and request bodies separately
- Provide clear error messages for validation failures

### Response Format
- Consistent response format with `success`, `message`, and `data` properties
- Use appropriate HTTP status codes (200, 201, 400, 404, 500, etc.)

## 4. Example: Complete Simple API

Here's a complete example of a simple "Category" API:

**Types** (`src/types/category.dto.ts`):
```typescript
import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").optional(),
  description: z.string().optional(),
});

export const categoryParamsSchema = z.object({
  id: z.string().uuid("Invalid category ID format"),
});

export type CreateCategoryDTO = z.infer<typeof createCategorySchema>;
export type UpdateCategoryDTO = z.infer<typeof updateCategorySchema>;

export interface CategoryResponseDTO {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Repository** (`src/repositories/category.repository.ts`):
```typescript
import prisma from "../config/prismaClient";
import { Prisma } from "@prisma/client";

export async function getAllCategories() {
  return prisma.category.findMany({
    orderBy: { name: 'asc' },
  });
}

export async function getCategoryById(id: string) {
  return prisma.category.findUnique({ where: { id } });
}

export async function createCategory(data: Prisma.CategoryCreateInput) {
  return prisma.category.create({ data });
}

export async function updateCategory(id: string, data: Prisma.CategoryUpdateInput) {
  return prisma.category.update({ where: { id }, data });
}

export async function deleteCategory(id: string) {
  return prisma.category.delete({ where: { id } });
}
```

## 5. Testing Your API

After creating your API, test it using:
- Postman or Insomnia
- curl commands
- The built-in Swagger documentation (if configured)
- Automated tests in the `__tests__` folder

Remember to restart your server after making changes to route files or adding new imports.

This guide covers the essential steps for creating APIs in the DryBros backend. Following these patterns ensures consistency and maintainability across the application.