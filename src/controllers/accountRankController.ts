import { Request, Response } from "express";
import { createAccountRankSchema } from "../schemas/accountRankSchemas";
import * as accountRankService from "../services/accountRankService";

export async function create(req: Request, res: Response) {
  const data = createAccountRankSchema.parse(req.body);
  const accountRank = await accountRankService.create(data);
  res.status(201).json(accountRank);
}

export async function findByAccountId(req: Request<{ accountId: string }>, res: Response) {
  const ranks = await accountRankService.findByAccountId(req.params.accountId);
  res.json(ranks);
}

export async function findLatestByAccountId(req: Request<{ accountId: string }>, res: Response) {
  const latest = await accountRankService.findLatestByAccountId(req.params.accountId);
  res.json(latest);
}
