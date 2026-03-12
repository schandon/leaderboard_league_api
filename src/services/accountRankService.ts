import prisma from "../lib/prisma";
import type { CreateAccountRankInput } from "../schemas/accountRankSchemas";

const accountRankSelect = {
  id: true,
  tier: true,
  rank: true,
  leaguePoints: true,
  wins: true,
  losses: true,
  fkAccount: true,
  createdAt: true,
} as const;

export async function create(data: CreateAccountRankInput) {
  const accountExists = await prisma.account.findUnique({ where: { id: data.fkAccount } });

  if (!accountExists) {
    const error = new Error("Conta não encontrada");
    (error as any).statusCode = 404;
    throw error;
  }

  return prisma.accountRank.create({
    data: {
      tier: data.tier,
      rank: data.rank,
      leaguePoints: data.leaguePoints,
      wins: data.wins,
      losses: data.losses,
      fkAccount: data.fkAccount,
    },
    select: accountRankSelect,
  });
}

export async function findByAccountId(accountId: string) {
  return prisma.accountRank.findMany({
    where: { fkAccount: accountId },
    select: accountRankSelect,
    orderBy: { createdAt: "desc" },
  });
}

export async function findLatestByAccountId(accountId: string) {
  const latest = await prisma.accountRank.findFirst({
    where: { fkAccount: accountId },
    select: accountRankSelect,
    orderBy: { createdAt: "desc" },
  });

  if (!latest) {
    const error = new Error("Nenhum snapshot de rank encontrado para esta conta");
    (error as any).statusCode = 404;
    throw error;
  }

  return latest;
}
