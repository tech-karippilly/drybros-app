import {
  getAllCustomers,
  getCustomerById,
  getCustomerByPhone,
  createCustomer as repoCreateCustomer,
  updateCustomer,
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

export async function findOrCreateCustomer(data: {
  fullName: string;
  phone: string;
  email?: string;
  city?: string;
  notes?: string;
  franchiseId: string;
}): Promise<{ customer: any; isExisting: boolean }> {
  // Check if customer exists by phone
  const existingCustomer = await getCustomerByPhone(data.phone);
  
  if (existingCustomer) {
    // Update customer if new information is provided
    const updateData: any = {};
    if (data.email && !existingCustomer.email) {
      updateData.email = data.email;
    }
    if (data.city && !existingCustomer.city) {
      updateData.city = data.city;
    }
    if (data.notes && !existingCustomer.notes) {
      updateData.notes = data.notes;
    }
    if (data.fullName && existingCustomer.fullName !== data.fullName) {
      updateData.fullName = data.fullName;
    }
    
    if (Object.keys(updateData).length > 0) {
      const updated = await updateCustomer(existingCustomer.id, updateData);
      return { customer: updated, isExisting: true };
    }
    
    return { customer: existingCustomer, isExisting: true };
  }
  
  // Create new customer
  const newCustomer = await repoCreateCustomer(data);
  return { customer: newCustomer, isExisting: false };
}

export async function createCustomer(data: {
  fullName: string;
  phone: string;
  email?: string;
  city?: string;
  notes?: string;
  franchiseId: string;
}) {
  return repoCreateCustomer(data);
}
