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

function detailMessage(detail: unknown, fallback: string): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => (typeof item === "object" && item && "msg" in item ? String(item.msg) : String(item)))
      .join("; ");
  }
  return fallback;
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }
  const key = getApiKey();
  if (key) headers.set("X-API-Key", key);

  const res = await fetch(`/api${path}`, { ...init, headers });

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new Error(detailMessage(data?.detail, res.statusText || "Erro na API"));
  }
  return data as T;
}
