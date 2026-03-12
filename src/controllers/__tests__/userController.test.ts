import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../lib/prisma", async () => {
  const { mockDeep } = await import("vitest-mock-extended");
  return { default: mockDeep() };
});

vi.mock("bcryptjs", () => ({
  hash: vi.fn().mockResolvedValue("hashed_password"),
  compare: vi.fn().mockResolvedValue(true),
}));

// jwt.verify returns a valid payload so authMiddleware passes
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
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

const AUTH_HEADER = { Authorization: "Bearer mocked_jwt_token" };

beforeEach(() => {
  mockReset(prismaMock);
  vi.clearAllMocks();
});

describe("userController", () => {
  describe("POST /api/register", () => {
    it("should return 201 with user data on valid body (happy path)", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue(fakeUser as any);

      const res = await request(app).post("/api/register").send({
        name: "Joao Silva",
        email: "joao@email.com",
        password: "senha123",
      });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ email: "joao@email.com" });
      expect(res.body).not.toHaveProperty("password");
    });

    it("should return 400 when email is invalid (Zod validation)", async () => {
      const res = await request(app).post("/api/register").send({
        name: "Joao Silva",
        email: "email-invalido",
        password: "senha123",
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("errors");
    });

    it("should return 400 when password is too short (< 6 chars)", async () => {
      const res = await request(app).post("/api/register").send({
        name: "Joao Silva",
        email: "joao@email.com",
        password: "123",
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("errors");
    });

    it("should return 409 when email is already in use", async () => {
      prismaMock.user.findUnique.mockResolvedValue({ ...fakeUser, password: "hashed" } as any);

      const res = await request(app).post("/api/register").send({
        name: "Joao Silva",
        email: "joao@email.com",
        password: "senha123",
      });

      expect(res.status).toBe(409);
      expect(res.body).toMatchObject({ message: "E-mail já está em uso" });
    });
  });

  describe("POST /api/login", () => {
    it("should return 200 with token on valid credentials (happy path)", async () => {
      prismaMock.user.findUnique.mockResolvedValue({ ...fakeUser, password: "hashed" } as any);

      const res = await request(app).post("/api/login").send({
        email: "joao@email.com",
        password: "senha123",
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("token");
    });

    it("should return 400 when body is missing required fields", async () => {
      const res = await request(app).post("/api/login").send({});

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("errors");
    });

    it("should return 401 on invalid credentials", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const res = await request(app).post("/api/login").send({
        email: "naoexiste@email.com",
        password: "senha123",
      });

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/users", () => {
    it("should return 200 with user list when authenticated", async () => {
      prismaMock.user.findMany.mockResolvedValue([fakeUser] as any);

      const res = await request(app).get("/api/users").set(AUTH_HEADER);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });

    it("should return 401 when no token is provided", async () => {
      const res = await request(app).get("/api/users");

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/users/:id", () => {
    it("should return 200 with user when found (happy path)", async () => {
      prismaMock.user.findUnique.mockResolvedValue(fakeUser as any);

      const res = await request(app).get("/api/users/user-uuid-1").set(AUTH_HEADER);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: "user-uuid-1" });
    });

    it("should return 404 when user is not found", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const res = await request(app).get("/api/users/nonexistent-id").set(AUTH_HEADER);

      expect(res.status).toBe(404);
    });
  });

  describe("PUT /api/users/:id", () => {
    it("should return 200 with updated user (happy path)", async () => {
      prismaMock.user.findUnique.mockResolvedValue(fakeUser as any);
      prismaMock.user.update.mockResolvedValue({ ...fakeUser, name: "Novo Nome" } as any);

      const res = await request(app)
        .put("/api/users/user-uuid-1")
        .set(AUTH_HEADER)
        .send({ name: "Novo Nome" });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Novo Nome");
    });

    it("should return 400 when update body has empty name string", async () => {
      const res = await request(app)
        .put("/api/users/user-uuid-1")
        .set(AUTH_HEADER)
        .send({ name: "" });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("errors");
    });
  });

  describe("DELETE /api/users/:id", () => {
    it("should return 204 on successful deletion (happy path)", async () => {
      prismaMock.user.findUnique.mockResolvedValue(fakeUser as any);
      prismaMock.user.delete.mockResolvedValue(fakeUser as any);

      const res = await request(app).delete("/api/users/user-uuid-1").set(AUTH_HEADER);

      expect(res.status).toBe(204);
    });

    it("should return 404 when user to delete is not found", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const res = await request(app).delete("/api/users/nonexistent-id").set(AUTH_HEADER);

      expect(res.status).toBe(404);
    });
  });
});
