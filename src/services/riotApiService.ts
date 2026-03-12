import { riotFetch } from "../lib/riotFetch";
import type { RiotLeagueEntry, RiotSummoner } from "../types/riot";

const DEFAULT_REGION = process.env.RIOT_DEFAULT_REGION ?? "br1";

export async function getSummonerByPuuid(
  puuid: string,
  region: string = DEFAULT_REGION,
): Promise<RiotSummoner> {
  const url = `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`;
  return riotFetch<RiotSummoner>(url);
}

export async function getLeagueEntriesBySummonerId(
  summonerId: string,
  region: string = DEFAULT_REGION,
): Promise<RiotLeagueEntry[]> {
  const url = `https://${region}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}`;
  return riotFetch<RiotLeagueEntry[]>(url);
}

export async function getRankedSoloDuo(
  summonerId: string,
  region: string = DEFAULT_REGION,
): Promise<RiotLeagueEntry | null> {
  const entries = await getLeagueEntriesBySummonerId(summonerId, region);
  return entries.find((entry) => entry.queueType === "RANKED_SOLO_5x5") ?? null;
}
