export type Shopping = {
  id: number;
  nome: string;
  endereco?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  ativo: boolean;
  criado_em: string;
  atualizado_em?: string | null;
};

export type Piso = {
  id: number;
  shopping_id: number;
  nome: string;
  nivel: number;
  imagem_planta_url?: string | null;
  largura_metros?: number | null;
  altura_metros?: number | null;
  ativo: boolean;
  criado_em: string;
  atualizado_em?: string | null;
};

export type TipoNo = "corredor" | "loja" | "entrada" | "escada" | "elevador" | "banheiro" | "saida";

export type No = {
  id: number;
  piso_id: number;
  coord_x: number;
  coord_y: number;
  tipo: TipoNo | string;
  nome?: string | null;
  ativo: boolean;
  criado_em: string;
  atualizado_em?: string | null;
};

export type Aresta = {
  id: number;
  no_origem_id: number;
  no_destino_id: number;
  distancia?: number | null;
  bidirecional: boolean;
  acessivel: boolean;
  ativa: boolean;
  criado_em: string;
  atualizado_em?: string | null;
};

export type Categoria = {
  id: number;
  nome: string;
  icone?: string | null;
  criado_em: string;
};

export type Loja = {
  id: number;
  no_id: number;
  nome: string;
  descricao?: string | null;
  categoria_id?: number | null;
  horario_funcionamento?: string | null;
  telefone?: string | null;
  logo_url?: string | null;
  ativo: boolean;
  criado_em: string;
  atualizado_em?: string | null;
  categoria_nome?: string | null;
};

export type QRCode = {
  id: number;
  no_id: number;
  token: string;
  ativo: boolean;
  criado_em: string;
  atualizado_em?: string | null;
};

export type ProblemaGrafo = {
  tipo: string;
  descricao: string;
  ids: number[];
};

export type ValidacaoGrafo = {
  valido: boolean;
  problemas: ProblemaGrafo[];
};

export const TIPOS_NO: TipoNo[] = [
  "corredor",
  "loja",
  "entrada",
  "escada",
  "elevador",
  "banheiro",
  "saida",
];

export const TIPO_NO_LABEL: Record<string, string> = {
  corredor: "Corredor",
  loja: "Loja",
  entrada: "Entrada",
  escada: "Escada",
  elevador: "Elevador",
  banheiro: "Banheiro",
  saida: "Saída",
};

export const TIPO_NO_COR: Record<string, string> = {
  corredor: "#7dd3c7",
  loja: "#e8a54b",
  entrada: "#6ea8fe",
  escada: "#c4b5fd",
  elevador: "#f0abfc",
  banheiro: "#86efac",
  saida: "#fda4af",
};
