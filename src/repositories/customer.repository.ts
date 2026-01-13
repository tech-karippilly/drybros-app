import prisma from "../config/prismaClient";

export async function getAllCustomers() {
  return prisma.customer.findMany({
    orderBy: { id: "asc" },
  });
}

export async function getCustomerById(id: number) {
  return prisma.customer.findUnique({
    where: { id },
  });
}

export async function createCustomer(data: {
  fullName: string;
  phone: string;
  email?: string;
  city?: string;
  notes?: string;
  franchiseId: number;
}) {
  return prisma.customer.create({ data });
}
