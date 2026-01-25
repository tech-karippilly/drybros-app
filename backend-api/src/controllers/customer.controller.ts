import { Request, Response, NextFunction } from "express";
import {
  listCustomers,
  getCustomer,
  getCustomerDetails,
  createCustomer,
} from "../services/customer.service";

export async function getCustomers(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await listCustomers();
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function getCustomerById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id as string;
    const customer = await getCustomer(id);
    res.json({ data: customer });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /customers/:id/details
 * Customer details with history: profile + trips booked count + complaints raised count.
 */
export async function getCustomerDetailsHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id as string;
    const data = await getCustomerDetails(id);
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function createCustomerHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = req.body;
    const customer = await createCustomer(data);
    res.status(201).json({ data: customer });
  } catch (err) {
    next(err);
  }
}
