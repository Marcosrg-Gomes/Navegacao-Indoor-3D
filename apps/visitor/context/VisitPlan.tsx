import { createContext, useContext, useState, type ReactNode } from "react";
import type { No } from "@/types";
import { useNavigation } from "./NavigationContext";

const Context = createContext<{ stops: No[]; start: (nodes: No[]) => Promise<void>; next: () => Promise<void>; cancel: () => void } | null>(null);
export function VisitPlanProvider({ children }: { children: ReactNode }) {
  const nav = useNavigation();
  const [plan, setPlan] = useState<{ shopping: number; nodes: No[] } | null>(null);
  const stops = plan?.shopping === nav.shopping?.id ? plan?.nodes || [] : [];
  async function start(nodes: No[]) {
    if (!nodes.length || !nav.shopping) return;
    setPlan({ shopping: nav.shopping.id, nodes });
    await nav.setDestinationNode(nodes[0]);
  }
  async function next() {
    if (!nav.hasArrived || !stops.length || nav.originNode?.id !== stops[0].id) return;
    const remaining = stops.slice(1);
    setPlan(nav.shopping ? { shopping: nav.shopping.id, nodes: remaining } : null);
    if (remaining.length) await nav.setDestinationNode(remaining[0]);
    else nav.clearRoute();
  }
  return <Context.Provider value={{ stops, start, next, cancel: () => setPlan(null) }}>{children}</Context.Provider>;
}
export function useVisitPlan() { const value = useContext(Context); if (!value) throw new Error("VisitPlanProvider ausente"); return value; }
