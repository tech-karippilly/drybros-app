import {
  getAllCustomers,
  getCustomerById,
  createCustomer as repoCreateCustomer,
} from "../repositories/customer.repository";

export async function listCustomers() {
  return getAllCustomers();
}

export async function getCustomer(id: number) {
  const customer = await getCustomerById(id);
  if (!customer) {
    const err: any = new Error("Customer not found");
    err.statusCode = 404;
    throw err;
  }
  return customer;
}

export async function createCustomer(data: {
  fullName: string;
  phone: string;
  email?: string;
  city?: string;
  notes?: string;
  franchiseId: number;
}) {
  return repoCreateCustomer(data);
}
