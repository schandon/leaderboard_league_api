import { z } from "zod";

export const createAccountRankSchema = z.object({
  tier: z.string().min(1, "Tier é obrigatório"),
  rank: z.string().min(1, "Rank é obrigatório"),
  leaguePoints: z.number().int().nonnegative("League points não pode ser negativo"),
  wins: z.number().int().nonnegative("Wins não pode ser negativo"),
  losses: z.number().int().nonnegative("Losses não pode ser negativo"),
  fkAccount: z.string().uuid("ID da conta inválido"),
});

export type CreateAccountRankInput = z.infer<typeof createAccountRankSchema>;
