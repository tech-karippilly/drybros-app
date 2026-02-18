import prisma from "../config/prismaClient";
import { AttendanceStatus, UserRole } from "@prisma/client";
import { ClockInDTO, ClockOutDTO } from "../types/attendance.dto";
import logger from "../config/logger";

// ============================================
// CLOCK IN
// ============================================

export async function clockIn(
  input: ClockInDTO,
  userId?: string,
  driverId?: string,
  staffId?: string
) {
  if (!userId && !driverId && !staffId) {
    const error: any = new Error("User identification required");
    error.statusCode = 400;
    throw error;
  }

  // Get today's date (normalized)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if attendance record exists for today
  let attendance = await prisma.attendance.findFirst({
    where: {
      date: today,
      ...(userId && { userId }),
      ...(driverId && { driverId }),
      ...(staffId && { staffId }),
    },
    include: {
      sessions: {
        where: { clockOut: null },
        orderBy: { clockIn: 'desc' },
        take: 1,
      },
    },
  });

  // Check if already clocked in (open session exists)
  if (attendance?.sessions && attendance.sessions.length > 0) {
    const error: any = new Error("Already clocked in. Please clock out first.");
    error.statusCode = 400;
    throw error;
  }

  const now = new Date();

  // If no attendance record for today, create one
  if (!attendance) {
    attendance = await prisma.attendance.create({
      data: {
        date: today,
        ...(userId && { User: { connect: { id: userId } } }),
        ...(driverId && { Driver: { connect: { id: driverId } } }),
        ...(staffId && { Staff: { connect: { id: staffId } } }),
        status: AttendanceStatus.PRESENT,
        firstOnlineAt: now,
        totalOnlineMinutes: 0,
        // totalSessions will be auto-calculated by session count
      },
      include: {
        sessions: true,
      },
    });
  } else {
    // Update firstOnlineAt if this is the first session
    if (!attendance.firstOnlineAt) {
      attendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: { firstOnlineAt: now },
        include: { sessions: true },
      });
    }
  }

  // Create new session
  const session = await prisma.attendanceSession.create({
    data: {
      Attendance: { connect: { id: attendance.id } },
      clockIn: now,
      // Lat/Lng fields may not exist in current schema
      // clockInLat: input.latitude || null,
      // clockInLng: input.longitude || null,
    } as any, // Temp cast until schema verified
  });

  logger.info("Clock-in successful", {
    attendanceId: attendance.id,
    sessionId: session.id,
    userId,
    driverId,
    staffId,
  });

  return {
    success: true,
    message: "Clock-in successful",
    data: {
      attendance,
      session,
    },
  };
}

// ============================================
// CLOCK OUT
// ============================================

export async function clockOut(
  input: ClockOutDTO,
  userId?: string,
  driverId?: string,
  staffId?: string
) {
  if (!userId && !driverId && !staffId) {
    const error: any = new Error("User identification required");
    error.statusCode = 400;
    throw error;
  }

  // Get today's date (normalized)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find attendance record for today
  const attendance = await prisma.attendance.findFirst({
    where: {
      date: today,
      ...(userId && { userId }),
      ...(driverId && { driverId }),
      ...(staffId && { staffId }),
    },
    include: {
      sessions: {
        where: { clockOut: null },
        orderBy: { clockIn: 'desc' },
        take: 1,
      },
    },
  });

  if (!attendance) {
    const error: any = new Error("No attendance record found for today. Please clock in first.");
    error.statusCode = 404;
    throw error;
  }

  // Check for open session
  if (!attendance.sessions || attendance.sessions.length === 0) {
    const error: any = new Error("No open clock-in session found. Please clock in first.");
    error.statusCode = 400;
    throw error;
  }

  const openSession = attendance.sessions[0];
  const now = new Date();

  // Calculate session duration
  const durationMs = now.getTime() - openSession.clockIn.getTime();
  const durationMinutes = Math.floor(durationMs / 60000);

  // Close the session
  const closedSession = await prisma.attendanceSession.update({
    where: { id: openSession.id },
    data: {
      clockOut: now,
      durationMinutes,
      // Lat/Lng fields may not exist in current schema
      // clockOutLat: input.latitude || null,
      // clockOutLng: input.longitude || null,
    } as any, // Temp cast until schema verified
  });

  // Update attendance record
  const updatedAttendance = await prisma.attendance.update({
    where: { id: attendance.id },
    data: {
      lastOfflineAt: now,
      totalOnlineMinutes: {
        increment: durationMinutes,
      },
    },
    include: {
      sessions: true,
    },
  });

  logger.info("Clock-out successful", {
    attendanceId: attendance.id,
    sessionId: closedSession.id,
    durationMinutes,
    userId,
    driverId,
    staffId,
  });

  return {
    success: true,
    message: "Clock-out successful",
    data: {
      attendance: updatedAttendance,
      session: closedSession,
      durationMinutes,
    },
  };
}

