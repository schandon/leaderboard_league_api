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

const AUTH_HEADER = { Authorization: "Bearer mocked_jwt_token" };

const validRankBody = {
  tier: "DIAMOND",
  rank: "I",
  leaguePoints: 75,
  wins: 100,
  losses: 80,
  fkAccount: "550e8400-e29b-41d4-a716-446655440000",
};

beforeEach(() => {
  mockReset(prismaMock);
  vi.clearAllMocks();
});

describe("accountRankController", () => {
  describe("POST /api/account-ranks", () => {
    it("should return 201 on valid body and existing account (happy path)", async () => {
      prismaMock.account.findUnique.mockResolvedValue(fakeAccount as any);
      prismaMock.accountRank.create.mockResolvedValue(fakeRank as any);

      const res = await request(app)
        .post("/api/account-ranks")
        .set(AUTH_HEADER)
        .send(validRankBody);

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ tier: "DIAMOND", rank: "I" });
    });

    it("should return 400 when required fields are missing", async () => {
      const res = await request(app)
        .post("/api/account-ranks")
        .set(AUTH_HEADER)
        .send({ tier: "DIAMOND" });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("errors");
    });

    it("should return 400 when leaguePoints is negative", async () => {
      const res = await request(app)
        .post("/api/account-ranks")
        .set(AUTH_HEADER)
        .send({ ...validRankBody, leaguePoints: -1 });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("errors");
    });

    it("should return 400 when fkAccount is not a valid UUID", async () => {
      const res = await request(app)
        .post("/api/account-ranks")
        .set(AUTH_HEADER)
        .send({ ...validRankBody, fkAccount: "not-a-uuid" });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("errors");
    });

    it("should return 404 when fkAccount does not exist", async () => {
      prismaMock.account.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post("/api/account-ranks")
        .set(AUTH_HEADER)
        .send(validRankBody);

      expect(res.status).toBe(404);
    });

    it("should return 401 when no token is provided", async () => {
      const res = await request(app).post("/api/account-ranks").send(validRankBody);

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/account-ranks/account/:accountId", () => {
    it("should return 200 with rank history (happy path)", async () => {
      prismaMock.accountRank.findMany.mockResolvedValue([fakeRank] as any);

      const res = await request(app)
        .get("/api/account-ranks/account/account-uuid-1")
        .set(AUTH_HEADER);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toMatchObject({ tier: "DIAMOND" });
    });

    it("should return 401 when no token is provided", async () => {
      const res = await request(app).get("/api/account-ranks/account/account-uuid-1");

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/account-ranks/account/:accountId/latest", () => {
    it("should return 200 with latest rank snapshot (happy path)", async () => {
      prismaMock.accountRank.findFirst.mockResolvedValue(fakeRank as any);

      const res = await request(app)
        .get("/api/account-ranks/account/account-uuid-1/latest")
        .set(AUTH_HEADER);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ tier: "DIAMOND", rank: "I" });
    });

    it("should return 404 when no snapshot exists", async () => {
      prismaMock.accountRank.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .get("/api/account-ranks/account/account-uuid-1/latest")
        .set(AUTH_HEADER);

      expect(res.status).toBe(404);
    });
  });
});
