import cron from "node-cron";
import prisma from "../lib/prisma";
import * as riotApiService from "../services/riotApiService";
import * as accountRankService from "../services/accountRankService";
import { RiotApiError } from "../errors/riotApiError";

const DELAY_BETWEEN_ACCOUNTS_MS = 1200;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function rankChanged(
  latest: { tier: string; rank: string; leaguePoints: number; wins: number; losses: number } | null,
  current: { tier: string; rank: string; leaguePoints: number; wins: number; losses: number },
): boolean {
  if (latest === null) return true;
  return (
    latest.tier !== current.tier ||
    latest.rank !== current.rank ||
    latest.leaguePoints !== current.leaguePoints ||
    latest.wins !== current.wins ||
    latest.losses !== current.losses
  );
}

export async function runSyncRanks(): Promise<void> {
  const startedAt = new Date();
  console.log(`[SyncRanks] Sincronização iniciada em ${startedAt.toISOString()}`);

  const accounts = await prisma.account.findMany({
    where: { status: "ACTIVE", type: "LOL" },
    select: { id: true, puuid: true, usernameRiot: true, tagRiot: true },
  });

  console.log(`[SyncRanks] ${accounts.length} conta(s) ACTIVE encontrada(s)`);

  let updated = 0;
  let errors = 0;

  for (const account of accounts) {
    try {
      const summoner = await riotApiService.getSummonerByPuuid(account.puuid);
      const leagueEntry = await riotApiService.getRankedSoloDuo(summoner.id);

      if (!leagueEntry) {
        console.log(`[SyncRanks] Conta ${account.usernameRiot}#${account.tagRiot} não possui ranking Solo/Duo. Ignorando.`);
        await sleep(DELAY_BETWEEN_ACCOUNTS_MS);
        continue;
      }

      const current = {
        tier: leagueEntry.tier,
        rank: leagueEntry.rank,
        leaguePoints: leagueEntry.leaguePoints,
        wins: leagueEntry.wins,
        losses: leagueEntry.losses,
      };

      let latest: { tier: string; rank: string; leaguePoints: number; wins: number; losses: number } | null = null;

      try {
        latest = await accountRankService.findLatestByAccountId(account.id);
      } catch {
        // Nenhum snapshot existente — sera criado o primeiro
      }

      if (rankChanged(latest, current)) {
        await accountRankService.create({ fkAccount: account.id, ...current });
        console.log(
          `[SyncRanks] Rank atualizado: ${account.usernameRiot}#${account.tagRiot} → ${current.tier} ${current.rank} ${current.leaguePoints}LP`,
        );
        updated++;
      } else {
        console.log(`[SyncRanks] Sem alteração: ${account.usernameRiot}#${account.tagRiot}`);
      }
    } catch (err) {
      errors++;
      if (err instanceof RiotApiError) {
        console.error(
          `[SyncRanks] Erro na Riot API para ${account.usernameRiot}#${account.tagRiot}: ${err.message} (HTTP ${err.riotStatusCode})`,
        );
      } else if (err instanceof Error) {
        console.error(`[SyncRanks] Erro inesperado para ${account.usernameRiot}#${account.tagRiot}: ${err.message}`);
      }
    }

    await sleep(DELAY_BETWEEN_ACCOUNTS_MS);
  }

  const finishedAt = new Date();
  const durationMs = finishedAt.getTime() - startedAt.getTime();
  console.log(
    `[SyncRanks] Sincronização finalizada em ${finishedAt.toISOString()} — ` +
      `${accounts.length} conta(s) processada(s), ${updated} atualizada(s), ${errors} erro(s) — ${durationMs}ms`,
  );
}

export function startSyncJob(): void {
  // Executa a cada 30 minutos
  const schedule = "*/30 * * * *";

  cron.schedule(schedule, () => {
    runSyncRanks().catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[SyncRanks] Falha crítica no job de sincronização: ${message}`);
    });
  });

  console.log(`[SyncRanks] Job de sincronização agendado (${schedule})`);
}
