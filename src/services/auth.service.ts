import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt, { SignOptions, Secret } from "jsonwebtoken";

import { authConfig } from "../config/authConfig";

const prisma = new PrismaClient();

interface RegisterAdminInput {
  fullName: string;
  email: string;
  password: string;
}

interface LoginInput {
  email: string;
  password: string;
}

export async function registerAdmin(input: RegisterAdminInput) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existing) {
    const err: any = new Error("Email already in use");
    err.statusCode = 400;
    throw err;
  }

  const hashed = await bcrypt.hash(input.password, 10);

  const user = await prisma.user.create({
    data: {
      fullName: input.fullName,
      email: input.email,
      password: hashed,
      role: UserRole.ADMIN,
    },
  });

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
  };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || !user.isActive) {
    const err: any = new Error("Invalid credentials");
    err.statusCode = 401;
    throw err;
  }

  const ok = await bcrypt.compare(input.password, user.password);
  if (!ok) {
    const err: any = new Error("Invalid credentials");
    err.statusCode = 401;
    throw err;
  }
  const payload = {
    userId: user.id,
    role: user.role,
    fullName: user.fullName,
    email: user.email,
  };

  // cast secret/options to the expected types
  const token = jwt.sign(
    payload,
    authConfig.jwtSecret as Secret,
    { expiresIn: authConfig.jwtExpiresIn } as SignOptions
  );
  return {
    accessToken: token,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    },
  };
}
