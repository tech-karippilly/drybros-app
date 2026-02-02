// src/repositories/attendance.repository.ts
import prisma from "../config/prismaClient";
import { Attendance, AttendanceStatus, UserRole } from "@prisma/client";

export type AttendanceRoleType = "DRIVER" | "STAFF" | "MANAGER" | "ADMIN";

export interface AttendanceFilters {
  driverId?: string;
  staffId?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  roleType?: AttendanceRoleType;
}

export type AttendanceSessionRow = {
  id: string;
  attendanceId: string;
  clockIn: Date;
  clockOut: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export async function createAttendance(data: {
  driverId?: string;
  staffId?: string;
  userId?: string;
  date: Date;
  loginTime?: Date | null;
  clockIn?: Date | null;
  clockOut?: Date | null;
  status?: AttendanceStatus;
  notes?: string | null;
}): Promise<Attendance> {
  return prisma.attendance.create({
    data: {
      driverId: data.driverId || null,
      staffId: data.staffId || null,
      userId: data.userId || null,
      date: data.date,
      loginTime: data.loginTime || null,
      clockIn: data.clockIn || null,
      clockOut: data.clockOut || null,
      status: data.status || "PRESENT",
      notes: data.notes || null,
    },
  });
}

export async function getAttendanceById(id: string) {
  return prisma.attendance.findUnique({
    where: { id },
    include: {
      sessions: {
        orderBy: { clockIn: "asc" },
      },
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
          name: true,
          email: true,
        },
      },
      User: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
        },
      },
    },
  });
}

export async function getAttendanceByDateAndPerson(
  date: Date,
  driverId?: string,
  staffId?: string,
  userId?: string
) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const whereClause: any = {
    date: {
      gte: startOfDay,
      lte: endOfDay,
    },
  };

  if (driverId) {
    whereClause.driverId = driverId;
  } else if (staffId) {
    whereClause.staffId = staffId;
  } else if (userId) {
    whereClause.userId = userId;
  }

  return prisma.attendance.findFirst({
    where: whereClause,
    include: {
      sessions: {
        orderBy: { clockIn: "asc" },
      },
    },
  });
}

export async function getOpenAttendanceSession(
  attendanceId: string
): Promise<AttendanceSessionRow | null> {
  return prisma.attendanceSession.findFirst({
    where: {
      attendanceId,
      clockOut: null,
    },
    orderBy: { clockIn: "desc" },
  });
}

export async function createAttendanceSession(data: {
  attendanceId: string;
  clockIn?: Date;
  notes?: string | null;
}): Promise<AttendanceSessionRow> {
  return prisma.attendanceSession.create({
    data: {
      attendanceId: data.attendanceId,
      clockIn: data.clockIn ?? new Date(),
      notes: data.notes ?? null,
    },
  });
}

export async function closeAttendanceSession(data: {
  sessionId: string;
  clockOut?: Date;
  notes?: string | null;
}): Promise<AttendanceSessionRow> {
  return prisma.attendanceSession.update({
    where: { id: data.sessionId },
    data: {
      clockOut: data.clockOut ?? new Date(),
      notes: data.notes ?? null,
      updatedAt: new Date(),
    },
  });
}

export async function getAttendancesPaginated(
  skip: number,
  take: number,
  filters?: {
    driverId?: string;
    staffId?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  }
) {
  const whereClause: any = {};
  
  if (filters?.driverId) {
    whereClause.driverId = filters.driverId;
  }
  
  if (filters?.staffId) {
    whereClause.staffId = filters.staffId;
  }
  
  if (filters?.userId) {
    whereClause.userId = filters.userId;
  }
  
  if (filters?.startDate || filters?.endDate) {
    whereClause.date = {};
    if (filters.startDate) {
      whereClause.date.gte = filters.startDate;
    }
    if (filters.endDate) {
      whereClause.date.lte = filters.endDate;
    }
  }

  const [data, total] = await Promise.all([
    prisma.attendance.findMany({
      skip,
      take,
      where: whereClause,
      orderBy: { date: "desc" },
      include: {
        sessions: {
          orderBy: { clockIn: "asc" },
        },
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
            name: true,
            email: true,
          },
        },
        User: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
    }),
    prisma.attendance.count({ where: whereClause }),
  ]);

  return { data, total };
}

