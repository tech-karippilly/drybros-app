// src/services/attendance.service.ts
import {
  createAttendance,
  getAttendanceById,
  getAttendanceByDateAndPerson,
  getAttendancesPaginated,
  getAllAttendances,
  upsertAttendance,
  updateAttendance,
  deleteAttendance,
  getOpenAttendanceSession,
  createAttendanceSession,
  closeAttendanceSession,
} from "../repositories/attendance.repository";
import { getDriverById } from "../repositories/driver.repository";
import { getStaffById } from "../repositories/staff.repository";
import prisma from "../config/prismaClient";
import {
  ClockInDTO,
  ClockOutDTO,
  AttendanceResponseDTO,
  ClockAttendanceResponseDTO,
  AttendancePaginationQueryDTO,
  PaginatedAttendanceResponseDTO,
  CreateAttendanceDTO,
  UpdateAttendanceDTO,
  UpdateAttendanceStatusDTO,
} from "../types/attendance.dto";
import { NotFoundError, BadRequestError } from "../utils/errors";
import { ATTENDANCE_ERROR_MESSAGES, ATTENDANCE_ACTIVITY_DESCRIPTIONS } from "../constants/attendance";
import logger from "../config/logger";
import { logActivity } from "./activity.service";
import { ActivityAction, ActivityEntityType, UserRole } from "@prisma/client";

function mapAttendanceToResponse(attendance: any): AttendanceResponseDTO {
  return {
    id: attendance.id,
    driverId: attendance.driverId,
    staffId: attendance.staffId,
    userId: attendance.userId,
    date: attendance.date,
    loginTime: attendance.loginTime,
    clockIn: attendance.clockIn,
    clockOut: attendance.clockOut,
    status: attendance.status,
    notes: attendance.notes,
    sessions: (attendance.sessions ?? []).map((s: any) => ({
      id: s.id,
      clockIn: s.clockIn,
      clockOut: s.clockOut ?? null,
      notes: s.notes ?? null,
    })),
    createdAt: attendance.createdAt,
    updatedAt: attendance.updatedAt,
  };
}

function mapAttendanceToClockResponse(attendance: any): ClockAttendanceResponseDTO {
  const base: ClockAttendanceResponseDTO = {
    id: attendance.id,
    date: attendance.date,
    loginTime: attendance.loginTime ?? null,
    clockIn: attendance.clockIn ?? null,
    clockOut: attendance.clockOut ?? null,
    status: attendance.status,
  };

  // Include only the relevant id (and omit null ids)
  if (attendance.driverId) return { ...base, driverId: attendance.driverId };
  if (attendance.staffId) return { ...base, staffId: attendance.staffId };
  if (attendance.userId) return { ...base, userId: attendance.userId };

  // Fallback (should not happen, but keep response stable)
  return base;
}

/**
 * Track login time for staff, manager, or driver
 */
export async function trackLogin(
  driverId?: string,
  staffId?: string,
  userId?: string
): Promise<void> {
  if (!driverId && !staffId && !userId) {
    throw new BadRequestError(ATTENDANCE_ERROR_MESSAGES.INVALID_ATTENDANCE_TYPE);
  }

  // Verify entity exists
  if (driverId) {
    const driver = await getDriverById(driverId);
    if (!driver) {
      throw new NotFoundError(ATTENDANCE_ERROR_MESSAGES.DRIVER_NOT_FOUND);
    }
  } else if (staffId) {
    const staff = await getStaffById(staffId);
    if (!staff) {
      throw new NotFoundError(ATTENDANCE_ERROR_MESSAGES.STAFF_NOT_FOUND);
    }
  } else if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, franchiseId: true },
    });
    if (!user) {
      throw new NotFoundError("User not found");
    }
    // Only track login for MANAGER role
    if (user.role !== UserRole.MANAGER) {
      return; // Don't track login for other user roles
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Upsert attendance record with login time
  await upsertAttendance({
    driverId,
    staffId,
    userId,
    date: today,
    loginTime: new Date(),
  });

  logger.info("Login time recorded", {
    driverId,
    staffId,
    userId,
  });
}

