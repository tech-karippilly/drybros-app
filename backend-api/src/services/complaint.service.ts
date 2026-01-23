// src/services/complaint.service.ts
import {
  createComplaint as repoCreateComplaint,
  getComplaintById,
  getComplaintsPaginated,
  getAllComplaints,
  updateComplaintStatus as repoUpdateComplaintStatus,
  incrementDriverComplaintCount,
} from "../repositories/complaint.repository";
import { getDriverById } from "../repositories/driver.repository";
import { getStaffById } from "../repositories/staff.repository";
import {
  CreateComplaintDTO,
  ComplaintResponseDTO,
  UpdateComplaintStatusDTO,
  ComplaintPaginationQueryDTO,
  PaginatedComplaintResponseDTO,
} from "../types/complaint.dto";
import { NotFoundError, BadRequestError } from "../utils/errors";
import { COMPLAINT_ERROR_MESSAGES } from "../constants/complaint";
import logger from "../config/logger";

function mapComplaintToResponse(complaint: any): ComplaintResponseDTO {
  return {
    id: complaint.id,
    driverId: complaint.driverId,
    staffId: complaint.staffId,
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

  const updated = await repoUpdateComplaintStatus(
    id,
    input.status,
    resolvedBy || null,
    input.resolution || null
  );

  logger.info("Complaint status updated", {
    complaintId: id,
    newStatus: input.status,
  });

  return {
    message: "Complaint status updated successfully",
    data: mapComplaintToResponse(updated),
  };
}
