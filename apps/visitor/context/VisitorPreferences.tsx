import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

type SavedPlaces = Record<string, string[]>;
type Preferences = { favorites: SavedPlaces; recent: SavedPlaces; helpSeen: boolean; nearbyAlerts: boolean };
const initial: Preferences = { favorites: {}, recent: {}, helpSeen: false, nearbyAlerts: false };
const key = "indoor:visitor-preferences:v1";

function readPlaces(value: unknown, limit = 100): SavedPlaces {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([shopping]) => /^[A-Z0-9_]+$/.test(shopping))
    .map(([shopping, values]) => [shopping, Array.isArray(values)
      ? [...new Set(values.filter((item): item is string => typeof item === "string" && /^(poi|node):[A-Z0-9_]+$/.test(item)))].slice(0, limit) : []]));
}

const Context = createContext<{
  data: Preferences; ready: boolean; storageError: string | null;
  toggleFavorite: (shopping: string, place: string) => void;
  remember: (shopping: string, place: string) => void;
  dismissHelp: () => void;
  toggleNearbyAlerts: () => void;
} | null>(null);

export function VisitorPreferencesProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState(initial);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const changed = useRef(false);
  const writes = useRef(Promise.resolve());
  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(key).then((raw) => {
      if (!raw || !active) return;
      const saved = JSON.parse(raw);
      setData({ favorites: readPlaces(saved?.favorites), recent: readPlaces(saved?.recent, 8), helpSeen: saved?.helpSeen === true, nearbyAlerts: saved?.nearbyAlerts === true });
    }).catch(() => { if (active) setStorageError("Seus locais salvos não puderam ser carregados neste aparelho."); })
      .finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!ready || !changed.current) return;
    writes.current = writes.current.then(() => AsyncStorage.setItem(key, JSON.stringify(data)))
      .then(() => setStorageError(null)).catch(() => setStorageError("Os locais estão disponíveis nesta sessão, mas não foi possível salvá-los no aparelho."));
  }, [data, ready]);
  const toggleFavorite = useCallback((shopping: string, place: string) => {
    if (!ready) return;
    changed.current = true;
    setData((current) => {
      const places = current.favorites[shopping] || [];
      return { ...current, favorites: { ...current.favorites, [shopping]: places.includes(place) ? places.filter((item) => item !== place) : [...places, place].slice(-100) } };
    });
  }, [ready]);
  const remember = useCallback((shopping: string, place: string) => {
    if (!ready) return;
    changed.current = true;
    setData((current) => ({ ...current, recent: { ...current.recent, [shopping]: [place, ...(current.recent[shopping] || []).filter((item) => item !== place)].slice(0, 8) } }));
  }, [ready]);
  const dismissHelp = useCallback(() => {
    if (!ready) return;
    changed.current = true;
    setData((current) => ({ ...current, helpSeen: true }));
  }, [ready]);
  function toggleNearbyAlerts() { changed.current = true; setData((current) => ({ ...current, nearbyAlerts: !current.nearbyAlerts })); }
  return <Context.Provider value={{ data, ready, storageError, toggleFavorite, remember, dismissHelp, toggleNearbyAlerts }}>{children}</Context.Provider>;
}

export function useVisitorPreferences() {
  const value = useContext(Context);
  if (!value) throw new Error("VisitorPreferencesProvider não está disponível.");
  return value;
}
