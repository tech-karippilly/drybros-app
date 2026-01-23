// src/controllers/leave.controller.ts
import { Request, Response, NextFunction } from "express";
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
    const result = await createLeaveRequest(req.body, requestedBy);
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
    const leaveRequest = await getLeaveRequest(id);
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
    const result = await updateLeaveRequestStatus(id, req.body, approvedBy);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
