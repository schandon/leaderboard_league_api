import { describe, it, expect, vi, beforeEach } from "vitest";

// async factory: uses dynamic import() to load ESM-only vitest-mock-extended
vi.mock("../../lib/prisma", async () => {
  const { mockDeep } = await import("vitest-mock-extended");
  return { default: mockDeep() };
});

vi.mock("bcryptjs", () => ({
  hash: vi.fn().mockResolvedValue("hashed_password"),
  compare: vi.fn(),
}));

vi.mock("jsonwebtoken", () => ({
  default: {
    sign: vi.fn().mockReturnValue("mocked_jwt_token"),
    verify: vi.fn(),
  },
}));

import prisma from "../../lib/prisma";
import type { PrismaClient } from "../../generated/prisma/client";
import type { DeepMockProxy } from "vitest-mock-extended";
import { mockReset } from "vitest-mock-extended";
import { hash, compare } from "bcryptjs";
import * as userService from "../userService";

// prisma IS the mockDeep() instance from the factory above
const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
const hashMock = hash as ReturnType<typeof vi.fn>;
const compareMock = compare as ReturnType<typeof vi.fn>;

const fakeUser = {
  id: "user-uuid-1",
  email: "joao@email.com",
  name: "Joao Silva",
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

const fakeUserWithPassword = { ...fakeUser, password: "hashed_password" };

beforeEach(() => {
  mockReset(prismaMock);
  vi.clearAllMocks();
  hashMock.mockResolvedValue("hashed_password");
});

describe("userService", () => {
  describe("register", () => {
    it("should create a user and return data without password (happy path)", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue(fakeUser as any);

      const result = await userService.register({
        name: "Joao Silva",
        email: "joao@email.com",
        password: "senha123",
      });

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: "joao@email.com" },
      });
      expect(hashMock).toHaveBeenCalledWith("senha123", 10);
      expect(result).toEqual(fakeUser);
      expect(result).not.toHaveProperty("password");
    });

    it("should throw 409 when email is already in use", async () => {
      prismaMock.user.findUnique.mockResolvedValue(fakeUserWithPassword as any);

      await expect(
        userService.register({
          name: "Joao Silva",
          email: "joao@email.com",
          password: "senha123",
        }),
      ).rejects.toMatchObject({ statusCode: 409, message: "E-mail já está em uso" });
    });
  });

  describe("login", () => {
    it("should return a JWT token on valid credentials (happy path)", async () => {
      prismaMock.user.findUnique.mockResolvedValue(fakeUserWithPassword as any);
      compareMock.mockResolvedValue(true);

      const result = await userService.login({
        email: "joao@email.com",
        password: "senha123",
      });

      expect(result).toEqual({ token: "mocked_jwt_token" });
    });

    it("should throw 401 when email is not found", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        userService.login({ email: "naoexiste@email.com", password: "senha123" }),
      ).rejects.toMatchObject({ statusCode: 401, message: "Credenciais inválidas" });
    });

    it("should throw 401 when password does not match", async () => {
      prismaMock.user.findUnique.mockResolvedValue(fakeUserWithPassword as any);
      compareMock.mockResolvedValue(false);

      await expect(
        userService.login({ email: "joao@email.com", password: "senhaerrada" }),
      ).rejects.toMatchObject({ statusCode: 401, message: "Credenciais inválidas" });
    });
  });

  describe("findAll", () => {
    it("should return a list of users", async () => {
      prismaMock.user.findMany.mockResolvedValue([fakeUser] as any);

      const result = await userService.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(fakeUser);
    });
  });

  describe("findById", () => {
    it("should return a user by ID (happy path)", async () => {
      prismaMock.user.findUnique.mockResolvedValue(fakeUser as any);

      const result = await userService.findById("user-uuid-1");

      expect(result).toEqual(fakeUser);
    });

    it("should throw 404 when user is not found", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(userService.findById("nonexistent-id")).rejects.toMatchObject({
        statusCode: 404,
        message: "Usuário não encontrado",
      });
    });
  });

  describe("update", () => {
    it("should update user name (happy path)", async () => {
      prismaMock.user.findUnique.mockResolvedValue(fakeUser as any);
      const updatedUser = { ...fakeUser, name: "Novo Nome" };
      prismaMock.user.update.mockResolvedValue(updatedUser as any);

      const result = await userService.update("user-uuid-1", { name: "Novo Nome" });

      expect(result).toEqual(updatedUser);
    });

    it("should hash password when updating it", async () => {
      prismaMock.user.findUnique.mockResolvedValue(fakeUser as any);
      prismaMock.user.update.mockResolvedValue(fakeUser as any);

      await userService.update("user-uuid-1", { password: "novasenha" });

      expect(hashMock).toHaveBeenCalledWith("novasenha", 10);
    });

    it("should throw 404 when user to update is not found", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        userService.update("nonexistent-id", { name: "Novo Nome" }),
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe("remove", () => {
    it("should delete user successfully (happy path)", async () => {
      prismaMock.user.findUnique.mockResolvedValue(fakeUser as any);
      prismaMock.user.delete.mockResolvedValue(fakeUserWithPassword as any);

      await expect(userService.remove("user-uuid-1")).resolves.toBeUndefined();
      expect(prismaMock.user.delete).toHaveBeenCalledWith({ where: { id: "user-uuid-1" } });
    });

    it("should throw 404 when user to remove is not found", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(userService.remove("nonexistent-id")).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });
});
