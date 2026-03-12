import { Request, Response } from "express";
import { registerSchema, loginSchema, updateUserSchema } from "../schemas/userSchemas";
import * as userService from "../services/userService";

export async function register(req: Request, res: Response) {
  const data = registerSchema.parse(req.body);
  const user = await userService.register(data);
  res.status(201).json(user);
}

export async function login(req: Request, res: Response) {
  const data = loginSchema.parse(req.body);
  const result = await userService.login(data);
  res.json(result);
}

export async function findAll(_req: Request, res: Response) {
  const users = await userService.findAll();
  res.json(users);
}

export async function findById(req: Request<{ id: string }>, res: Response) {
  const user = await userService.findById(req.params.id);
  res.json(user);
}

export async function update(req: Request<{ id: string }>, res: Response) {
  const data = updateUserSchema.parse(req.body);
  const user = await userService.update(req.params.id, data);
  res.json(user);
}

export async function remove(req: Request<{ id: string }>, res: Response) {
  await userService.remove(req.params.id);
  res.status(204).send();
}