export async function clockIn(
  input: ClockInDTO
): Promise<{ message: string; data: ClockAttendanceResponseDTO }> {
  const { id } = input;

  // Check if ID belongs to driver, staff, or user (manager) - check all in parallel
  const [driver, staff, user] = await Promise.all([
    getDriverById(id),
    getStaffById(id),
    prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, franchiseId: true, fullName: true },
    }),
  ]);

  // Determine entity type
  let driverId: string | undefined;
  let staffId: string | undefined;
  let userId: string | undefined;
  let entityType: "driver" | "staff" | "manager" | null = null;

  if (driver) {
    driverId = id;
    entityType = "driver";
  } else if (staff) {
    staffId = id;
    entityType = "staff";
  } else if (user) {
    // Only allow MANAGER role for clock-in
    if (user.role !== UserRole.MANAGER) {
      throw new BadRequestError("Only managers can clock in. Drivers and staff should use their respective IDs.");
    }
    userId = id;
    entityType = "manager";
  } else {
    throw new NotFoundError("ID not found in drivers, staff, or managers");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get (or create) today's attendance header
  const existing = await getAttendanceByDateAndPerson(
    today,
    driverId,
    staffId,
    userId
  );

  const attendanceHeader =
    existing ??
    (await upsertAttendance({
      driverId,
      staffId,
      userId,
      date: today,
      status: "PRESENT",
    }));

  // Allow multiple sessions per day, but block if there's an open session
  const openSession = await getOpenAttendanceSession(attendanceHeader.id);
  if (openSession) {
    throw new BadRequestError(ATTENDANCE_ERROR_MESSAGES.ALREADY_CLOCKED_IN);
  }

  const personName = driver
    ? [driver.firstName, driver.lastName].filter(Boolean).join(" ").trim() || "Driver"
    : staff
      ? staff.name || "Staff"
      : user
        ? user.fullName || "Manager"
        : "Unknown";

  const clockInDescription = `${personName}${ATTENDANCE_ACTIVITY_DESCRIPTIONS.CLOCK_IN_SUFFIX}`;

  const session = await createAttendanceSession({
    attendanceId: attendanceHeader.id,
    clockIn: new Date(),
    notes: null,
  });

  const attendance = await upsertAttendance({
    driverId,
    staffId,
    userId,
    date: today,
    clockIn: session.clockIn,
    clockOut: null,
    status: "PRESENT",
  });

  const attendanceWithSessions = await getAttendanceByDateAndPerson(
    today,
    driverId,
    staffId,
    userId
  );

  logger.info("Clock in recorded", {
    attendanceId: attendance.id,
    entityType,
    id,
  });

  // Log activity (non-blocking); description includes person name for real-time activity logs
  const activityMetadata = {
    attendanceId: attendance.id,
    date: attendance.date,
    personName,
  };
  if (driverId) {
    logActivity({
      action: ActivityAction.DRIVER_CLOCK_IN,
      entityType: ActivityEntityType.ATTENDANCE,
      entityId: attendance.id,
      franchiseId: driver?.franchiseId,
      driverId: driverId,
      description: clockInDescription,
      metadata: activityMetadata,
    }).catch((err) => {
      logger.error("Failed to log clock in activity", { error: err });
    });
  } else if (staffId) {
    logActivity({
      action: ActivityAction.STAFF_CLOCK_IN,
      entityType: ActivityEntityType.ATTENDANCE,
      entityId: attendance.id,
      franchiseId: staff?.franchiseId,
      staffId: staffId,
      description: clockInDescription,
      metadata: activityMetadata,
    }).catch((err) => {
      logger.error("Failed to log clock in activity", { error: err });
    });
  } else if (userId && user) {
    logActivity({
      action: ActivityAction.ATTENDANCE_RECORDED,
      entityType: ActivityEntityType.ATTENDANCE,
      entityId: attendance.id,
      franchiseId: user.franchiseId || undefined,
      userId: userId,
      description: clockInDescription,
      metadata: activityMetadata,
    }).catch((err) => {
      logger.error("Failed to log clock in activity", { error: err });
    });
  }

  return {
    message: "Clocked in successfully",
    data: mapAttendanceToClockResponse(attendanceWithSessions ?? attendance),
  };
}

