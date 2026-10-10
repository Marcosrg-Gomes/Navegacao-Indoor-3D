import type { EtapaRota, No, RotaResponse } from "../../../visitor/types";

export const entry: No = { id: 1, codigo: "ENTRADA", piso_id: 10, coord_x: .5, coord_y: .1, tipo: "entrada", ativo: true };
export const destination: No = { ...entry, id: 2, codigo: "LOJA", coord_y: .8, tipo: "loja" };

export function makeRoute(nodes: No[] = [entry, destination], distances = [42]): RotaResponse {
  const step = (a: No, b: No, tipo: EtapaRota["tipo"], distance: number): EtapaRota => ({
    texto: `${tipo}: ${a.id} → ${b.id}`, tipo, no_origem_id: a.id, no_destino_id: b.id,
    piso_origem_id: a.piso_id, piso_destino_id: b.piso_id,
    distancia_metros: Math.round(distance * 10) / 10, distancia_exata_metros: distance,
  });
  const etapas = [step(nodes[0], nodes[0], "inicio", 0),
    ...nodes.slice(0, -1).map((node, i) => step(node, nodes[i + 1], node.piso_id === nodes[i + 1].piso_id ? "caminho" : "troca_piso", distances[i])),
    step(nodes[nodes.length - 1], nodes[nodes.length - 1], "chegada", 0)];
  return { sucesso: true, nos: nodes, distancia_total_metros: Math.round(distances.reduce((a, b) => a + b, 0) * 100) / 100,
    instrucoes: etapas.map((item) => item.texto), etapas, revisao: "r1" };
}

export function floorRoute(kind: "elevador" | "escada" | "escada_rolante" = "elevador") {
  const lower: No = { ...entry, id: 3, codigo: "ACESSO_T", coord_y: .3, tipo: kind };
  const upper: No = { ...lower, id: 4, codigo: "ACESSO_M", piso_id: 20, coord_x: .6, coord_y: .4 };
  return makeRoute([entry, lower, upper, { ...destination, piso_id: 20 }], [12, 4.7, 24]);
}
