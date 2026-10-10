import { useSyncExternalStore } from "react";
const listeners = new Set<() => void>();
const appListeners = new Set<(value: string) => void>();
let path = "/";
export const Platform = { OS: "web" };
export const AppState = {
  currentState: "active",
  addEventListener: (_: string, fn: (value: string) => void) => { appListeners.add(fn); return { remove: () => appListeners.delete(fn) }; },
};
export const AccessibilityInfo = {
  isReduceMotionEnabled: async () => false,
  addEventListener: () => ({ remove: () => {} }),
};
export function setPath(value: string) { path = value; listeners.forEach((fn) => fn()); }
export function setAppState(value: string) { AppState.currentState = value; appListeners.forEach((fn) => fn(value)); }
export function usePathname() { return useSyncExternalStore((fn) => { listeners.add(fn); return () => { listeners.delete(fn); }; }, () => path); }
const remember = () => {};
export function useVisitorPreferences() { return { remember }; }
export default { expoConfig: {} };
