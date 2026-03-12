/**
 * Exporta o helper para criar um mock tipado do PrismaClient.
 * Cada arquivo de teste deve chamar vi.mock("../../lib/prisma") + vi.hoisted diretamente,
 * conforme o padrao do Vitest para hoisting garantido.
 */
export { mockDeep, mockReset } from "vitest-mock-extended";
