# Sample API Implementation: Category Management

This document demonstrates the complete process of creating a new API endpoint in the DryBros backend by implementing a Category management system.

## Step 1: Define the Data Model

First, we need to add our Category model to the Prisma schema:

```prisma
// In prisma/schema.prisma
model Category {
  id          String   @id @default(uuid())
  name        String   @unique
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relationships (if needed)
  // trips         Trip[]
  // products      Product[]
}
```

Then run the Prisma commands to update the database:
```bash
cd backend-api
npx prisma generate
npx prisma db push  # Or create and apply a migration
```

## Step 2: Create DTO Types and Validation Schemas

Create the DTO file with validation schemas:

```typescript
// src/types/category.dto.ts
import { z } from "zod";

// Create Category validation
export const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(100, "Category name must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
});

// Update Category validation
export const updateCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(100, "Category name must be less than 100 characters").optional(),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  isActive: z.boolean().optional(),
});

// Parameter validation
export const categoryParamsSchema = z.object({
  id: z.string().uuid("Invalid category ID format"),
});

// Query validation
export const listCategoriesQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
  isActive: z.enum(["true", "false"]).optional(),
  search: z.string().optional(),
});

export type CreateCategoryDTO = z.infer<typeof createCategorySchema>;
export type UpdateCategoryDTO = z.infer<typeof updateCategorySchema>;

export interface CategoryResponseDTO {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCategoryResponseDTO {
  message: string;
  data: CategoryResponseDTO;
}

export interface UpdateCategoryResponseDTO {
  message: string;
  data: CategoryResponseDTO;
}

export interface DeleteCategoryResponseDTO {
  message: string;
}

export interface PaginatedCategoryResponseDTO {
  data: CategoryResponseDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
```

## Step 3: Create Repository Functions

Create the repository file for database operations:

```typescript
// src/repositories/category.repository.ts
import prisma from "../config/prismaClient";
import { Prisma } from "@prisma/client";

// Get all categories with optional filters
export async function getAllCategories(
  includeInactive: boolean = false,
  search?: string,
  skip?: number,
  take?: number
) {
  return prisma.category.findMany({
    where: {
      isActive: includeInactive ? undefined : true,
      name: search ? { contains: search, mode: 'insensitive' } : undefined,
    },
    orderBy: {
      name: 'asc',
    },
    skip,
    take,
  });
}

// Get categories with pagination
export async function getCategoriesPaginated(
  skip: number,
  limit: number,
  includeInactive: boolean = false,
  search?: string
) {
  const [data, total] = await prisma.$transaction([
    prisma.category.findMany({
      where: {
        isActive: includeInactive ? undefined : true,
        name: search ? { contains: search, mode: 'insensitive' } : undefined,
      },
      orderBy: {
        name: 'asc',
      },
      skip,
      take: limit,
    }),
    prisma.category.count({
      where: {
        isActive: includeInactive ? undefined : true,
        name: search ? { contains: search, mode: 'insensitive' } : undefined,
      },
    }),
  ]);

  return { data, total };
}

// Get category by ID
export async function getCategoryById(id: string) {
  return prisma.category.findUnique({
    where: { id },
  });
}

// Get category by name
export async function getCategoryByName(name: string) {
  return prisma.category.findUnique({
    where: { name },
  });
}

// Create category
export async function createCategory(data: Prisma.CategoryCreateInput) {
  return prisma.category.create({
    data,
  });
}

// Update category
export async function updateCategory(id: string, data: Prisma.CategoryUpdateInput) {
  return prisma.category.update({
    where: { id },
    data,
  });
}

// Soft delete category (deactivate)
export async function deactivateCategory(id: string) {
  return prisma.category.update({
    where: { id },
    data: { isActive: false },
  });
}
```

## Step 4: Create Service Functions

Create the service file containing business logic:

