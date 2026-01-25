import prisma from "../config/prismaClient";

/** Count trips booked by a customer (where customerId matches) */
export async function getTripsCountByCustomerId(customerId: string): Promise<number> {
  return prisma.trip.count({
    where: { customerId },
  });
}

/** Count complaints raised by a customer (where customerId matches) */
export async function getComplaintsCountByCustomerId(customerId: string): Promise<number> {
  return prisma.complaint.count({
    where: { customerId },
  });
}

export async function getAllCustomers() {
  return prisma.customer.findMany({
    orderBy: { createdAt: "asc" },
  });
}

export async function getCustomerById(id: string) {
  return prisma.customer.findUnique({
    where: { id },
  });
}

export async function getCustomerByPhone(phone: string) {
  return prisma.customer.findUnique({
    where: { phone },
  });
}

export async function createCustomer(data: {
  fullName: string;
  phone: string;
  email?: string;
  city?: string;
  notes?: string;
  franchiseId: string;
}) {
  return prisma.customer.create({
    data: {
      ...data,
      updatedAt: new Date(),
    },
  });
}

export async function updateCustomer(id: string, data: Partial<{
  fullName: string;
  email: string;
  city: string;
  notes: string;
}>) {
  return prisma.customer.update({
    where: { id },
    data,
  });
}
