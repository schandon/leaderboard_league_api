import { RiotApiError } from "../errors/riotApiError";

const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function jitter(ms: number): number {
  return ms + Math.floor(Math.random() * ms * 0.3);
}

function getBackoffMs(attempt: number, retryAfterHeader: string | null): number {
  if (retryAfterHeader !== null) {
    const retryAfterSeconds = parseInt(retryAfterHeader, 10);
    if (!isNaN(retryAfterSeconds)) {
      return retryAfterSeconds * 1000;
    }
  }
  return jitter(BASE_BACKOFF_MS * Math.pow(2, attempt));
}

export async function riotFetch<T>(url: string): Promise<T> {
  const apiKey = process.env.RIOT_API_KEY;

  if (!apiKey) {
    throw new RiotApiError(401, "RIOT_API_KEY não configurada nas variáveis de ambiente");
  }

  let lastError: RiotApiError | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    console.log(`[RiotFetch] Tentativa ${attempt + 1}/${MAX_RETRIES} — ${url}`);

    const response = await fetch(url, {
      headers: { "X-Riot-Token": apiKey },
    });

    if (response.ok) {
      console.log(`[RiotFetch] Sucesso — ${url}`);
      return response.json() as Promise<T>;
    }

    if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After");
      const waitMs = getBackoffMs(attempt, retryAfter);
      console.warn(`[RiotFetch] Rate limit (429) atingido. Aguardando ${waitMs}ms antes de nova tentativa...`);
      lastError = new RiotApiError(429);

      if (attempt < MAX_RETRIES - 1) {
        await sleep(waitMs);
        continue;
      }
    }

    // Erros não recuperáveis — não tentar novamente
    throw new RiotApiError(response.status);
  }

  // Estourou tentativas por rate limit
  throw lastError ?? new RiotApiError(429);
}

/*
 * TODO: Cache Redis para dados estáticos
 *
 * Para reduzir chamadas desnecessárias à Riot API, endpoints que retornam dados
 * que raramente mudam devem ser cacheados em Redis. Candidatos:
 *
 * - GET /lol/static-data/v1/versions       (versões do jogo — muda a cada patch)
 * - GET /lol/static-data/v1/champions      (dados de campeões — muda a cada patch)
 * - GET /lol/static-data/v1/items          (dados de itens)
 *
 * Estratégia sugerida:
 *   1. Instalar `ioredis` e criar `src/lib/redis.ts` com a instância do cliente Redis.
 *   2. Criar uma versão com cache de `riotFetch` que:
 *      a. Verifica se a chave existe no Redis antes de chamar a API.
 *      b. Se existir, retorna o valor cacheado (JSON.parse).
 *      c. Se não existir, chama a API, armazena no Redis com TTL (ex: 3600s para versões)
 *         e retorna o resultado.
 *   3. Usar BullMQ (baseado em Redis) para evoluir o cron job para uma fila
 *      de processamento com rate limiting embutido.
 */