```typescript
// src/services/category.service.ts
import {
  getAllCategories,
  getCategoriesPaginated,
  getCategoryById,
  getCategoryByName,
  createCategory,
  updateCategory,
  deactivateCategory
} from "../repositories/category.repository";
import { 
  CreateCategoryDTO, 
  UpdateCategoryDTO, 
  CategoryResponseDTO,
  CreateCategoryResponseDTO,
  UpdateCategoryResponseDTO,
  DeleteCategoryResponseDTO,
  PaginatedCategoryResponseDTO
} from "../types/category.dto";
import { NotFoundError, ConflictError, BadRequestError } from "../utils/errors";
import { ERROR_MESSAGES } from "../constants/errors";
import logger from "../config/logger";
import { logActivity } from "./activity.service";
import { ActivityAction, ActivityEntityType } from "@prisma/client";

// Map category to response format
function mapCategoryToResponse(category: any): CategoryResponseDTO {
  return {
    id: category.id,
    name: category.name,
    description: category.description,
    isActive: category.isActive,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
}

// List categories with optional pagination
export async function listCategories(
  includeInactive: boolean = false,
  search?: string,
  pagination?: { page?: number; limit?: number }
): Promise<CategoryResponseDTO[] | PaginatedCategoryResponseDTO> {
  
  if (pagination && (pagination.page || pagination.limit)) {
    const page = pagination.page ? parseInt(String(pagination.page), 10) : 1;
    const limit = pagination.limit ? parseInt(String(pagination.limit), 10) : 10;
    const skip = (page - 1) * limit;

    const { data, total } = await getCategoriesPaginated(skip, limit, includeInactive, search);
    
    const totalPages = total > 0 ? Math.ceil(total / limit) : 0;
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      data: data.map(mapCategoryToResponse),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
    };
  }

  // Non-paginated response
  const categories = await getAllCategories(includeInactive, search);
  return categories.map(mapCategoryToResponse);
}

// Get single category
export async function getCategory(id: string) {
  const category = await getCategoryById(id);
  if (!category) {
    throw new NotFoundError(ERROR_MESSAGES.CATEGORY_NOT_FOUND);
  }
  return mapCategoryToResponse(category);
}

// Create category
export async function createCategoryService(input: CreateCategoryDTO) {
  // Check if category with same name already exists
  const existingCategory = await getCategoryByName(input.name);
  if (existingCategory) {
    throw new ConflictError(`Category with name "${input.name}" already exists`);
  }

  const category = await createCategory({
    name: input.name,
    description: input.description,
    isActive: true, // New categories are active by default
  });

  logger.info("Category created successfully", {
    categoryId: category.id,
    categoryName: category.name,
  });

  // Log category creation activity
  logActivity({
    action: ActivityAction.CATEGORY_CREATED,
    entityType: ActivityEntityType.CATEGORY,
    entityId: category.id,
    description: `Category "${category.name}" created`,
    metadata: {
      categoryName: category.name,
      description: category.description,
    },
  });

  return {
    message: "Category created successfully",
    data: mapCategoryToResponse(category),
  } as CreateCategoryResponseDTO;
}

// Update category
export async function updateCategoryService(id: string, input: UpdateCategoryDTO) {
  // Check if category exists
  const existingCategory = await getCategoryById(id);
  if (!existingCategory) {
    throw new NotFoundError(ERROR_MESSAGES.CATEGORY_NOT_FOUND);
  }

  // Check if name is being updated and if new name already exists
  if (input.name && input.name !== existingCategory.name) {
    const duplicateCategory = await getCategoryByName(input.name);
    if (duplicateCategory) {
      throw new ConflictError(`Category with name "${input.name}" already exists`);
    }
  }

  // Prepare update data
  const updateData: any = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.isActive !== undefined) updateData.isActive = input.isActive;

  const updatedCategory = await updateCategory(id, updateData);

  logger.info("Category updated successfully", {
    categoryId: id,
    updatedFields: Object.keys(input),
  });

  // Log category update activity
  logActivity({
    action: ActivityAction.CATEGORY_UPDATED,
    entityType: ActivityEntityType.CATEGORY,
    entityId: id,
    description: `Category "${updatedCategory.name}" updated`,
    metadata: {
      categoryName: updatedCategory.name,
      updatedFields: Object.keys(input),
    },
  });

  return {
    message: "Category updated successfully",
    data: mapCategoryToResponse(updatedCategory),
  } as UpdateCategoryResponseDTO;
}

// Delete category (soft delete)
export async function deleteCategoryService(id: string) {
  // Check if category exists
  const existingCategory = await getCategoryById(id);
  if (!existingCategory) {
    throw new NotFoundError(ERROR_MESSAGES.CATEGORY_NOT_FOUND);
  }

  // Check if already deleted
  if (!existingCategory.isActive) {
    throw new BadRequestError("Category is already deleted");
  }

  // Deactivate category
  await deactivateCategory(id);

  logger.info("Category deleted successfully", {
    categoryId: id,
    categoryName: existingCategory.name,
  });

  // Log category deletion activity
  logActivity({
    action: ActivityAction.CATEGORY_DELETED,
    entityType: ActivityEntityType.CATEGORY,
    entityId: id,
    description: `Category "${existingCategory.name}" deleted`,
    metadata: {
      categoryName: existingCategory.name,
    },
  });

  return {
    message: "Category deleted successfully",
  } as DeleteCategoryResponseDTO;
}
```

