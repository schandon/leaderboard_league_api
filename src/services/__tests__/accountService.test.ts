import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../lib/prisma", async () => {
  const { mockDeep } = await import("vitest-mock-extended");
  return { default: mockDeep() };
});

import prisma from "../../lib/prisma";
import type { PrismaClient } from "../../generated/prisma/client";
import type { DeepMockProxy } from "vitest-mock-extended";
import { mockReset } from "vitest-mock-extended";
import * as accountService from "../accountService";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

const fakeUser = {
  id: "user-uuid-1",
  email: "joao@email.com",
  name: "Joao Silva",
  password: "hashed",
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

const fakeAccount = {
  id: "account-uuid-1",
  usernameRiot: "Faker",
  tagRiot: "KR1",
  puuid: "puuid-abc-123",
  gameName: "Faker",
  type: "LOL" as const,
  status: "ACTIVE" as const,
  fkUser: "user-uuid-1",
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

beforeEach(() => {
  mockReset(prismaMock);
});

describe("accountService", () => {
  describe("create", () => {
    it("should create account when user exists (happy path)", async () => {
      prismaMock.user.findUnique.mockResolvedValue(fakeUser as any);
      prismaMock.account.create.mockResolvedValue(fakeAccount as any);

      const result = await accountService.create({
        usernameRiot: "Faker",
        tagRiot: "KR1",
        puuid: "puuid-abc-123",
        gameName: "Faker",
        type: "LOL",
        status: "ACTIVE",
        fkUser: "user-uuid-1",
      });

      expect(result).toEqual(fakeAccount);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user-uuid-1" },
      });
    });

    it("should throw 404 when fkUser does not exist", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        accountService.create({
          usernameRiot: "Faker",
          tagRiot: "KR1",
          puuid: "puuid-abc-123",
          gameName: "Faker",
          type: "LOL",
          status: "ACTIVE",
          fkUser: "nonexistent-user",
        }),
      ).rejects.toMatchObject({ statusCode: 404, message: "Usuário não encontrado" });
    });
  });

  describe("findAll", () => {
    it("should return a list of accounts", async () => {
      prismaMock.account.findMany.mockResolvedValue([fakeAccount] as any);

      const result = await accountService.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(fakeAccount);
    });
  });

  describe("findById", () => {
    it("should return an account by ID (happy path)", async () => {
      prismaMock.account.findUnique.mockResolvedValue(fakeAccount as any);

      const result = await accountService.findById("account-uuid-1");

      expect(result).toEqual(fakeAccount);
    });

    it("should throw 404 when account is not found", async () => {
      prismaMock.account.findUnique.mockResolvedValue(null);

      await expect(accountService.findById("nonexistent-id")).rejects.toMatchObject({
        statusCode: 404,
        message: "Conta não encontrada",
      });
    });
  });

  describe("findByUserId", () => {
    it("should return accounts filtered by userId", async () => {
      prismaMock.account.findMany.mockResolvedValue([fakeAccount] as any);

      const result = await accountService.findByUserId("user-uuid-1");

      expect(prismaMock.account.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { fkUser: "user-uuid-1" } }),
      );
      expect(result).toHaveLength(1);
    });
  });

  describe("update", () => {
    it("should update account fields (happy path)", async () => {
      prismaMock.account.findUnique.mockResolvedValue(fakeAccount as any);
      const updated = { ...fakeAccount, status: "INACTIVE" as const };
      prismaMock.account.update.mockResolvedValue(updated as any);

      const result = await accountService.update("account-uuid-1", { status: "INACTIVE" });

      expect(result.status).toBe("INACTIVE");
    });

    it("should throw 404 when account to update is not found", async () => {
      prismaMock.account.findUnique.mockResolvedValue(null);

      await expect(
        accountService.update("nonexistent-id", { status: "INACTIVE" }),
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe("remove", () => {
    it("should delete account successfully (happy path)", async () => {
      prismaMock.account.findUnique.mockResolvedValue(fakeAccount as any);
      prismaMock.account.delete.mockResolvedValue(fakeAccount as any);

      await expect(accountService.remove("account-uuid-1")).resolves.toBeUndefined();
      expect(prismaMock.account.delete).toHaveBeenCalledWith({ where: { id: "account-uuid-1" } });
    });

    it("should throw 404 when account to remove is not found", async () => {
      prismaMock.account.findUnique.mockResolvedValue(null);

      await expect(accountService.remove("nonexistent-id")).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });
});
