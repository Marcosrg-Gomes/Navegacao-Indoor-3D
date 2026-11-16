/** Arquivos IBM Plex Sans carregados pelo app (um por peso). Módulo puro, testável em Node. */
export const plexFamilies = {
  400: "IBMPlexSans_400Regular",
  500: "IBMPlexSans_500Medium",
  600: "IBMPlexSans_600SemiBold",
  700: "IBMPlexSans_700Bold",
} as const;

export type PlexWeight = keyof typeof plexFamilies;

/** Peso CSS/RN ("bold", "600", 800…) → peso Plex disponível (400, 500, 600 ou 700). */
export function plexWeight(weight?: string | number | null): PlexWeight {
  const value = weight === "bold" ? 700 : weight === "normal" || weight === undefined || weight === null ? 400 : Number(weight);
  if (!Number.isFinite(value) || value < 450) return 400;
  if (value < 550) return 500;
  if (value < 650) return 600;
  return 700;
}
