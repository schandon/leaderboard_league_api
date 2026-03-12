import prisma from "../lib/prisma";
import type { CreateAccountInput, UpdateAccountInput } from "../schemas/accountSchemas";

const accountSelect = {
  id: true,
  usernameRiot: true,
  tagRiot: true,
  puuid: true,
  gameName: true,
  type: true,
  status: true,
  fkUser: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function create(data: CreateAccountInput) {
  const userExists = await prisma.user.findUnique({ where: { id: data.fkUser } });

  if (!userExists) {
    const error = new Error("Usuário não encontrado");
    (error as any).statusCode = 404;
    throw error;
  }

  return prisma.account.create({
    data: {
      usernameRiot: data.usernameRiot,
      tagRiot: data.tagRiot,
      puuid: data.puuid,
      gameName: data.gameName,
      type: data.type,
      status: data.status,
      fkUser: data.fkUser,
    },
    select: accountSelect,
  });
}

export async function findAll() {
  return prisma.account.findMany({ select: accountSelect });
}

export async function findById(id: string) {
  const account = await prisma.account.findUnique({
    where: { id },
    select: accountSelect,
  });

  if (!account) {
    const error = new Error("Conta não encontrada");
    (error as any).statusCode = 404;
    throw error;
  }

  return account;
}

export async function findByUserId(userId: string) {
  return prisma.account.findMany({
    where: { fkUser: userId },
    select: accountSelect,
  });
}

export async function update(id: string, data: UpdateAccountInput) {
  await findById(id);

  return prisma.account.update({
    where: { id },
    data,
    select: accountSelect,
  });
}

export async function remove(id: string) {
  await findById(id);
  await prisma.account.delete({ where: { id } });
}
