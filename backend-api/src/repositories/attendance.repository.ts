// src/repositories/attendance.repository.ts
import prisma from "../config/prismaClient";
import { Attendance, AttendanceStatus } from "@prisma/client";

export async function createAttendance(data: {
  driverId?: string;
  staffId?: string;
  date: Date;
  status?: AttendanceStatus;
}): Promise<Attendance> {
  return prisma.attendance.create({
    data: {
      driverId: data.driverId || null,
      staffId: data.staffId || null,
      date: data.date,
      status: data.status || "PRESENT",
    },
  });
}

export async function getAttendanceById(id: string) {
  return prisma.attendance.findUnique({
    where: { id },
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
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function getAttendanceByDateAndPerson(
  date: Date,
  driverId?: string,
  staffId?: string
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
  }

  return prisma.attendance.findFirst({
    where: whereClause,
  });
}

export async function getAttendancesPaginated(
  skip: number,
  take: number,
  filters?: {
    driverId?: string;
    staffId?: string;
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
      },
    }),
    prisma.attendance.count({ where: whereClause }),
  ]);

  return { data, total };
}

export async function getAllAttendances(filters?: {
  driverId?: string;
  staffId?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const whereClause: any = {};
  
  if (filters?.driverId) {
    whereClause.driverId = filters.driverId;
  }
  
  if (filters?.staffId) {
    whereClause.staffId = filters.staffId;
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
    },
  });
}

export async function updateAttendance(
  id: string,
  data: {
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
  date: Date;
  clockIn?: Date | null;
  clockOut?: Date | null;
  status?: AttendanceStatus;
  notes?: string | null;
}): Promise<Attendance> {
  const whereClause: any = {
    date: data.date,
  };

  if (data.driverId) {
    whereClause.driverId = data.driverId;
  } else if (data.staffId) {
    whereClause.staffId = data.staffId;
  }

  return prisma.attendance.upsert({
    where: whereClause,
    update: {
      clockIn: data.clockIn,
      clockOut: data.clockOut,
      status: data.status,
      notes: data.notes,
      updatedAt: new Date(),
    },
    create: {
      driverId: data.driverId || null,
      staffId: data.staffId || null,
      date: data.date,
      clockIn: data.clockIn,
      clockOut: data.clockOut,
      status: data.status || "PRESENT",
      notes: data.notes,
    },
  });
}
