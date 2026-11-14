import { useEffect, useState } from "react";
import { isSvgPlan } from "@/components/planOrientation";

// Plantas são estáticas por URL (versão no nome do arquivo): basta um cache em memória.
const cache = new Map<string, Promise<string>>();

/** Conteúdo de uma planta SVG; `null` enquanto carrega, se falhar ou se a planta não for SVG. */
export function usePlanSvg(url?: string | null): string | null {
  const [svg, setSvg] = useState<string | null>(null);
  useEffect(() => {
    setSvg(null);
    if (!url || !isSvgPlan(url)) return;
    let active = true;
    let request = cache.get(url);
    if (!request) {
      request = fetch(url).then((response) => {
        if (!response.ok) throw new Error(`Planta indisponível (${response.status}).`);
        return response.text();
      });
      cache.set(url, request);
      request.catch(() => cache.delete(url));
    }
    request.then((text) => { if (active) setSvg(text); }).catch(() => undefined);
    return () => { active = false; };
  }, [url]);
  return svg;
}
