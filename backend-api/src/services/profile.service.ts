// src/services/profile.service.ts
import { NotFoundError, BadRequestError } from "../utils/errors";
import prisma from "../config/prismaClient";
import bcrypt from "bcryptjs";

export async function getMyProfile(userId: string) {
  const user = await prisma.staff.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError("User not found");
  // Remove sensitive fields
  const { password, ...profile } = user;
  return profile;
}

export async function updateMyProfile(userId: string, data: any) {
  const user = await prisma.staff.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError("User not found");
  // Only allow certain fields to be updated
  const allowedFields = ["name", "email", "phone", "profilePic", "address"];
  const updateData: any = {};
  for (const key of allowedFields) {
    if (data[key] !== undefined) updateData[key] = data[key];
  }
  const updated = await prisma.staff.update({ where: { id: userId }, data: updateData });
  const { password, ...profile } = updated;
  return profile;
}

export async function resetMyPassword(userId: string, oldPassword: string, newPassword: string) {
  const user = await prisma.staff.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError("User not found");
  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) throw new BadRequestError("Old password is incorrect");
  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.staff.update({ where: { id: userId }, data: { password: hashed } });
  return true;
}
