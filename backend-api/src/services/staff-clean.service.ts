import prisma from "../config/prismaClient";
import { UserRole } from "@prisma/client";
import * as bcrypt from "bcryptjs"; // Use bcryptjs instead
import {
  CreateStaffDTO,
  UpdateStaffDTO,
  UpdateStaffStatusDTO,
  StaffStatus,
} from "../types/staff.dto";
import logger from "../config/logger";

// Warning threshold (configurable)
const WARNING_THRESHOLD = 3;

// ============================================
// CREATE STAFF
// ============================================

export async function createStaff(
  input: CreateStaffDTO,
  creatorId: string,
  creatorRole: UserRole
) {
  // Determine franchiseId based on role
  let franchiseId: string;

  if (creatorRole === UserRole.ADMIN) {
    if (!input.franchiseId) {
      const error: any = new Error("franchiseId is required for ADMIN");
      error.statusCode = 400;
      throw error;
    }
    franchiseId = input.franchiseId;
  } else if (creatorRole === UserRole.MANAGER) {
    // Get manager's franchiseId
    const manager = await prisma.user.findUnique({
      where: { id: creatorId },
      select: { franchiseId: true },
    });

    if (!manager?.franchiseId) {
      const error: any = new Error("Manager must belong to a franchise");
      error.statusCode = 400;
      throw error;
    }

    franchiseId = manager.franchiseId;
  } else {
    const error: any = new Error("Unauthorized to create staff");
    error.statusCode = 403;
    throw error;
  }

  // Validate franchise is not BLOCKED
  const franchise = await prisma.franchise.findUnique({
    where: { id: franchiseId },
    select: { status: true },
  });

  if (!franchise) {
    const error: any = new Error("Franchise not found");
    error.statusCode = 404;
    throw error;
  }

  if (franchise.status === "BLOCKED") {
    const error: any = new Error("Cannot create staff for a blocked franchise");
    error.statusCode = 400;
    throw error;
  }

  // Check email uniqueness
  const existingEmail = await prisma.staff.findFirst({
    where: { email: input.email },
  });

  if (existingEmail) {
    const error: any = new Error("Email already exists");
    error.statusCode = 400;
    throw error;
  }

  // Check phone uniqueness
  const existingPhone = await prisma.staff.findFirst({
    where: { phone: input.phone },
  });

  if (existingPhone) {
    const error: any = new Error("Phone number already exists");
    error.statusCode = 400;
    throw error;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(input.password, 10);

  // Create staff
  const staff = await prisma.staff.create({
    data: {
      Franchise: { connect: { id: franchiseId } },
      name: input.name,
      phone: input.phone,
      email: input.email,
      password: hashedPassword,
      monthlySalary: input.monthlySalary,
      address: input.address || null,
      emergencyContact: input.emergencyContact || null,
      emergencyContactRelation: input.emergencyContactRelation || null,
      // role: input.role as any, // If Staff has role field
      status: StaffStatus.ACTIVE as any,
      warningCount: 0,
      complaintCount: 0,
      isActive: true,
    } as any, // Temp cast until schema verified
    include: {
      Franchise: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  logger.info("Staff created successfully", {
    staffId: staff.id,
    franchiseId,
    creatorId,
  });

  return {
    success: true,
    message: "Staff created successfully",
    data: staff,
  };
}

// ============================================
// LIST STAFF
// ============================================

export async function listStaff(
  filters: {
    franchiseId?: string;
    status?: StaffStatus;
    search?: string;
    page?: number;
    limit?: number;
  },
  userRole: UserRole,
  userId: string
) {
  const { page = 1, limit = 10, search, ...restFilters } = filters;
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {};

  // Apply franchise isolation for MANAGER
  if (userRole === UserRole.MANAGER) {
    const manager = await prisma.user.findUnique({
      where: { id: userId },
      select: { franchiseId: true },
    });

    if (manager?.franchiseId) {
      where.franchiseId = manager.franchiseId;
    }
  }

  // Apply filters
  if (restFilters.franchiseId) where.franchiseId = restFilters.franchiseId;
  if (restFilters.status) where.status = restFilters.status;

  // Search by name or phone
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
    ];
  }

  // Get paginated results
  const [data, total] = await Promise.all([
    prisma.staff.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        Franchise: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
    prisma.staff.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    success: true,
    message: "Staff list retrieved successfully",
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

// ============================================
// GET STAFF BY ID
// ============================================

export async function getStaffById(
  staffId: string,
  userRole: UserRole,
  userId: string
) {
  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    include: {
      Franchise: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!staff) {
    const error: any = new Error("Staff not found");
    error.statusCode = 404;
    throw error;
  }

  // Validate franchise access for MANAGER
  if (userRole === UserRole.MANAGER) {
    const manager = await prisma.user.findUnique({
      where: { id: userId },
      select: { franchiseId: true },
    });

    if (manager?.franchiseId !== staff.franchiseId) {
      const error: any = new Error("Cannot access staff from another franchise");
      error.statusCode = 403;
      throw error;
    }
  }

  // Get attendance summary (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const attendanceRecords = await prisma.attendance.findMany({
    where: {
      staffId: staff.id,
      date: {
        gte: thirtyDaysAgo,
      },
    },
    select: {
      status: true,
    },
  });

  const presentDays = attendanceRecords.filter(
    (a) => a.status === "PRESENT" || a.status === "PARTIAL"
  ).length;

  const attendanceSummary = {
    totalDays: 30,
    presentDays,
    attendancePercentage: (presentDays / 30) * 100,
  };

  return {
    success: true,
    message: "Staff details retrieved successfully",
    data: {
      ...staff,
      attendanceSummary,
    },
  };
}

// ============================================
// UPDATE STAFF
// ============================================

export async function updateStaff(
  staffId: string,
  input: UpdateStaffDTO,
  userRole: UserRole,
  userId: string
) {
  // Get staff
  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    select: { id: true, franchiseId: true },
  });

  if (!staff) {
    const error: any = new Error("Staff not found");
    error.statusCode = 404;
    throw error;
  }

  // Validate franchise access for MANAGER
  if (userRole === UserRole.MANAGER) {
    const manager = await prisma.user.findUnique({
      where: { id: userId },
      select: { franchiseId: true },
    });

    if (manager?.franchiseId !== staff.franchiseId) {
      const error: any = new Error("Cannot update staff from another franchise");
      error.statusCode = 403;
      throw error;
    }
  }

  // Update staff
  const updatedStaff = await prisma.staff.update({
    where: { id: staffId },
    data: {
      ...(input.name && { name: input.name }),
      ...(input.monthlySalary !== undefined && { monthlySalary: input.monthlySalary }),
      ...(input.address !== undefined && { address: input.address }),
      ...(input.emergencyContact !== undefined && { emergencyContact: input.emergencyContact }),
      ...(input.emergencyContactRelation !== undefined && { 
        emergencyContactRelation: input.emergencyContactRelation 
      }),
      ...(input.profilePic !== undefined && { profilePic: input.profilePic }),
    },
    include: {
      Franchise: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  logger.info("Staff updated successfully", {
    staffId,
    updatedBy: userId,
  });

  return {
    success: true,
    message: "Staff updated successfully",
    data: updatedStaff,
  };
}

// ============================================
// UPDATE STAFF STATUS
// ============================================

export async function updateStaffStatus(
  staffId: string,
  input: UpdateStaffStatusDTO,
  userRole: UserRole,
  userId: string
) {
  // Get staff
  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    select: { id: true, franchiseId: true, status: true },
  });

  if (!staff) {
    const error: any = new Error("Staff not found");
    error.statusCode = 404;
    throw error;
  }

  // Validate franchise access for MANAGER
  if (userRole === UserRole.MANAGER) {
    const manager = await prisma.user.findUnique({
      where: { id: userId },
      select: { franchiseId: true },
    });

    if (manager?.franchiseId !== staff.franchiseId) {
      const error: any = new Error("Cannot update staff status from another franchise");
      error.statusCode = 403;
      throw error;
    }
  }

  // Update status
  const updateData: any = {
    status: input.status as any,
  };

  // Handle suspended status with expiry
  if (input.status === StaffStatus.SUSPENDED && input.suspendedUntil) {
    updateData.suspendedUntil = new Date(input.suspendedUntil);
  } else {
    updateData.suspendedUntil = null;
  }

  const updatedStaff = await prisma.staff.update({
    where: { id: staffId },
    data: updateData,
    include: {
      Franchise: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  logger.info("Staff status updated", {
    staffId,
    oldStatus: staff.status,
    newStatus: input.status,
    updatedBy: userId,
  });

  return {
    success: true,
    message: `Staff status updated to ${input.status}`,
    data: updatedStaff,
  };
}

// ============================================
// GET MY PROFILE (for STAFF role)
// ============================================

export async function getMyProfile(staffId: string) {
  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    select: {
      id: true,
      franchiseId: true,
      name: true,
      phone: true,
      email: true,
      address: true,
      emergencyContact: true,
      emergencyContactRelation: true,
      profilePic: true,
      // role: true, // If Staff has role field
      status: true,
      warningCount: true,
      // complaintCount field may not exist in current schema
      createdAt: true,
      // Note: monthlySalary is excluded from self-view
    },
  });

  if (!staff) {
    const error: any = new Error("Staff not found");
    error.statusCode = 404;
    throw error;
  }

  // Get attendance summary (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const attendanceRecords = await prisma.attendance.findMany({
    where: {
      staffId: staff.id,
      date: {
        gte: thirtyDaysAgo,
      },
    },
    select: {
      status: true,
    },
  });

  const presentDays = attendanceRecords.filter(
    (a) => a.status === "PRESENT" || a.status === "PARTIAL"
  ).length;

  const attendanceSummary = {
    totalDays: 30,
    presentDays,
    attendancePercentage: (presentDays / 30) * 100,
  };

  return {
    success: true,
    message: "Profile retrieved successfully",
    data: {
      ...staff,
      complaintCount: 0, // Placeholder until schema verified
      attendanceSummary,
    },
  };
}

// ============================================
// INCREMENT WARNING COUNT (called from complaint resolution)
// ============================================

export async function incrementWarningCount(staffId: string) {
  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    select: { id: true, warningCount: true },
  });

  if (!staff) {
    logger.error(`Staff ${staffId} not found for warning increment`);
    return;
  }

  const newWarningCount = staff.warningCount + 1;

  // Update warning count
  await prisma.staff.update({
    where: { id: staffId },
    data: { warningCount: newWarningCount },
  });

  // Auto-fire if threshold reached
  if (newWarningCount >= WARNING_THRESHOLD) {
    await prisma.staff.update({
      where: { id: staffId },
      data: { status: StaffStatus.FIRED as any },
    });

    logger.warn(`Staff ${staffId} auto-fired after ${newWarningCount} warnings`);
  }

  logger.info(`Staff ${staffId} warning count incremented to ${newWarningCount}`);
}

// ============================================
// INCREMENT COMPLAINT COUNT (called when complaint is created)
// ============================================

export async function incrementComplaintCount(staffId: string) {
  // complaintCount field may not exist in current schema
  // Use raw SQL or skip until schema is updated
  try {
    await prisma.$executeRaw`
      UPDATE "Staff"
      SET "complaintCount" = COALESCE("complaintCount", 0) + 1
      WHERE id = ${staffId}::uuid
    `;
    logger.info(`Staff ${staffId} complaint count incremented`);
  } catch (error) {
    logger.error(`Failed to increment complaint count for staff ${staffId}`, { error });
  }
}
