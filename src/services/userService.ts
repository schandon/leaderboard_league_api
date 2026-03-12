import { hash, compare } from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";
import type { RegisterInput, LoginInput, UpdateUserInput } from "../schemas/userSchemas";

const JWT_SECRET = process.env.JWT_SECRET ?? "fallback-secret";
const SALT_ROUNDS = 10;

const userSelect = {
  id: true,
  email: true,
  name: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function register(data: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });

  if (existing) {
    const error = new Error("E-mail já está em uso");
    (error as any).statusCode = 409;
    throw error;
  }

  const hashedPassword = await hash(data.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
    },
    select: userSelect,
  });

  return user;
}

export async function login(data: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: data.email } });

  if (!user) {
    const error = new Error("Credenciais inválidas");
    (error as any).statusCode = 401;
    throw error;
  }

  const passwordMatch = await compare(data.password, user.password);

  if (!passwordMatch) {
    const error = new Error("Credenciais inválidas");
    (error as any).statusCode = 401;
    throw error;
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "1d" });

  return { token };
}

export async function findAll() {
  return prisma.user.findMany({ select: userSelect });
}

export async function findById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: userSelect,
  });

  if (!user) {
    const error = new Error("Usuário não encontrado");
    (error as any).statusCode = 404;
    throw error;
  }

  return user;
}

export async function update(id: string, data: UpdateUserInput) {
  await findById(id);

  if (data.password) {
    data.password = await hash(data.password, SALT_ROUNDS);
  }

  return prisma.user.update({
    where: { id },
    data,
    select: userSelect,
  });
}

export async function remove(id: string) {
  await findById(id);
  await prisma.user.delete({ where: { id } });
}
