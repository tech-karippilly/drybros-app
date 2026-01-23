// src/services/attendance.service.ts
import {
  createAttendance,
  getAttendanceById,
  getAttendanceByDateAndPerson,
  getAttendancesPaginated,
  getAllAttendances,
  upsertAttendance,
} from "../repositories/attendance.repository";
import { getDriverById } from "../repositories/driver.repository";
import { getStaffById } from "../repositories/staff.repository";
import {
  ClockInDTO,
  ClockOutDTO,
  AttendanceResponseDTO,
  AttendancePaginationQueryDTO,
  PaginatedAttendanceResponseDTO,
} from "../types/attendance.dto";
import { NotFoundError, BadRequestError } from "../utils/errors";
import { ATTENDANCE_ERROR_MESSAGES } from "../constants/attendance";
import logger from "../config/logger";

function mapAttendanceToResponse(attendance: any): AttendanceResponseDTO {
  return {
    id: attendance.id,
    driverId: attendance.driverId,
    staffId: attendance.staffId,
    date: attendance.date,
    clockIn: attendance.clockIn,
    clockOut: attendance.clockOut,
    status: attendance.status,
    notes: attendance.notes,
    createdAt: attendance.createdAt,
    updatedAt: attendance.updatedAt,
  };
}

export async function clockIn(
  input: ClockInDTO
): Promise<{ message: string; data: AttendanceResponseDTO }> {
  if (!input.driverId && !input.staffId) {
    throw new BadRequestError(ATTENDANCE_ERROR_MESSAGES.INVALID_ATTENDANCE_TYPE);
  }

  // Verify driver or staff exists
  if (input.driverId) {
    const driver = await getDriverById(input.driverId);
    if (!driver) {
      throw new NotFoundError(ATTENDANCE_ERROR_MESSAGES.DRIVER_NOT_FOUND);
    }
  }

  if (input.staffId) {
    const staff = await getStaffById(input.staffId);
    if (!staff) {
      throw new NotFoundError(ATTENDANCE_ERROR_MESSAGES.STAFF_NOT_FOUND);
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if already clocked in today
  const existing = await getAttendanceByDateAndPerson(
    today,
    input.driverId,
    input.staffId
  );

  if (existing && existing.clockIn) {
    throw new BadRequestError(ATTENDANCE_ERROR_MESSAGES.ALREADY_CLOCKED_IN);
  }

  const attendance = await upsertAttendance({
    driverId: input.driverId,
    staffId: input.staffId,
    date: today,
    clockIn: new Date(),
    clockOut: null,
    status: "PRESENT",
    notes: input.notes || null,
  });

  logger.info("Clock in recorded", {
    attendanceId: attendance.id,
    driverId: input.driverId,
    staffId: input.staffId,
  });

  return {
    message: "Clocked in successfully",
    data: mapAttendanceToResponse(attendance),
  };
}

export async function clockOut(
  input: ClockOutDTO
): Promise<{ message: string; data: AttendanceResponseDTO }> {
  if (!input.driverId && !input.staffId) {
    throw new BadRequestError(ATTENDANCE_ERROR_MESSAGES.INVALID_ATTENDANCE_TYPE);
  }

  // Verify driver or staff exists
  if (input.driverId) {
    const driver = await getDriverById(input.driverId);
    if (!driver) {
      throw new NotFoundError(ATTENDANCE_ERROR_MESSAGES.DRIVER_NOT_FOUND);
    }
  }

  if (input.staffId) {
    const staff = await getStaffById(input.staffId);
    if (!staff) {
      throw new NotFoundError(ATTENDANCE_ERROR_MESSAGES.STAFF_NOT_FOUND);
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if clocked in
  const existing = await getAttendanceByDateAndPerson(
    today,
    input.driverId,
    input.staffId
  );

  if (!existing || !existing.clockIn) {
    throw new BadRequestError(ATTENDANCE_ERROR_MESSAGES.NOT_CLOCKED_IN);
  }

  if (existing.clockOut) {
    throw new BadRequestError("Already clocked out for today");
  }

  const attendance = await upsertAttendance({
    driverId: input.driverId,
    staffId: input.staffId,
    date: today,
    clockIn: existing.clockIn,
    clockOut: new Date(),
    status: existing.status,
    notes: input.notes || existing.notes,
  });

  logger.info("Clock out recorded", {
    attendanceId: attendance.id,
    driverId: input.driverId,
    staffId: input.staffId,
  });

  return {
    message: "Clocked out successfully",
    data: mapAttendanceToResponse(attendance),
  };
}

export async function listAttendances(
  filters?: { driverId?: string; staffId?: string; startDate?: Date; endDate?: Date }
): Promise<AttendanceResponseDTO[]> {
  const attendances = await getAllAttendances(filters);
  return attendances.map(mapAttendanceToResponse);
}

export async function listAttendancesPaginated(
  pagination: AttendancePaginationQueryDTO
): Promise<PaginatedAttendanceResponseDTO> {
  const { page, limit, driverId, staffId, startDate, endDate } = pagination;
  const skip = (page - 1) * limit;

  const filters: any = {};
  if (driverId) filters.driverId = driverId;
  if (staffId) filters.staffId = staffId;
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
