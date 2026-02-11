// src/controllers/complaint.controller.ts
import { Request, Response, NextFunction } from "express";
import {
  createComplaint,
  listComplaints,
  listComplaintsPaginated,
  getComplaint,
  updateComplaintStatus,
} from "../services/complaint.service";

export async function createComplaintHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const reportedBy = req.user?.userId;
    const result = await createComplaint(req.body, reportedBy);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getComplaintsHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (req.query.page || req.query.limit) {
      const pagination = (req as any).validatedQuery;
      const result = await listComplaintsPaginated(pagination);
      res.json(result);
    } else {
      const validatedQuery = (req as any).validatedQuery;
      const filters: any = {};
      if (validatedQuery?.driverId) filters.driverId = validatedQuery.driverId;
      if (validatedQuery?.staffId) filters.staffId = validatedQuery.staffId;
      if (validatedQuery?.status) filters.status = validatedQuery.status;
      const data = await listComplaints(filters);
      res.json({ data });
    }
  } catch (err) {
    next(err);
  }
}

export async function getComplaintByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id;
    const complaint = await getComplaint(String(id));
    res.json({ data: complaint });
  } catch (err) {
    next(err);
  }
}

export async function updateComplaintStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id;
    const resolvedBy = req.user?.userId;
    const result = await updateComplaintStatus(String(id), req.body, resolvedBy);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
