export type Shopping = {
  codigo: string;
  id: number;
  nome: string;
  endereco?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  ativo: boolean;
};

export type Piso = {
  codigo: string;
  id: number;
  shopping_id: number;
  nome: string;
  nivel: number;
  imagem_planta_url?: string | null;
  largura_metros?: number | null;
  altura_metros?: number | null;
  ativo: boolean;
};

/** Valores aceitos pelo enum `No.tipo` da API. */
export const TIPOS_NO = [
  "corredor",
  "loja",
  "entrada",
  "escada",
  "escada_rolante",
  "elevador",
  "banheiro",
  "saida",
] as const;

export type TipoNo = (typeof TIPOS_NO)[number];

export function isTipoNo(value: string): value is TipoNo {
  return (TIPOS_NO as readonly string[]).includes(value);
}

export type No = {
  codigo: string;
  id: number;
  piso_id: number;
  coord_x: number;
  coord_y: number;
  tipo: TipoNo;
  nome?: string | null;
  ativo: boolean;
};

export type Aresta = {
  id: number;
  no_origem_id: number;
  no_destino_id: number;
  distancia?: number | null;
  bidirecional: boolean;
  acessivel: boolean;
  ativa: boolean;
};

export type Loja = {
  codigo: string;
  id: number;
  no_id: number;
  nome: string;
  descricao?: string | null;
  categoria_id?: number | null;
  horario_funcionamento?: string | null;
  telefone?: string | null;
  logo_url?: string | null;
  /** Situação temporária de atendimento, distinta do soft-delete `ativo`. */
  status_operacional: StatusOperacional;
  ativo: boolean;
  categoria_nome?: string | null;
};

export type StatusOperacional = "aberto" | "fechado" | "manutencao";

export const STATUS_OPERACIONAL_LABEL: Record<StatusOperacional, string> = {
  aberto: "Aberto",
  fechado: "Fechado",
  manutencao: "Em manutenção",
};

/**
 * Compatibilidade defensiva com dados cadastrados antes de `status_operacional`.
 * `ativo` continua significando ciclo de vida do cadastro, não disponibilidade.
 */
export function getStatusOperacional(loja: Loja): StatusOperacional {
  if (
    loja.status_operacional === "aberto" ||
    loja.status_operacional === "fechado" ||
    loja.status_operacional === "manutencao"
  ) {
    return loja.status_operacional;
  }
  return loja.ativo ? "aberto" : "fechado";
}

export function isPoiIndisponivel(loja: Loja): boolean {
  return getStatusOperacional(loja) !== "aberto";
}

export type GraphResponse = {
  piso_id: number;
  piso_nome: string;
  nos: No[];
  arestas: Aresta[];
};

export type NoRota = {
  id: number;
  coord_x: number;
  coord_y: number;
  tipo: TipoNo;
  nome?: string | null;
  piso_id: number;
};

export type RotaResponse = {
  sucesso: boolean;
  nos: NoRota[];
  distancia_total_metros: number;
  instrucoes: string[];
};

export type QRCodeResolveResponse = {
  qr_code: { id: number; no_id: number; token: string; ativo: boolean };
  no: No;
};

export const TIPO_NO_COR: Record<TipoNo, string> = {
  corredor: "#7dd3c7",
  loja: "#e8a54b",
  entrada: "#6ea8fe",
  escada: "#c4b5fd",
  escada_rolante: "#a78bfa",
  elevador: "#f0abfc",
  banheiro: "#86efac",
  saida: "#fda4af",
};

export const TIPO_NO_LABEL: Record<TipoNo, string> = {
  corredor: "Corredor",
  loja: "Loja",
  entrada: "Entrada",
  escada: "Escada",
  escada_rolante: "Escada rolante",
  elevador: "Elevador",
  banheiro: "Banheiro",
  saida: "Saída",
};

export function getTipoNoLabel(tipo: TipoNo | string): string {
  return isTipoNo(tipo) ? TIPO_NO_LABEL[tipo] : "Tipo não reconhecido";
}

/** Mantém a renderização dentro do mapa mesmo se uma resposta inválida escapar da API. */
export function coordenadaNormalizada(valor: number): number {
  if (!Number.isFinite(valor)) return 0;
  return Math.min(1, Math.max(0, valor));
}
