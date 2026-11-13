// URL centralizada do visitante.
// Usa VISITOR_URL ou AUDIT_URL se definidos; caso contrário, usa caminho relativo
// para que o Playwright utilize o baseURL configurado (ex: http://127.0.0.1:8765 ou 8766).
export const VISITOR_URL = process.env.VISITOR_URL || process.env.AUDIT_URL || "";

export function visitorQrUrl(token: string): string {
  const base = VISITOR_URL.replace(/\/+$/, "");
  return `${base}/?qr=${token}`;
}
