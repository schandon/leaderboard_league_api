import { Request, Response } from "express";
import { createAccountSchema, updateAccountSchema } from "../schemas/accountSchemas";
import * as accountService from "../services/accountService";

export async function create(req: Request, res: Response) {
  const data = createAccountSchema.parse(req.body);
  const account = await accountService.create(data);
  res.status(201).json(account);
}

export async function findAll(_req: Request, res: Response) {
  const accounts = await accountService.findAll();
  res.json(accounts);
}

export async function findById(req: Request<{ id: string }>, res: Response) {
  const account = await accountService.findById(req.params.id);
  res.json(account);
}

export async function findByUserId(req: Request<{ userId: string }>, res: Response) {
  const accounts = await accountService.findByUserId(req.params.userId);
  res.json(accounts);
}

export async function update(req: Request<{ id: string }>, res: Response) {
  const data = updateAccountSchema.parse(req.body);
  const account = await accountService.update(req.params.id, data);
  res.json(account);
}

export async function remove(req: Request<{ id: string }>, res: Response) {
  await accountService.remove(req.params.id);
  res.status(204).send();
}
