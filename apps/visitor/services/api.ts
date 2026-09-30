import Constants from "expo-constants";
import { Platform } from "react-native";
import type {
  GraphResponse,
  Loja,
  Piso,
  QRCodeResolveResponse,
  RotaResponse,
  Shopping,
} from "@/types";

const REQUEST_TIMEOUT_MS = 10_000;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function getBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return normalizarBaseUrl(fromEnv);

  const fromExtra = Constants.expoConfig?.extra?.apiUrl as string | undefined;
  if (fromExtra) return normalizarBaseUrl(fromExtra);

  if (Platform.OS === "web" && typeof window !== "undefined") {
    const { origin, hostname, port } = window.location;
    return port === "8081" || port === "8082" ? `http://${hostname}:8000` : origin;
  }
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) return `http://${hostUri.split(":")[0]}:8000`;

  return "http://localhost:8000";
}

function normalizarBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, "").replace(/\/api$/, "");
}

const BASE_URL = getBaseUrl();

type FailureType = "rota" | "qr" | "mapa_2d" | "mapa_3d";
type FailureCode = "rede" | "timeout" | "resposta_invalida" | "indisponivel" | "sem_rota";
const pendingDiagnostics = new Map<string, { tipo: FailureType; codigo: FailureCode }>();
const lastDiagnostic = new Map<string, number>();
let sendingDiagnostics = false;

async function flushDiagnostics() {
  if (sendingDiagnostics || pendingDiagnostics.size === 0) return;
  sendingDiagnostics = true;
  try {
    for (const [key, event] of pendingDiagnostics) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      try {
        const response = await fetch(`${BASE_URL}/api/diagnostics/events`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(event), signal: controller.signal,
        });
        if (!response.ok) break;
        pendingDiagnostics.delete(key);
      } catch { break; } finally { clearTimeout(timeout); }
    }
  } finally { sendingDiagnostics = false; }
}

export function reportDiagnostic(tipo: FailureType, codigo: FailureCode) {
  const key = `${tipo}:${codigo}`;
  if (Date.now() - (lastDiagnostic.get(key) || 0) < 30_000) return;
  lastDiagnostic.set(key, Date.now());
  pendingDiagnostics.set(key, { tipo, codigo });
  void flushDiagnostics();
}

function detailMessage(detail: unknown, fallback: string): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) =>
        typeof item === "object" && item && "msg" in item
          ? String((item as { msg: string }).msg)
          : String(item)
      )
      .join("; ");
  }
  return fallback;
}

function parseJson(text: string): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${BASE_URL}/api${path}`, {
      ...init,
      headers,
      signal: controller.signal,
    });
    const text = await res.text();
    const data = parseJson(text);

    if (!res.ok) {
      const detail =
        typeof data === "object" && data !== null && "detail" in data
          ? (data as { detail?: unknown }).detail
          : undefined;
      throw new ApiError(
        detailMessage(detail, res.statusText || "Erro na API"),
        res.status,
        res.headers.get("X-Error-Code") || undefined
      );
    }

    if (data === null && res.status !== 204) {
      throw new ApiError("A API retornou uma resposta inválida.", res.status, "RESPOSTA_INVALIDA");
    }

    void flushDiagnostics();
    return data as T;
  } catch (error) {
    const tipo: FailureType = path.startsWith("/qr-codes/") ? "qr" : path.startsWith("/routes") ? "rota" : path.endsWith("/scene") ? "mapa_3d" : "mapa_2d";
    if (!(error instanceof ApiError)) reportDiagnostic(tipo, controller.signal.aborted ? "timeout" : "rede");
    else if (error.code === "RESPOSTA_INVALIDA") reportDiagnostic(tipo, "resposta_invalida");
    if (error instanceof ApiError) throw error;
    if (controller.signal.aborted) {
      throw new ApiError(
        "A conexão demorou demais. Verifique a rede e tente novamente."
      );
    }
    throw new ApiError(
      "Não foi possível conectar ao servidor. Verifique a rede e tente novamente."
    );
  } finally {
    clearTimeout(timeout);
  }
}

export function getApiBaseUrl(): string {
  return BASE_URL;
}

/** Converte caminhos de upload como `/static/plantas/...` em uma URL utilizável no app. */
export function getAssetUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  const value = url.trim();
  if (!value) return undefined;
  if (/^(?:https?:|data:|file:|blob:)/i.test(value)) return value;
  if (value.startsWith("//")) return `https:${value}`;
  return `${BASE_URL}/${value.replace(/^\/+/, "")}`;
}

/** Aceita token puro, URL do QR ou deep link com `token` na query string. */
export function extractQrToken(value: string): string {
  const scanned = value.trim();
  if (!scanned) throw new ApiError("O QR Code lido não contém um token.");

  try {
    const url = new URL(scanned);
    const token =
      url.searchParams.get("token") ??
      url.searchParams.get("qr_token") ??
      url.searchParams.get("qr");
    if (token?.trim()) return token.trim();

    const match = url.pathname.match(/\/(?:api\/)?qr-codes\/([^/]+)/i);
    if (match?.[1]) return decodeURIComponent(match[1]);
  } catch {
    // Um token simples não é uma URL — esse é o formato mais comum do MVP.
  }

  return scanned;
}

export function listShoppings() {
  return request<Shopping[]>("/shoppings");
}

export function getShopping(id: number) {
  return request<Shopping>(`/shoppings/${id}`);
}

export function listFloors(shoppingId: number) {
  return request<Piso[]>(`/shoppings/${shoppingId}/floors`);
}

export function getFloorGraph(pisoId: number) {
  return request<GraphResponse>(`/floors/${pisoId}/graph`);
}

export function listPois(params?: {
  q?: string;
  categoria_id?: number;
  shopping_id?: number;
  piso_id?: number;
}) {
  const search = new URLSearchParams();
  if (params?.q) search.set("q", params.q);
  if (params?.categoria_id !== undefined) {
    search.set("categoria_id", String(params.categoria_id));
  }
  if (params?.shopping_id !== undefined) {
    search.set("shopping_id", String(params.shopping_id));
  }
  if (params?.piso_id !== undefined) search.set("piso_id", String(params.piso_id));
  const qs = search.toString();
  return request<Loja[]>(`/pois${qs ? `?${qs}` : ""}`);
}

export function getPoi(id: number) {
  return request<Loja>(`/pois/${id}`);
}

export function resolveQrCode(scannedValue: string) {
  const token = extractQrToken(scannedValue);
  return request<QRCodeResolveResponse>(`/qr-codes/${encodeURIComponent(token)}`);
}

export function calculateRoute(origemNoId: number, destinoNoId: number, acessivel = false, confirmarIndisponivel = false) {
  return request<RotaResponse>("/routes", {
    method: "POST",
    body: JSON.stringify({
      origem_no_id: origemNoId,
      destino_no_id: destinoNoId,
      acessivel,
      confirmar_indisponivel: confirmarIndisponivel,
    }),
  });
}

export function getScene(shoppingId: number) {
  return request<import("../types/scene").Scene>(`/shoppings/${shoppingId}/scene`);
}

export function getRouteDistances(originId: number, acessivel: boolean) {
  return request<Record<string, number>>(`/routes/distances?origem_no_id=${originId}&acessivel=${acessivel}`);
}

export function getNavigationState(shoppingId: number) {
  return request<{ revisao: string; ativo: boolean }>(`/shoppings/${shoppingId}/navigation-state`);
}
