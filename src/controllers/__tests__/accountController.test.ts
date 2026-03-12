import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../lib/prisma", async () => {
  const { mockDeep } = await import("vitest-mock-extended");
  return { default: mockDeep() };
});

vi.mock("bcryptjs", () => ({
  hash: vi.fn().mockResolvedValue("hashed_password"),
  compare: vi.fn().mockResolvedValue(true),
}));

vi.mock("jsonwebtoken", () => ({
  default: {
    sign: vi.fn().mockReturnValue("mocked_jwt_token"),
    verify: vi.fn().mockReturnValue({ userId: "user-uuid-1" }),
  },
}));

import request from "supertest";
import prisma from "../../lib/prisma";
import type { PrismaClient } from "../../generated/prisma/client";
import type { DeepMockProxy } from "vitest-mock-extended";
import { mockReset } from "vitest-mock-extended";
import app from "../../app";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

const fakeUser = {
  id: "user-uuid-1",
  email: "joao@email.com",
  name: "Joao Silva",
  password: "hashed_password",
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

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

const AUTH_HEADER = { Authorization: "Bearer mocked_jwt_token" };

const validAccountBody = {
  usernameRiot: "Faker",
  tagRiot: "KR1",
  puuid: "puuid-abc-123",
  gameName: "Faker",
  type: "LOL",
  status: "ACTIVE",
  fkUser: "550e8400-e29b-41d4-a716-446655440000",
};

beforeEach(() => {
  mockReset(prismaMock);
  vi.clearAllMocks();
});

describe("accountController", () => {
  describe("POST /api/accounts", () => {
    it("should return 201 on valid body and existing user (happy path)", async () => {
      prismaMock.user.findUnique.mockResolvedValue(fakeUser as any);
      prismaMock.account.create.mockResolvedValue(fakeAccount as any);

      const res = await request(app)
        .post("/api/accounts")
        .set(AUTH_HEADER)
        .send(validAccountBody);

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ usernameRiot: "Faker" });
    });

    it("should return 400 when required fields are missing", async () => {
      const res = await request(app)
        .post("/api/accounts")
        .set(AUTH_HEADER)
        .send({ usernameRiot: "Faker" });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("errors");
    });

    it("should return 400 when type enum is invalid", async () => {
      const res = await request(app)
        .post("/api/accounts")
        .set(AUTH_HEADER)
        .send({ ...validAccountBody, type: "INVALID_GAME" });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("errors");
    });

    it("should return 400 when fkUser is not a valid UUID", async () => {
      const res = await request(app)
        .post("/api/accounts")
        .set(AUTH_HEADER)
        .send({ ...validAccountBody, fkUser: "not-a-uuid" });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("errors");
    });

    it("should return 404 when fkUser does not exist", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post("/api/accounts")
        .set(AUTH_HEADER)
        .send(validAccountBody);

      expect(res.status).toBe(404);
    });

    it("should return 401 when no token is provided", async () => {
      const res = await request(app).post("/api/accounts").send(validAccountBody);

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/accounts", () => {
    it("should return 200 with accounts list when authenticated", async () => {
      prismaMock.account.findMany.mockResolvedValue([fakeAccount] as any);

      const res = await request(app).get("/api/accounts").set(AUTH_HEADER);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });

    it("should return 401 when no token is provided", async () => {
      const res = await request(app).get("/api/accounts");

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/accounts/:id", () => {
    it("should return 200 with account when found (happy path)", async () => {
      prismaMock.account.findUnique.mockResolvedValue(fakeAccount as any);

      const res = await request(app).get("/api/accounts/account-uuid-1").set(AUTH_HEADER);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: "account-uuid-1" });
    });

    it("should return 404 when account is not found", async () => {
      prismaMock.account.findUnique.mockResolvedValue(null);

      const res = await request(app).get("/api/accounts/nonexistent-id").set(AUTH_HEADER);

      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/accounts/user/:userId", () => {
    it("should return 200 with accounts for a user", async () => {
      prismaMock.account.findMany.mockResolvedValue([fakeAccount] as any);

      const res = await request(app).get("/api/accounts/user/user-uuid-1").set(AUTH_HEADER);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });
  });

  describe("PUT /api/accounts/:id", () => {
    it("should return 200 with updated account (happy path)", async () => {
      prismaMock.account.findUnique.mockResolvedValue(fakeAccount as any);
      prismaMock.account.update.mockResolvedValue({ ...fakeAccount, status: "INACTIVE" } as any);

      const res = await request(app)
        .put("/api/accounts/account-uuid-1")
        .set(AUTH_HEADER)
        .send({ status: "INACTIVE" });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("INACTIVE");
    });

    it("should return 400 when status enum is invalid", async () => {
      const res = await request(app)
        .put("/api/accounts/account-uuid-1")
        .set(AUTH_HEADER)
        .send({ status: "UNKNOWN_STATUS" });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("errors");
    });

    it("should return 404 when account to update is not found", async () => {
      prismaMock.account.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .put("/api/accounts/nonexistent-id")
        .set(AUTH_HEADER)
        .send({ status: "INACTIVE" });

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/accounts/:id", () => {
    it("should return 204 on successful deletion (happy path)", async () => {
      prismaMock.account.findUnique.mockResolvedValue(fakeAccount as any);
      prismaMock.account.delete.mockResolvedValue(fakeAccount as any);

      const res = await request(app).delete("/api/accounts/account-uuid-1").set(AUTH_HEADER);

      expect(res.status).toBe(204);
    });

    it("should return 404 when account to delete is not found", async () => {
      prismaMock.account.findUnique.mockResolvedValue(null);

      const res = await request(app).delete("/api/accounts/nonexistent-id").set(AUTH_HEADER);

      expect(res.status).toBe(404);
    });
  });
});
