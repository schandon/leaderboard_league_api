import { Request, Response, NextFunction } from "express";
import { Prisma } from "../generated/prisma/client";
import { ZodError } from "zod";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      message: "Erro de validação",
      errors: err.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json({ message: "Registro duplicado (constraint única violada)" });
      return;
    }
    if (err.code === "P2025") {
      res.status(404).json({ message: "Registro não encontrado" });
      return;
    }
    if (err.code === "P2003") {
      res.status(409).json({ message: "Não é possível excluir: existem registros vinculados" });
      return;
    }
  }

  const statusCode = (err as any).statusCode ?? 500;
  const message = statusCode === 500 ? "Erro interno do servidor" : err.message;

  if (statusCode === 500) {
    console.error("[ERROR]", err);
  }

  res.status(statusCode).json({ message });
}
