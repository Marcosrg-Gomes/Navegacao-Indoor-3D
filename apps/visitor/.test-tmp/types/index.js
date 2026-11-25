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
];
export function isTipoNo(value) {
    return TIPOS_NO.includes(value);
}
export const STATUS_OPERACIONAL_LABEL = {
    aberto: "Aberto",
    fechado: "Fechado",
    manutencao: "Em manutenção",
};
/**
 * Compatibilidade defensiva com dados cadastrados antes de `status_operacional`.
 * `ativo` continua significando ciclo de vida do cadastro, não disponibilidade.
 */
export function getStatusOperacional(loja) {
    if (loja.status_operacional === "aberto" && loja.aberto_agora === false)
        return "fechado";
    if (loja.status_operacional === "aberto" ||
        loja.status_operacional === "fechado" ||
        loja.status_operacional === "manutencao") {
        return loja.status_operacional;
    }
    return loja.ativo ? "aberto" : "fechado";
}
export function isPoiIndisponivel(loja) {
    return getStatusOperacional(loja) !== "aberto";
}
export const TIPO_NO_COR = {
    corredor: "#7dd3c7",
    loja: "#e8a54b",
    entrada: "#6ea8fe",
    escada: "#c4b5fd",
    escada_rolante: "#a78bfa",
    elevador: "#f0abfc",
    banheiro: "#86efac",
    saida: "#fda4af",
};
export const TIPO_NO_LABEL = {
    corredor: "Corredor",
    loja: "Loja",
    entrada: "Entrada",
    escada: "Escada",
    escada_rolante: "Escada rolante",
    elevador: "Elevador",
    banheiro: "Banheiro",
    saida: "Saída",
};
export function getTipoNoLabel(tipo) {
    return isTipoNo(tipo) ? TIPO_NO_LABEL[tipo] : "Tipo não reconhecido";
}
/** Mantém a renderização dentro do mapa mesmo se uma resposta inválida escapar da API. */
export function coordenadaNormalizada(valor) {
    if (!Number.isFinite(valor))
        return 0;
    return Math.min(1, Math.max(0, valor));
}