export async function clockOut(
  input: ClockOutDTO
): Promise<{ message: string; data: ClockAttendanceResponseDTO }> {
  const { id } = input;

  // Check if ID belongs to driver, staff, or user (manager) - check all in parallel
  const [driver, staff, user] = await Promise.all([
    getDriverById(id),
    getStaffById(id),
    prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, franchiseId: true },
    }),
  ]);

  // Determine entity type
  let driverId: string | undefined;
  let staffId: string | undefined;
  let userId: string | undefined;
  let entityType: "driver" | "staff" | "manager" | null = null;

  if (driver) {
    driverId = id;
    entityType = "driver";
  } else if (staff) {
    staffId = id;
    entityType = "staff";
  } else if (user) {
    // Only allow MANAGER role for clock-out
    if (user.role !== UserRole.MANAGER) {
      throw new BadRequestError("Only managers can clock out. Drivers and staff should use their respective IDs.");
    }
    userId = id;
    entityType = "manager";
  } else {
    throw new NotFoundError("ID not found in drivers, staff, or managers");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if there is an open session to clock out
  const existing = await getAttendanceByDateAndPerson(
    today,
    driverId,
    staffId,
    userId
  );

  if (!existing) {
    throw new BadRequestError(ATTENDANCE_ERROR_MESSAGES.NOT_CLOCKED_IN);
  }

  const openSession = await getOpenAttendanceSession(existing.id);
  if (!openSession) {
    throw new BadRequestError(ATTENDANCE_ERROR_MESSAGES.ALREADY_CLOCKED_OUT);
  }

  const closedSession = await closeAttendanceSession({
    sessionId: openSession.id,
    clockOut: new Date(),
    notes: null,
  });

  const attendance = await upsertAttendance({
    driverId,
    staffId,
    userId,
    date: today,
    loginTime: existing.loginTime,
    clockIn: existing.clockIn,
    clockOut: closedSession.clockOut,
    status: existing.status,
    notes: existing.notes ?? null,
  });

  const attendanceWithSessions = await getAttendanceByDateAndPerson(
    today,
    driverId,
    staffId,
    userId
  );

  logger.info("Clock out recorded", {
    attendanceId: attendance.id,
    entityType,
    id,
  });

  // Log activity (non-blocking)
  if (driverId) {
    logActivity({
      action: ActivityAction.DRIVER_CLOCK_OUT,
      entityType: ActivityEntityType.ATTENDANCE,
      entityId: attendance.id,
      franchiseId: driver?.franchiseId,
      driverId: driverId,
      description: `Driver clocked out`,
      metadata: {
        attendanceId: attendance.id,
        date: attendance.date,
        clockIn: attendance.clockIn,
        clockOut: attendance.clockOut,
      },
    }).catch((err) => {
      logger.error("Failed to log clock out activity", { error: err });
    });
  } else if (staffId) {
    logActivity({
      action: ActivityAction.STAFF_CLOCK_OUT,
      entityType: ActivityEntityType.ATTENDANCE,
      entityId: attendance.id,
      franchiseId: staff?.franchiseId,
      staffId: staffId,
      description: `Staff clocked out`,
      metadata: {
        attendanceId: attendance.id,
        date: attendance.date,
        clockIn: attendance.clockIn,
        clockOut: attendance.clockOut,
      },
    }).catch((err) => {
      logger.error("Failed to log clock out activity", { error: err });
    });
  } else if (userId && user) {
    logActivity({
      action: ActivityAction.ATTENDANCE_RECORDED,
      entityType: ActivityEntityType.ATTENDANCE,
      entityId: attendance.id,
      franchiseId: user.franchiseId || undefined,
      userId: userId,
      description: `Manager clocked out`,
      metadata: {
        attendanceId: attendance.id,
        date: attendance.date,
        clockIn: attendance.clockIn,
        clockOut: attendance.clockOut,
      },
    }).catch((err) => {
      logger.error("Failed to log clock out activity", { error: err });
    });
  }

  return {
    message: "Clocked out successfully",
    data: mapAttendanceToClockResponse(attendanceWithSessions ?? attendance),
  };
}