## Step 5: Create Controller Functions

Create the controller file for handling HTTP requests:

```typescript
// src/controllers/category.controller.ts
import { Request, Response, NextFunction } from "express";
import {
  listCategories,
  getCategory,
  createCategoryService,
  updateCategoryService,
  deleteCategoryService
} from "../services/category.service";

// Get all categories
export async function getCategories(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const includeInactive = req.query.includeInactive === "true";
    const search = req.query.search as string | undefined;
    
    // Check if pagination parameters are provided
    const validatedQuery = (req as any).validatedQuery;
    if (validatedQuery && (validatedQuery.page || validatedQuery.limit)) {
      const result = await listCategories(
        includeInactive,
        search,
        { page: validatedQuery.page, limit: validatedQuery.limit }
      );
      
      res.json({
        success: true,
        message: "Categories retrieved successfully",
        ...result
      });
    } else {
      // Backward compatibility: return all categories if no pagination params
      const data = await listCategories(includeInactive, search);
      res.json({ 
        success: true, 
        message: "Categories retrieved successfully", 
        data 
      });
    }
  } catch (err) {
    next(err);
  }
}

// Get single category by ID
export async function getCategoryById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id as string;
    const category = await getCategory(id);
    res.json({ data: category });
  } catch (err) {
    next(err);
  }
}

// Create new category
export async function createCategoryHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const createdBy = req.user?.userId;
    const result = await createCategoryService(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

// Update category
export async function updateCategoryHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id as string;
    const result = await updateCategoryService(id, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

// Delete category
export async function deleteCategoryHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id as string;
    const result = await deleteCategoryService(id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
```

## Step 6: Create Route Definitions

Create the route file to define API endpoints:

```typescript
// src/routes/category.routes.ts
import express from "express";
import {
  getCategories,
  getCategoryById,
  createCategoryHandler,
  updateCategoryHandler,
  deleteCategoryHandler
} from "../controllers/category.controller";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { UserRole } from "@prisma/client";
import { validate, validateParams, validateQuery } from "../middlewares/validation";
import {
  createCategorySchema,
  updateCategorySchema,
  categoryParamsSchema,
  listCategoriesQuerySchema
} from "../types/category.dto";
import { z } from "zod";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// GET /categories (with optional pagination and filters)
router.get(
  "/",
  validateQuery(listCategoriesQuerySchema),
  getCategories
);

// GET /categories/:id
router.get(
  "/:id",
  validateParams(categoryParamsSchema),
  getCategoryById
);

// POST /categories (only certain roles can create)
router.post(
  "/",
  requireRole(UserRole.ADMIN, UserRole.MANAGER),
  validate(createCategorySchema),
  createCategoryHandler
);

// PATCH /categories/:id (only certain roles can update)
router.patch(
  "/:id",
  requireRole(UserRole.ADMIN, UserRole.MANAGER),
  validateParams(categoryParamsSchema),
  validate(updateCategorySchema),
  updateCategoryHandler
);

// DELETE /categories/:id (only ADMIN can delete)
router.delete(
  "/:id",
  requireRole(UserRole.ADMIN),
  validateParams(categoryParamsSchema),
  deleteCategoryHandler
);

export default router;
```

## Step 7: Register Routes in Main Application

Add the route import and registration to the main application file:

```typescript
// In src/index.ts
import categoryRoutes from "./routes/category.routes";


app.use("/api/categories", categoryRoutes);
```

## Step 8: Testing the API

Once implemented, test your API using:

### Create a Category
```bash
curl -X POST http://localhost:4000/api/categories \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Services",
    "description": "Premium service offerings"
  }'
```

### Get All Categories
```bash
curl -X GET "http://localhost:4000/api/categories?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update a Category
```bash
curl -X PATCH http://localhost:4000/api/categories/CATEGORY_ID_HERE \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Services Updated",
    "description": "Updated premium service offerings"
  }'
```

### Delete a Category
```bash
curl -X DELETE http://localhost:4000/api/categories/CATEGORY_ID_HERE \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Key Points to Remember

1. **Always use validation schemas** to validate incoming data
2. **Implement proper error handling** and return appropriate HTTP status codes
3. **Use role-based access control** to protect sensitive operations
4. **Log activities** for audit trails
5. **Follow consistent response formats**
6. **Implement soft deletes** when appropriate
7. **Handle pagination** for list endpoints
8. **Validate unique constraints** at the service layer
9. **Use proper TypeScript types** throughout the stack
10. **Test thoroughly** with various scenarios

This example demonstrates the complete process of creating a new API in the DryBros backend, following all the established patterns and best practices used throughout the project.