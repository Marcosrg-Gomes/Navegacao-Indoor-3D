const KEY = "admin_api_key";

export function getApiKey(): string | null {
  return sessionStorage.getItem(KEY);
}

export function setApiKey(key: string) {
  sessionStorage.setItem(KEY, key);
}

export function clearApiKey() {
  sessionStorage.removeItem(KEY);
}

/**
 * Normaliza caminhos retornados pelo backend para que uploads locais como
 * `static/plantas/piso.svg` também funcionem quando o painel está em /admin/.
 */
export function assetUrl(value?: string | null): string | undefined {
  if (!value) return undefined;
  const url = value.trim();
  if (!url) return undefined;
  if (/^(?:https?:|data:|blob:)/i.test(url)) return url;
  return url.startsWith("/") ? url : `/${url}`;
}

function detailMessage(detail: unknown, fallback: string): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) =>
        typeof item === "object" && item && "msg" in item
          ? String(item.msg)
          : String(item)
      )
      .join("; ");
  }
  return fallback;
}

/**
 * Cliente HTTP para a API administrativa FastAPI.
 * Injeta automaticamente o cabeçalho X-API-Key armazenado na sessão.
 */
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type") && init?.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const key = getApiKey();
  if (key) {
    headers.set("X-API-Key", key);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(`/api${path}`, { ...init, headers, signal: controller.signal });
    if (res.status === 204) return undefined as T;
    const text = await res.text();
    let data;
    try { data = text ? JSON.parse(text) : null; }
    catch { throw new Error("O servidor retornou uma resposta inválida."); }
    if (!res.ok) throw new Error(detailMessage(data?.detail, res.statusText || "Erro na API"));
    return data as T;
  } catch (err) {
    if (controller.signal.aborted) throw new Error("Tempo de conexão esgotado. Verifique a rede e tente novamente.");
    if (err instanceof TypeError) throw new Error("Não foi possível conectar ao servidor. Verifique a rede.");
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Faz upload multipart de arquivo para um endpoint da API.
 */
export async function uploadFile<T>(path: string, file: File, fieldName = "file"): Promise<T> {
  const formData = new FormData();
  formData.append(fieldName, file);

  return api<T>(path, { method: "POST", body: formData });
}
