import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../lib/prisma", async () => {
  const { mockDeep } = await import("vitest-mock-extended");
  return { default: mockDeep() };
});

import prisma from "../../lib/prisma";
import type { PrismaClient } from "../../generated/prisma/client";
import type { DeepMockProxy } from "vitest-mock-extended";
import { mockReset } from "vitest-mock-extended";
import * as accountRankService from "../accountRankService";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

const fakeAccount = {
  id: "account-uuid-1",
  usernameRiot: "Faker",
  tagRiot: "KR1",
  puuid: "puuid-abc-123",
  gameName: "Faker",
  type: "LOL",
  status: "ACTIVE",
  fkUser: "user-uuid-1",
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

const fakeRank = {
  id: "rank-uuid-1",
  tier: "DIAMOND",
  rank: "I",
  leaguePoints: 75,
  wins: 100,
  losses: 80,
  fkAccount: "account-uuid-1",
  createdAt: new Date("2026-03-12"),
};

beforeEach(() => {
  mockReset(prismaMock);
});

describe("accountRankService", () => {
  describe("create", () => {
    it("should create a rank snapshot when account exists (happy path)", async () => {
      prismaMock.account.findUnique.mockResolvedValue(fakeAccount as any);
      prismaMock.accountRank.create.mockResolvedValue(fakeRank as any);

      const result = await accountRankService.create({
        tier: "DIAMOND",
        rank: "I",
        leaguePoints: 75,
        wins: 100,
        losses: 80,
        fkAccount: "account-uuid-1",
      });

      expect(result).toEqual(fakeRank);
      expect(prismaMock.account.findUnique).toHaveBeenCalledWith({
        where: { id: "account-uuid-1" },
      });
    });

    it("should throw 404 when fkAccount does not exist", async () => {
      prismaMock.account.findUnique.mockResolvedValue(null);

      await expect(
        accountRankService.create({
          tier: "DIAMOND",
          rank: "I",
          leaguePoints: 75,
          wins: 100,
          losses: 80,
          fkAccount: "nonexistent-account",
        }),
      ).rejects.toMatchObject({ statusCode: 404, message: "Conta não encontrada" });
    });
  });

  describe("findByAccountId", () => {
    it("should return rank history ordered by createdAt desc", async () => {
      const olderRank = { ...fakeRank, id: "rank-uuid-0", createdAt: new Date("2026-03-01") };
      prismaMock.accountRank.findMany.mockResolvedValue([fakeRank, olderRank] as any);

      const result = await accountRankService.findByAccountId("account-uuid-1");

      expect(prismaMock.accountRank.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { fkAccount: "account-uuid-1" },
          orderBy: { createdAt: "desc" },
        }),
      );
      expect(result).toHaveLength(2);
    });
  });

  describe("findLatestByAccountId", () => {
    it("should return the most recent rank snapshot (happy path)", async () => {
      prismaMock.accountRank.findFirst.mockResolvedValue(fakeRank as any);

      const result = await accountRankService.findLatestByAccountId("account-uuid-1");

      expect(result).toEqual(fakeRank);
    });

    it("should throw 404 when no snapshot exists for the account", async () => {
      prismaMock.accountRank.findFirst.mockResolvedValue(null);

      await expect(
        accountRankService.findLatestByAccountId("account-uuid-1"),
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "Nenhum snapshot de rank encontrado para esta conta",
      });
    });
  });
});
