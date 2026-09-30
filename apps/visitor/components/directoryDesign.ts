import { Platform, StyleSheet } from "react-native";
import { colors } from "@/constants/colors";
import type { Place } from "@/hooks/useDirectory";
import type { No, Piso } from "@/types";

export const ink = colors.text, paper = colors.bg, muted = colors.textMuted, rule = colors.border, accent = colors.accent;
export const editorial = Platform.select({ web: "system-ui, -apple-system, Segoe UI, sans-serif", ios: "System", default: "sans-serif" });
export const mono = Platform.select({ web: "monospace", ios: "Menlo", default: "monospace" });
export function spaceCode(node: No, poiCode?: string) { return poiCode || node.codigo.replace(/^(T|M)_LOJA_/, "").replace(/^(T|M)_/, "").replace(/_/g, " "); }
export function placeIdentity(place: Place) {
  if (place.node.tipo === "banheiro") return { sign: "WC", label: "Banheiros", color: "#38586b" };
  if (place.node.tipo === "elevador") return { sign: "↕", label: "Elevadores", color: "#69502f" };
  if (["entrada", "saida"].includes(place.node.tipo)) return { sign: "↗", label: "Entradas e saídas", color: "#366044" };
  if (/alimenta|cafe|gastronom/i.test(place.category.normalize("NFD").replace(/[\u0300-\u036f]/g, ""))) return { sign: "☕", label: place.category, color: "#9c4426" };
  return { sign: spaceCode(place.node, place.poi?.codigo), label: place.category, color: ink };
}
export function floorLabel(floors: Piso[], id: number) { return floors.find((floor) => floor.id === id)?.nome || "Piso"; }
export const directoryStyles = StyleSheet.create({
  title: { fontFamily: editorial, fontSize: 34, lineHeight: 40, fontWeight: "700", color: ink },
  section: { fontFamily: editorial, fontSize: 24, lineHeight: 30, fontWeight: "700", color: ink },
  text: { fontSize: 16, lineHeight: 24, color: ink },
  muted: { fontSize: 14, lineHeight: 21, color: muted },
  label: { fontSize: 13, fontWeight: "700", color: muted, letterSpacing: .5 },
  row: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 12 },
  button: { minHeight: 52, paddingHorizontal: 18, paddingVertical: 12, backgroundColor: colors.primary, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  buttonText: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
  link: { minWidth: 44, minHeight: 44, justifyContent: "center", paddingVertical: 10, paddingHorizontal: 4 },
  linkText: { fontSize: 15, color: accent, fontWeight: "700", textDecorationLine: "underline" },
  line: { borderTopWidth: 1, borderTopColor: rule, paddingVertical: 14, gap: 8 },
});