export async function listAttendances(
  filters?: { driverId?: string; staffId?: string; userId?: string; startDate?: Date; endDate?: Date }
): Promise<AttendanceResponseDTO[]> {
  const attendances = await getAllAttendances(filters);
  return attendances.map(mapAttendanceToResponse);
}

export async function listAttendancesPaginated(
  pagination: AttendancePaginationQueryDTO
): Promise<PaginatedAttendanceResponseDTO> {
  const { page, limit, driverId, staffId, userId, startDate, endDate } = pagination;
  const skip = (page - 1) * limit;

  const filters: any = {};
  if (driverId) filters.driverId = driverId;
  if (staffId) filters.staffId = staffId;
  if (userId) filters.userId = userId;
  if (startDate) filters.startDate = new Date(startDate);
  if (endDate) filters.endDate = new Date(endDate);

  const { data, total } = await getAttendancesPaginated(skip, limit, filters);

  const totalPages = total > 0 ? Math.ceil(total / limit) : 0;
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    data: data.map(mapAttendanceToResponse),
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

export async function getAttendance(id: string): Promise<AttendanceResponseDTO> {
  const attendance = await getAttendanceById(id);
  if (!attendance) {
    throw new NotFoundError(ATTENDANCE_ERROR_MESSAGES.ATTENDANCE_NOT_FOUND);
  }
  return mapAttendanceToResponse(attendance);
}

/**
 * Create a new attendance record
 */
export async function createAttendanceRecord(
  input: CreateAttendanceDTO
): Promise<{ message: string; data: AttendanceResponseDTO }> {
  if (!input.driverId && !input.staffId && !input.userId) {
    throw new BadRequestError(ATTENDANCE_ERROR_MESSAGES.INVALID_ATTENDANCE_TYPE);
  }

  // Verify entity exists
  if (input.driverId) {
    const driver = await getDriverById(input.driverId);
    if (!driver) {
      throw new NotFoundError(ATTENDANCE_ERROR_MESSAGES.DRIVER_NOT_FOUND);
    }
  } else if (input.staffId) {
    const staff = await getStaffById(input.staffId);
    if (!staff) {
      throw new NotFoundError(ATTENDANCE_ERROR_MESSAGES.STAFF_NOT_FOUND);
    }
  } else if (input.userId) {
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { id: true, role: true },
    });
    if (!user) {
      throw new NotFoundError("User not found");
    }
  }

  const date = typeof input.date === "string" ? new Date(input.date) : input.date;
  date.setHours(0, 0, 0, 0);

  // Check if attendance already exists for this date
  const existing = await getAttendanceByDateAndPerson(
    date,
    input.driverId,
    input.staffId,
    input.userId
  );

  if (existing) {
    throw new BadRequestError("Attendance record already exists for this date");
  }

  const attendance = await createAttendance({
    driverId: input.driverId,
    staffId: input.staffId,
    userId: input.userId,
    date,
    loginTime: input.loginTime ? new Date(input.loginTime) : null,
    clockIn: input.clockIn ? new Date(input.clockIn) : null,
    clockOut: input.clockOut ? new Date(input.clockOut) : null,
    status: input.status || "PRESENT",
    notes: input.notes || null,
  });

  logger.info("Attendance record created", {
    attendanceId: attendance.id,
    driverId: input.driverId,
    staffId: input.staffId,
    userId: input.userId,
  });

  return {
    message: "Attendance record created successfully",
    data: mapAttendanceToResponse(attendance),
  };
}

