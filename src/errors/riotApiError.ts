const RIOT_ERROR_MESSAGES: Record<number, string> = {
  400: "Requisição inválida para a Riot API",
  401: "Chave de API da Riot inválida ou ausente",
  403: "Acesso negado pela Riot API — verifique as permissões da chave",
  404: "Invocador ou recurso não encontrado na Riot API",
  429: "Rate limit da Riot API excedido",
  500: "Erro interno no servidor da Riot API",
  503: "Serviço da Riot API temporariamente indisponível",
};

export class RiotApiError extends Error {
  public readonly statusCode: number;
  public readonly riotStatusCode: number;

  constructor(riotStatusCode: number, customMessage?: string) {
    const message = customMessage ?? RIOT_ERROR_MESSAGES[riotStatusCode] ?? `Erro desconhecido da Riot API (HTTP ${riotStatusCode})`;
    super(message);
    this.name = "RiotApiError";
    this.riotStatusCode = riotStatusCode;
    this.statusCode = mapRiotStatusToInternal(riotStatusCode);
  }
}

function mapRiotStatusToInternal(riotStatus: number): number {
  switch (riotStatus) {
    case 400:
      return 400;
    case 401:
    case 403:
      return 502;
    case 404:
      return 404;
    case 429:
      return 429;
    case 500:
    case 503:
      return 502;
    default:
      return 500;
  }
}
