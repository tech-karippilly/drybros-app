// src/services/complaint.service.ts
import {
  createComplaint as repoCreateComplaint,
  getComplaintById,
  getComplaintsPaginated,
  getAllComplaints,
  updateComplaintStatus as repoUpdateComplaintStatus,
  incrementDriverComplaintCount,
} from "../repositories/complaint.repository";
import {
  getDriverById,
  fireDriver as repoFireDriver,
  incrementDriverWarningCount as repoIncrementDriverWarningCount,
} from "../repositories/driver.repository";
import {
  getStaffById,
  updateStaffStatus as repoUpdateStaffStatus,
  incrementStaffWarningCount as repoIncrementStaffWarningCount,
} from "../repositories/staff.repository";
import {
  CreateComplaintDTO,
  ComplaintResponseDTO,
  UpdateComplaintStatusDTO,
  ComplaintPaginationQueryDTO,
  PaginatedComplaintResponseDTO,
} from "../types/complaint.dto";
import { NotFoundError, BadRequestError } from "../utils/errors";
import { COMPLAINT_ERROR_MESSAGES, COMPLAINT_WARNING_THRESHOLD } from "../constants/complaint";
import logger from "../config/logger";
import { logActivity } from "./activity.service";
import { ActivityAction, ActivityEntityType } from "@prisma/client";

function mapComplaintToResponse(complaint: any): ComplaintResponseDTO {
  return {
    id: complaint.id,
    driverId: complaint.driverId,
    staffId: complaint.staffId,
    customerId: complaint.customerId ?? null,
    title: complaint.title,
    description: complaint.description,
    reportedBy: complaint.reportedBy,
    status: complaint.status,
    severity: complaint.severity,
    createdAt: complaint.createdAt,
    updatedAt: complaint.updatedAt,
    resolvedAt: complaint.resolvedAt,
    resolvedBy: complaint.resolvedBy,
    resolution: complaint.resolution,
    resolutionAction: complaint.resolutionAction ?? null,
    resolutionReason: complaint.resolutionReason ?? null,
  };
}

export async function createComplaint(
  input: CreateComplaintDTO,
  reportedBy?: string
): Promise<{ message: string; data: ComplaintResponseDTO }> {
  // Validate that either driverId or staffId is provided
  if (!input.driverId && !input.staffId) {
    throw new BadRequestError(COMPLAINT_ERROR_MESSAGES.INVALID_COMPLAINT_TYPE);
  }

  // Verify driver or staff exists
  if (input.driverId) {
    const driver = await getDriverById(input.driverId);
    if (!driver) {
      throw new NotFoundError(COMPLAINT_ERROR_MESSAGES.DRIVER_NOT_FOUND);
    }
  }

  if (input.staffId) {
    const staff = await getStaffById(input.staffId);
    if (!staff) {
      throw new NotFoundError(COMPLAINT_ERROR_MESSAGES.STAFF_NOT_FOUND);
    }
  }

  const complaint = await repoCreateComplaint({
    driverId: input.driverId,
    staffId: input.staffId,
    customerId: input.customerId ?? null,
    title: input.title,
    description: input.description,
    reportedBy: reportedBy || null,
    severity: input.severity || "MEDIUM",
  });

  // Increment complaint count for driver
  if (input.driverId) {
    await incrementDriverComplaintCount(input.driverId).catch((err) => {
      logger.error("Failed to increment driver complaint count", { error: err });
    });
  }

  logger.info("Complaint created", {
    complaintId: complaint.id,
    driverId: input.driverId,
    staffId: input.staffId,
  });

  // Log activity (non-blocking)
  let franchiseId: string | undefined;
  if (input.driverId) {
    const driver = await getDriverById(input.driverId);
    franchiseId = driver?.franchiseId;
  } else if (input.staffId) {
    const staff = await getStaffById(input.staffId);
    franchiseId = staff?.franchiseId;
  }

  logActivity({
    action: ActivityAction.COMPLAINT_CREATED,
    entityType: ActivityEntityType.COMPLAINT,
    entityId: complaint.id,
    franchiseId: franchiseId || null,
    driverId: input.driverId || null,
    staffId: input.staffId || null,
    userId: reportedBy || null,
    description: `Complaint created: ${input.title} - ${input.severity} severity`,
    metadata: {
      complaintId: complaint.id,
      title: input.title,
      severity: input.severity,
      driverId: input.driverId,
      staffId: input.staffId,
    },
  }).catch((err) => {
    logger.error("Failed to log complaint activity", { error: err });
  });

  return {
    message: "Complaint created successfully",
    data: mapComplaintToResponse(complaint),
  };
}

export async function listComplaints(
  filters?: { driverId?: string; staffId?: string; status?: string }
): Promise<ComplaintResponseDTO[]> {
  const complaints = await getAllComplaints(filters as any);
  return complaints.map(mapComplaintToResponse);
}

