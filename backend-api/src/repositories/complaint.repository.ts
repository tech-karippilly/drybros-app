// src/repositories/complaint.repository.ts
import prisma from "../config/prismaClient";
import { Complaint, ComplaintStatus } from "@prisma/client";

export async function createComplaint(data: {
  driverId?: string;
  staffId?: string;
  title: string;
  description: string;
  reportedBy?: string | null;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}): Promise<Complaint> {
  return prisma.complaint.create({
    data: {
      driverId: data.driverId || null,
      staffId: data.staffId || null,
      title: data.title,
      description: data.description,
      reportedBy: data.reportedBy || null,
      severity: data.severity,
    },
  });
}

export async function getComplaintById(id: string) {
  return prisma.complaint.findUnique({
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

export async function getComplaintsPaginated(
  skip: number,
  take: number,
  filters?: {
    driverId?: string;
    staffId?: string;
    status?: ComplaintStatus;
  }
) {
  const whereClause: any = {};
  
  if (filters?.driverId) {
    whereClause.driverId = filters.driverId;
  }
  
  if (filters?.staffId) {
    whereClause.staffId = filters.staffId;
  }
  
  if (filters?.status) {
    whereClause.status = filters.status;
  }

  const [data, total] = await Promise.all([
    prisma.complaint.findMany({
      skip,
      take,
      where: whereClause,
      orderBy: { createdAt: "desc" },
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
    prisma.complaint.count({ where: whereClause }),
  ]);

  return { data, total };
}

export async function getAllComplaints(filters?: {
  driverId?: string;
  staffId?: string;
  status?: ComplaintStatus;
}) {
  const whereClause: any = {};
  
  if (filters?.driverId) {
    whereClause.driverId = filters.driverId;
  }
  
  if (filters?.staffId) {
    whereClause.staffId = filters.staffId;
  }
  
  if (filters?.status) {
    whereClause.status = filters.status;
  }

  return prisma.complaint.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
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

export async function updateComplaintStatus(
  id: string,
  status: ComplaintStatus,
  resolvedBy?: string | null,
  resolution?: string | null
): Promise<Complaint> {
  const updateData: any = {
    status,
    updatedAt: new Date(),
  };

  if (status === "RESOLVED" || status === "CLOSED") {
    updateData.resolvedAt = new Date();
    updateData.resolvedBy = resolvedBy || null;
    if (resolution) {
      updateData.resolution = resolution;
    }
  }

  return prisma.complaint.update({
    where: { id },
    data: updateData,
  });
}

export async function incrementDriverComplaintCount(driverId: string) {
  return prisma.driver.update({
    where: { id: driverId },
    data: {
      complaintCount: {
        increment: 1,
      },
    },
  });
}
