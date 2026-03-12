import { z } from "zod";

export const createAccountSchema = z.object({
  usernameRiot: z.string().min(1, "Username Riot é obrigatório"),
  tagRiot: z.string().min(1, "Tag Riot é obrigatória"),
  puuid: z.string().min(1, "PUUID é obrigatório"),
  gameName: z.string().min(1, "Game name é obrigatório"),
  type: z.enum(["LOL", "VALORANT", "TFT", "WILD_RIFT"]),
  status: z.enum(["ACTIVE", "INACTIVE", "BANNED"]),
  fkUser: z.string().uuid("ID do usuário inválido"),
});

// fk_user é omitido: a regra de negócio proíbe a transferência de conta entre usuários
export const updateAccountSchema = createAccountSchema
  .omit({ fkUser: true })
  .partial();

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