export async function listComplaintsPaginated(
  pagination: ComplaintPaginationQueryDTO
): Promise<PaginatedComplaintResponseDTO> {
  const { page, limit, driverId, staffId, status } = pagination;
  const skip = (page - 1) * limit;

  const filters: any = {};
  if (driverId) filters.driverId = driverId;
  if (staffId) filters.staffId = staffId;
  if (status) filters.status = status;

  const { data, total } = await getComplaintsPaginated(skip, limit, filters);

  const totalPages = total > 0 ? Math.ceil(total / limit) : 0;
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    data: data.map(mapComplaintToResponse),
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

export async function getComplaint(id: string): Promise<ComplaintResponseDTO> {
  const complaint = await getComplaintById(id);
  if (!complaint) {
    throw new NotFoundError(COMPLAINT_ERROR_MESSAGES.COMPLAINT_NOT_FOUND);
  }
  return mapComplaintToResponse(complaint);
}

export async function updateComplaintStatus(
  id: string,
  input: UpdateComplaintStatusDTO,
  resolvedBy?: string
): Promise<{ message: string; data: ComplaintResponseDTO }> {
  const complaint = await getComplaintById(id);
  if (!complaint) {
    throw new NotFoundError(COMPLAINT_ERROR_MESSAGES.COMPLAINT_NOT_FOUND);
  }

  let resolutionAction: "WARNING" | "FIRE" | undefined;
  let resolutionReason: string | undefined;
  let resolution: string | null = input.resolution ?? null;

  if (input.status === "RESOLVED") {
    if (!input.action || !input.reason) {
      throw new BadRequestError(COMPLAINT_ERROR_MESSAGES.RESOLVE_REQUIRES_ACTION);
    }
    if (!complaint.driverId && !complaint.staffId) {
      throw new BadRequestError(
        "Complaint has no driver or staff; resolution action cannot be applied."
      );
    }

    let action: "WARNING" | "FIRE" = input.action;
    const reason = input.reason;

    if (action === "WARNING") {
      const warningCount = complaint.driverId
        ? (await getDriverById(complaint.driverId))?.warningCount ?? 0
        : (await getStaffById(complaint.staffId!))?.warningCount ?? 0;
      if (warningCount >= COMPLAINT_WARNING_THRESHOLD - 1) {
        action = "FIRE";
        resolutionReason = `${reason} (auto-fired: ${COMPLAINT_WARNING_THRESHOLD}+ warnings)`;
      } else {
        resolutionAction = "WARNING";
        resolutionReason = reason;
      }
    } else {
      resolutionAction = "FIRE";
      resolutionReason = reason;
    }

    if (action === "FIRE") {
      if (complaint.driverId) {
        const driver = await getDriverById(complaint.driverId);
        if (driver && !driver.blacklisted && driver.status !== "TERMINATED") {
          await repoFireDriver(complaint.driverId);
          logger.info("Driver fired due to complaint", {
            driverId: complaint.driverId,
            complaintId: id,
          });
        }
      }
      if (complaint.staffId) {
        const staff = await getStaffById(complaint.staffId);
        if (staff && staff.status !== "FIRED") {
          await repoUpdateStaffStatus(complaint.staffId, "FIRED");
          logger.info("Staff fired due to complaint", {
            staffId: complaint.staffId,
            complaintId: id,
          });
        }
      }
      if (action === "FIRE" && !resolutionAction) {
        resolutionAction = "FIRE";
        resolutionReason = resolutionReason ?? reason;
      }
    } else {
      if (complaint.driverId) {
        const driver = await getDriverById(complaint.driverId);
        if (driver && !driver.blacklisted && driver.status !== "TERMINATED") {
          await repoIncrementDriverWarningCount(complaint.driverId);
        }
      }
      if (complaint.staffId) {
        const staff = await getStaffById(complaint.staffId);
        if (staff && staff.status !== "FIRED") {
          await repoIncrementStaffWarningCount(complaint.staffId);
        }
      }
    }
  }

  const updated = await repoUpdateComplaintStatus(
    id,
    input.status,
    resolvedBy ?? null,
    resolution,
    resolutionAction ?? null,
    resolutionReason ?? null
  );

  logger.info("Complaint status updated", {
    complaintId: id,
    newStatus: input.status,
    resolutionAction: resolutionAction ?? undefined,
  });

  const franchiseId: string | null = complaint.driverId
    ? (await getDriverById(complaint.driverId))?.franchiseId ?? null
    : (await getStaffById(complaint.staffId!))?.franchiseId ?? null;

  logActivity({
    action:
      input.status === "RESOLVED"
        ? ActivityAction.COMPLAINT_RESOLVED
        : ActivityAction.COMPLAINT_STATUS_CHANGED,
    entityType: ActivityEntityType.COMPLAINT,
    entityId: id,
    franchiseId: franchiseId ?? null,
    driverId: complaint.driverId ?? null,
    staffId: complaint.staffId ?? null,
    userId: resolvedBy ?? null,
    description: `Complaint status changed to ${input.status}${
      resolutionReason ? ` - ${resolutionReason}` : ""
    }`,
    metadata: {
      complaintId: id,
      oldStatus: complaint.status,
      newStatus: input.status,
      resolution,
      resolutionAction: resolutionAction ?? undefined,
      resolutionReason: resolutionReason ?? undefined,
    },
  }).catch((err) => {
    logger.error("Failed to log complaint status change activity", { error: err });
  });

  return {
    message: "Complaint status updated successfully",
    data: mapComplaintToResponse(updated),
  };
}
