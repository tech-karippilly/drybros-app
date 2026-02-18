// src/controllers/leave.controller.ts
import { Request, Response, NextFunction } from "express";
import { UserRole } from "@prisma/client";
import {
  createLeaveRequest,
  listLeaveRequests,
  listLeaveRequestsPaginated,
  getLeaveRequest,
  updateLeaveRequestStatus,
} from "../services/leave.service";

export async function createLeaveRequestHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const requestedBy = req.user?.userId;
    const userRole = req.user?.role;
    const driverId = req.driver?.driverId;
    
    // Prepare the input data for the service
    let input = { ...req.body };
    
    // If it's a driver making the request, auto-populate driverId
    if (driverId) {
      input.driverId = driverId;
    } else if (req.user) {
      // If it's a user making the request, check if they're requesting for themselves
      // Only allow self-requests unless the user is admin/manager
      if (userRole === UserRole.MANAGER) {
        // Manager can request leave for themselves
        input.userId = req.user.userId;
      } else if (userRole === UserRole.STAFF) {
        // Staff can request leave for themselves
        input.staffId = req.user.userId;
      }
      // For admins, they can request for others, so they need to specify the ID in the body
    }
    
    const result = await createLeaveRequest(input, requestedBy);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getLeaveRequestsHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (req.query.page || req.query.limit) {
      const pagination = (req as any).validatedQuery;
      const result = await listLeaveRequestsPaginated(pagination);
      res.json(result);
    } else {
      const validatedQuery = (req as any).validatedQuery;
      const filters: any = {};
      if (validatedQuery?.driverId) filters.driverId = validatedQuery.driverId;
      if (validatedQuery?.staffId) filters.staffId = validatedQuery.staffId;
      if (validatedQuery?.userId) filters.userId = validatedQuery.userId;
      if (validatedQuery?.status) filters.status = validatedQuery.status;
      if (validatedQuery?.startDate) filters.startDate = new Date(validatedQuery.startDate);
      if (validatedQuery?.endDate) filters.endDate = new Date(validatedQuery.endDate);
      const data = await listLeaveRequests(filters);
      res.json({ data });
    }
  } catch (err) {
    next(err);
  }
}

export async function getLeaveRequestByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id;
    const leaveRequest = await getLeaveRequest(String(id));
    res.json({ data: leaveRequest });
  } catch (err) {
    next(err);
  }
}

export async function updateLeaveRequestStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id;
    const approvedBy = req.user?.userId;
    const approverRole = req.user?.role;
    if (!approverRole) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const result = await updateLeaveRequestStatus(String(id), req.body, approvedBy, approverRole);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
