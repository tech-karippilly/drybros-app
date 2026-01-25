import {
  getAllCustomers,
  getCustomerById,
  getCustomerByPhone,
  createCustomer as repoCreateCustomer,
  updateCustomer,
  getTripsCountByCustomerId,
  getComplaintsCountByCustomerId,
} from "../repositories/customer.repository";
import { logActivity } from "./activity.service";
import { ActivityAction, ActivityEntityType } from "@prisma/client";
import { CUSTOMER_ERROR_MESSAGES } from "../constants/customer";

export async function listCustomers() {
  return getAllCustomers();
}

export async function getCustomer(id: string) {
  const customer = await getCustomerById(id);
  if (!customer) {
    const err: any = new Error(CUSTOMER_ERROR_MESSAGES.NOT_FOUND);
    err.statusCode = 404;
    throw err;
  }
  return customer;
}

/**
 * Get customer details with history: profile + trips booked count + complaints raised count.
 */
export async function getCustomerDetails(id: string) {
  const customer = await getCustomerById(id);
  if (!customer) {
    const err: any = new Error(CUSTOMER_ERROR_MESSAGES.NOT_FOUND);
    err.statusCode = 404;
    throw err;
  }
  const [tripsBooked, complaintsRaised] = await Promise.all([
    getTripsCountByCustomerId(id),
    getComplaintsCountByCustomerId(id),
  ]);
  return {
    ...customer,
    tripsBooked,
    complaintsRaised,
  };
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
      
      // Log customer update activity
      logActivity({
        action: ActivityAction.CUSTOMER_UPDATED,
        entityType: ActivityEntityType.CUSTOMER,
        entityId: updated.id,
        franchiseId: data.franchiseId,
        description: `Customer ${updated.fullName} (${updated.phone}) updated`,
        metadata: {
          customerName: updated.fullName,
          customerPhone: updated.phone,
          updatedFields: Object.keys(updateData),
        },
      });
      
      return { customer: updated, isExisting: true };
    }
    
    return { customer: existingCustomer, isExisting: true };
  }
  
  // Create new customer
  const newCustomer = await repoCreateCustomer(data);
  
  // Log customer creation activity
  logActivity({
    action: ActivityAction.CUSTOMER_CREATED,
    entityType: ActivityEntityType.CUSTOMER,
    entityId: newCustomer.id,
    franchiseId: data.franchiseId,
    description: `Customer ${newCustomer.fullName} (${newCustomer.phone}) created`,
    metadata: {
      customerName: newCustomer.fullName,
      customerPhone: newCustomer.phone,
      customerEmail: newCustomer.email,
      city: newCustomer.city,
    },
  });
  
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
  const customer = await repoCreateCustomer(data);
  
  // Log customer creation activity
  logActivity({
    action: ActivityAction.CUSTOMER_CREATED,
    entityType: ActivityEntityType.CUSTOMER,
    entityId: customer.id,
    franchiseId: data.franchiseId,
    description: `Customer ${customer.fullName} (${customer.phone}) created`,
    metadata: {
      customerName: customer.fullName,
      customerPhone: customer.phone,
      customerEmail: customer.email,
      city: customer.city,
    },
  });
  
  return customer;
}