/**
 * Update an existing attendance record
 */
export async function updateAttendanceRecord(
  id: string,
  input: UpdateAttendanceDTO
): Promise<{ message: string; data: AttendanceResponseDTO }> {
  const existing = await getAttendanceById(id);
  if (!existing) {
    throw new NotFoundError(ATTENDANCE_ERROR_MESSAGES.ATTENDANCE_NOT_FOUND);
  }

  const updateData: any = {};
  if (input.loginTime !== undefined) {
    updateData.loginTime = input.loginTime ? new Date(input.loginTime) : null;
  }
  if (input.clockIn !== undefined) {
    updateData.clockIn = input.clockIn ? new Date(input.clockIn) : null;
  }
  if (input.clockOut !== undefined) {
    updateData.clockOut = input.clockOut ? new Date(input.clockOut) : null;
  }
  if (input.status !== undefined) {
    updateData.status = input.status;
  }
  if (input.notes !== undefined) {
    updateData.notes = input.notes;
  }

  const attendance = await updateAttendance(id, updateData);

  logger.info("Attendance record updated", {
    attendanceId: id,
  });

  return {
    message: "Attendance record updated successfully",
    data: mapAttendanceToResponse(attendance),
  };
}

/**
 * Delete an attendance record
 */
export async function deleteAttendanceRecord(
  id: string
): Promise<{ message: string }> {
  const existing = await getAttendanceById(id);
  if (!existing) {
    throw new NotFoundError(ATTENDANCE_ERROR_MESSAGES.ATTENDANCE_NOT_FOUND);
  }

  await deleteAttendance(id);

  logger.info("Attendance record deleted", {
    attendanceId: id,
  });

  return {
    message: "Attendance record deleted successfully",
  };
}

/**
 * Update attendance status with description
 */
export async function updateAttendanceStatus(
  id: string,
  input: UpdateAttendanceStatusDTO,
  updatedBy?: string
): Promise<{ message: string; data: AttendanceResponseDTO }> {
  const existing = await getAttendanceById(id);
  if (!existing) {
    throw new NotFoundError(ATTENDANCE_ERROR_MESSAGES.ATTENDANCE_NOT_FOUND);
  }

  const attendance = await updateAttendance(id, {
    status: input.status,
    notes: input.description || existing.notes,
  });

  logger.info("Attendance status updated", {
    attendanceId: id,
    newStatus: input.status,
    updatedBy,
  });

  // Log activity (non-blocking)
  let franchiseId: string | undefined;
  if (existing.driverId) {
    const driver = await getDriverById(existing.driverId);
    franchiseId = driver?.franchiseId;
  } else if (existing.staffId) {
    const staff = await getStaffById(existing.staffId);
    franchiseId = staff?.franchiseId;
  } else if (existing.userId) {
    const user = await prisma.user.findUnique({
      where: { id: existing.userId },
      select: { franchiseId: true },
    });
    franchiseId = user?.franchiseId || undefined;
  }

  logActivity({
    action: ActivityAction.ATTENDANCE_RECORDED,
    entityType: ActivityEntityType.ATTENDANCE,
    entityId: id,
    franchiseId: franchiseId || null,
    driverId: existing.driverId || null,
    staffId: existing.staffId || null,
    userId: existing.userId || updatedBy || null,
    description: `Attendance status updated to ${input.status}${input.description ? ` - ${input.description}` : ""}`,
    metadata: {
      attendanceId: id,
      oldStatus: existing.status,
      newStatus: input.status,
      description: input.description,
    },
  }).catch((err) => {
    logger.error("Failed to log attendance status update activity", { error: err });
  });

  return {
    message: "Attendance status updated successfully",
    data: mapAttendanceToResponse(attendance),
  };
}
