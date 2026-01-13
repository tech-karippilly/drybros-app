import { Request, Response, NextFunction } from "express";
import {
  listCustomers,
  getCustomer,
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
    const id = Number(req.params.id);
    const customer = await getCustomer(id);
    res.json({ data: customer });
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
