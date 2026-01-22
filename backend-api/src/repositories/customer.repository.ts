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

export async function updateCustomer(id: number, data: Partial<{
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