export async function getAllAttendances(filters?: AttendanceFilters) {
  const whereClause: any = {};
  
  if (filters?.driverId) {
    whereClause.driverId = filters.driverId;
  }
  
  if (filters?.staffId) {
    whereClause.staffId = filters.staffId;
  }
  
  if (filters?.userId) {
    whereClause.userId = filters.userId;
  }
  
  if (filters?.roleType) {
    if (filters.roleType === "DRIVER") {
      whereClause.driverId = { not: null };
    } else if (filters.roleType === "STAFF") {
      whereClause.staffId = { not: null };
    } else if (filters.roleType === "MANAGER") {
      // Assuming Managers are Users with role MANAGER. 
      // But Attendance stores userId, which could be ADMIN or MANAGER.
      // We need to filter by User.role = MANAGER
      whereClause.userId = { not: null };
      whereClause.User = { role: UserRole.MANAGER };
    } else if (filters.roleType === "ADMIN") {
      whereClause.userId = { not: null };
      whereClause.User = { role: UserRole.ADMIN };
    }
  }

  if (filters?.startDate || filters?.endDate) {
    whereClause.date = {};
    if (filters.startDate) {
      whereClause.date.gte = filters.startDate;
    }
    if (filters.endDate) {
      whereClause.date.lte = filters.endDate;
    }
  }

  return prisma.attendance.findMany({
    where: whereClause,
    orderBy: { date: "desc" },
    include: {
      sessions: {
        orderBy: { clockIn: "asc" },
      },
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
          name: true,
          email: true,
        },
      },
      User: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
        },
      },
    },
  });
}

export async function updateAttendance(
  id: string,
  data: {
    loginTime?: Date | null;
    clockIn?: Date | null;
    clockOut?: Date | null;
    status?: AttendanceStatus;
    notes?: string | null;
  }
): Promise<Attendance> {
  return prisma.attendance.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date(),
    },
  });
}

export async function upsertAttendance(data: {
  driverId?: string;
  staffId?: string;
  userId?: string;
  date: Date;
  loginTime?: Date | null;
  clockIn?: Date | null;
  clockOut?: Date | null;
  status?: AttendanceStatus;
  notes?: string | null;
}): Promise<Attendance> {
  // Normalize date to start of day for comparison
  const normalizedDate = new Date(data.date);
  normalizedDate.setHours(0, 0, 0, 0);

  // Build where clause based on unique constraints
  let whereClause: any;
  if (data.driverId) {
    whereClause = {
      driverId_date: {
        driverId: data.driverId,
        date: normalizedDate,
      },
    };
  } else if (data.staffId) {
    whereClause = {
      staffId_date: {
        staffId: data.staffId,
        date: normalizedDate,
      },
    };
  } else if (data.userId) {
    whereClause = {
      userId_date: {
        userId: data.userId,
        date: normalizedDate,
      },
    };
  } else {
    throw new Error("Either driverId, staffId, or userId must be provided");
  }

  // Check if record exists
  const existing = await getAttendanceByDateAndPerson(
    normalizedDate,
    data.driverId,
    data.staffId,
    data.userId
  );

  if (existing) {
    // Update existing record
    const updateData: any = {
      updatedAt: new Date(),
    };
    if (data.loginTime !== undefined) updateData.loginTime = data.loginTime;
    if (data.clockIn !== undefined) updateData.clockIn = data.clockIn;
    if (data.clockOut !== undefined) updateData.clockOut = data.clockOut;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;

    return prisma.attendance.update({
      where: { id: existing.id },
      data: updateData,
    });
  } else {
    // Create new record
    return prisma.attendance.create({
      data: {
        driverId: data.driverId || null,
        staffId: data.staffId || null,
        userId: data.userId || null,
        date: normalizedDate,
        loginTime: data.loginTime || null,
        clockIn: data.clockIn || null,
        clockOut: data.clockOut || null,
        status: data.status || "PRESENT",
        notes: data.notes || null,
      },
    });
  }
}

export async function deleteAttendance(id: string): Promise<Attendance> {
  return prisma.attendance.delete({
    where: { id },
  });
}