// ============================================
// LIST ATTENDANCE (with filters and pagination)
// ============================================

export async function listAttendance(
  filters: {
    userId?: string;
    driverId?: string;
    staffId?: string;
    franchiseId?: string;
    dateFrom?: string;
    dateTo?: string;
    status?: AttendanceStatus;
    page?: number;
    limit?: number;
  },
  userRole: UserRole,
  requesterId: string
) {
  const { page = 1, limit = 10, dateFrom, dateTo, ...restFilters } = filters;
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {};

  // Apply franchise isolation for MANAGER
  if (userRole === UserRole.MANAGER) {
    // Get manager's franchiseId
    const manager = await prisma.user.findUnique({
      where: { id: requesterId },
      select: { franchiseId: true },
    });

    if (manager?.franchiseId) {
      // Apply franchise filter via Driver or Staff relations
      where.OR = [
        { Driver: { franchiseId: manager.franchiseId } },
        { Staff: { franchiseId: manager.franchiseId } },
        { User: { franchiseId: manager.franchiseId } },
      ];
    }
  }

  // Apply date range filters
  if (dateFrom) {
    const fromDate = new Date(dateFrom);
    fromDate.setHours(0, 0, 0, 0);
    where.date = { ...where.date, gte: fromDate };
  }

  if (dateTo) {
    const toDate = new Date(dateTo);
    toDate.setHours(23, 59, 59, 999);
    where.date = { ...where.date, lte: toDate };
  }

  // Apply other filters
  if (restFilters.userId) where.userId = restFilters.userId;
  if (restFilters.driverId) where.driverId = restFilters.driverId;
  if (restFilters.staffId) where.staffId = restFilters.staffId;
  if (restFilters.status) where.status = restFilters.status;

  // Get paginated results
  const [data, total] = await Promise.all([
    prisma.attendance.findMany({
      where,
      skip,
      take: limit,
      orderBy: { date: 'desc' },
      include: {
        Driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            driverCode: true,
          },
        },
        Staff: {
          select: {
            id: true,
            // Only select known fields
          },
        },
        User: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        sessions: {
          orderBy: { clockIn: 'asc' },
        },
      },
    }),
    prisma.attendance.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    success: true,
    message: "Attendance records retrieved successfully",
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
// GET MY ATTENDANCE (own records only)
// ============================================

export async function getMyAttendance(
  userId?: string,
  driverId?: string,
  staffId?: string,
  filters?: {
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }
) {
  if (!userId && !driverId && !staffId) {
    const error: any = new Error("User identification required");
    error.statusCode = 400;
    throw error;
  }

  const { page = 1, limit = 10, dateFrom, dateTo } = filters || {};
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {
    ...(userId && { userId }),
    ...(driverId && { driverId }),
    ...(staffId && { staffId }),
  };

  // Apply date range filters
  if (dateFrom) {
    const fromDate = new Date(dateFrom);
    fromDate.setHours(0, 0, 0, 0);
    where.date = { ...where.date, gte: fromDate };
  }

  if (dateTo) {
    const toDate = new Date(dateTo);
    toDate.setHours(23, 59, 59, 999);
    where.date = { ...where.date, lte: toDate };
  }

  // Get paginated results
  const [data, total] = await Promise.all([
    prisma.attendance.findMany({
      where,
      skip,
      take: limit,
      orderBy: { date: 'desc' },
      include: {
        sessions: {
          orderBy: { clockIn: 'asc' },
        },
      },
    }),
    prisma.attendance.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    success: true,
    message: "Your attendance records retrieved successfully",
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
