// src/controllers/activity.controller.ts
import { Request, Response, NextFunction } from "express";
import {
  getActivityLogs,
  getActivityLogsPaginated,
  getActivityLog,
} from "../services/activity.service";
import { UserRole } from "@prisma/client";
import prisma from "../config/prismaClient";

/**
 * Get activity logs with role-based filtering
 */
export async function getActivityLogsHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Get user's franchiseId if MANAGER role
    let userFranchiseId: string | undefined;
    if (user.role === UserRole.MANAGER) {
      const userRecord = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { franchiseId: true },
      });
      userFranchiseId = userRecord?.franchiseId || undefined;
    }

    // Get driverId if DRIVER role
    let driverId: string | undefined;
    if (user.role === UserRole.DRIVER) {
      const driver = await prisma.driver.findFirst({
        where: { email: user.email },
        select: { id: true },
      });
      driverId = driver?.id;
    }

    // Get staffId if STAFF role
    let staffFranchiseId: string | undefined;
    if (user.role === UserRole.OFFICE_STAFF || user.role === UserRole.STAFF) {
      const staff = await prisma.staff.findFirst({
        where: { email: user.email },
        select: { franchiseId: true },
      });
      staffFranchiseId = staff?.franchiseId;
    }

    if (req.query.page || req.query.limit) {
      const pagination = (req as any).validatedQuery;
      const result = await getActivityLogsPaginated(
        user.role,
        user.userId,
        userFranchiseId || staffFranchiseId,
        pagination
      );
      res.json(result);
    } else {
      const validatedQuery = (req as any).validatedQuery;
      const filters: any = {};
      if (validatedQuery?.franchiseId) filters.franchiseId = validatedQuery.franchiseId;
      if (validatedQuery?.driverId) filters.driverId = validatedQuery.driverId;
      if (validatedQuery?.staffId) filters.staffId = validatedQuery.staffId;
      if (validatedQuery?.tripId) filters.tripId = validatedQuery.tripId;
      if (validatedQuery?.action) filters.action = validatedQuery.action;
      if (validatedQuery?.entityType) filters.entityType = validatedQuery.entityType;
      if (validatedQuery?.startDate) filters.startDate = new Date(validatedQuery.startDate);
      if (validatedQuery?.endDate) filters.endDate = new Date(validatedQuery.endDate);

      const data = await getActivityLogs(
        user.role,
        user.userId,
        userFranchiseId || staffFranchiseId,
        filters
      );
      res.json({ data });
    }
  } catch (err) {
    next(err);
  }
}

/**
 * Get activity log by ID
 */
export async function getActivityLogByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id;
    const activityLog = await getActivityLog(id);
    res.json({ data: activityLog });
  } catch (err) {
    next(err);
  }
}

/**
 * Server-Sent Events endpoint for realtime activity logs
 */
export async function getActivityLogsStreamHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Set headers for SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // Disable buffering in nginx

    // Get user's franchiseId if MANAGER role
    let userFranchiseId: string | undefined;
    if (user.role === UserRole.MANAGER) {
      const userRecord = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { franchiseId: true },
      });
      userFranchiseId = userRecord?.franchiseId || undefined;
    }

    // Get driverId if DRIVER role
    let driverId: string | undefined;
    if (user.role === UserRole.DRIVER) {
      const driver = await prisma.driver.findFirst({
        where: { email: user.email },
        select: { id: true },
      });
      driverId = driver?.id;
    }

    // Get staffId if STAFF role
    let staffFranchiseId: string | undefined;
    if (user.role === UserRole.OFFICE_STAFF || user.role === UserRole.STAFF) {
      const staff = await prisma.staff.findFirst({
        where: { email: user.email },
        select: { franchiseId: true },
      });
      staffFranchiseId = staff?.franchiseId;
    }

    const franchiseId = req.query.franchiseId as string | undefined;

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: "connected", message: "Activity log stream connected" })}\n\n`);

    // Poll for new activities every 2 seconds
    let lastActivityId: string | null = null;
    const pollInterval = setInterval(async () => {
      try {
        const filters: any = {};
        if (franchiseId) filters.franchiseId = franchiseId;
        if (userFranchiseId || staffFranchiseId) {
          filters.franchiseId = userFranchiseId || staffFranchiseId;
        }
        if (driverId) filters.driverId = driverId;

        const activities = await getActivityLogs(
          user.role,
          user.userId,
          userFranchiseId || staffFranchiseId,
          filters
        );

        // Send only new activities
        const newActivities = lastActivityId
          ? activities.filter((a) => a.id !== lastActivityId && new Date(a.createdAt) > new Date(Date.now() - 5000))
          : activities.slice(0, 10); // First load: send last 10

        if (newActivities.length > 0) {
          newActivities.forEach((activity) => {
            res.write(`data: ${JSON.stringify({ type: "activity", data: activity })}\n\n`);
          });
          lastActivityId = newActivities[0].id;
        }

        // Send heartbeat
        res.write(`: heartbeat\n\n`);
      } catch (error) {
        res.write(`data: ${JSON.stringify({ type: "error", message: "Failed to fetch activities" })}\n\n`);
      }
    }, 2000); // Poll every 2 seconds

    // Clean up on client disconnect
    req.on("close", () => {
      clearInterval(pollInterval);
      res.end();
    });
  } catch (err) {
    next(err);
  }
}
