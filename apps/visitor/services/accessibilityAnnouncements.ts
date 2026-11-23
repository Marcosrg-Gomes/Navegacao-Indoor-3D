/**
 * Mensagens de anúncio para leitores de tela (VoiceOver no iOS, TalkBack no
 * Android). São funções puras: recebem o estado da navegação e devolvem o texto
 * a anunciar, sem efeitos colaterais. Usadas por hooks/useAccessibilityAnnouncer.ts
 * para anunciar transições consequenciais exatamente uma vez cada.
 *
 * As mensagens seguem o padrão: contexto + quantidade + destino/unidade, em
 * português do Brasil, curtas o suficiente para não interromper a navegação.
 */

export type AnnouncementKey =
  | "route"
  | "arrival"
  | "floor"
  | "origin"
  | "error"
  | "instruction";

/** Rota calculada ou atualizada. */
export function routeAnnouncement(params: {
  destination: string;
  distanceMeters: number;
  steps: number;
  accessible: boolean;
}): string {
  const { destination, distanceMeters, steps, accessible } = params;
  const distancia = Math.round(distanceMeters);
  const passo = steps === 1 ? "passo" : "passos";
  const acessivel = accessible ? " (rota sem escadas)" : "";
  return `Rota calculada até ${destination}, ${distancia} metros, ${steps} ${passo}${acessivel}.`;
}

/** Chegada ao destino. */
export function arrivalAnnouncement(destination: string): string {
  return `Você chegou ao destino: ${destination}.`;
}

/** Mudança de piso relevante à rota ativa. */
export function floorAnnouncement(floorName: string): string {
  return `Agora exibindo o piso ${floorName}.`;
}

/** Origem definida (QR, seleção manual ou confirmação de chegada). */
export function originAnnouncement(params: {
  nodeName: string;
  floorName?: string | null;
}): string {
  const { nodeName, floorName } = params;
  return `Sua localização está em ${nodeName}, ${floorName || "piso desconhecido"}.`;
}

/** Erro de rota (recalculação falhou). */
export function errorAnnouncement(message: string): string {
  return `Erro na rota: ${message}.`;
}

/** Próxima manobra / progressão da rota durante a simulação. */
export function instructionAnnouncement(instruction: string): string {
  return instruction;
}

/**
 * Rastreador de dedução de anúncios. Garante que cada anúncio consequencial seja
 * disparado exatamente uma vez por transição de estado. É um objeto plano (sem
 * React) para facilitar testes automatizados em ambiente Node.
 */
export class AnnouncementTracker {
  private prev = new Map<AnnouncementKey, string | null>();

  shouldAnnounce(key: AnnouncementKey, value: string | number | null): boolean {
    const normalized = value === null ? null : String(value);
    const previous = this.prev.get(key) ?? null;
    const changed = normalized !== null && normalized !== previous;
    if (changed) this.prev.set(key, normalized);
    else if (normalized === null) this.prev.delete(key);
    return changed;
  }

  reset(): void {
    this.prev.clear();
  }
}
