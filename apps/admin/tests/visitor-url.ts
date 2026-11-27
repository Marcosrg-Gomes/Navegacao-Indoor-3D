// Origem do visitante separada da API/admin, que usam o baseURL AUDIT_URL.
export const VISITOR_URL = process.env.VISITOR_URL || "http://127.0.0.1:8081";

export function visitorQrUrl(token: string): string {
  const base = VISITOR_URL.replace(/\/+$/, "");
  return `${base}/?qr=${token}`;
}
