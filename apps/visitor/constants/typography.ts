import { Platform } from "react-native";

/** Pilha tipográfica da identidade: IBM Plex Sans (empacotada localmente), com fallbacks do sistema. */
export const fontStack = "'IBM Plex Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
export const fontFamily = Platform.select({ web: fontStack, ios: "System", default: "sans-serif" });
export const monoFamily = Platform.select({ web: "'IBM Plex Mono', ui-monospace, 'SFMono-Regular', Menlo, monospace", ios: "Menlo", default: "monospace" });

/** Escala tipográfica (px). Mantém 16 px como corpo mínimo e títulos com altura de linha estável. */
export const type = {
  display: { fontSize: 28, lineHeight: 34, fontWeight: "700" as const },
  title: { fontSize: 22, lineHeight: 28, fontWeight: "700" as const },
  heading: { fontSize: 18, lineHeight: 24, fontWeight: "600" as const },
  body: { fontSize: 16, lineHeight: 22, fontWeight: "400" as const },
  bodyStrong: { fontSize: 16, lineHeight: 22, fontWeight: "600" as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: "500" as const },
  overline: { fontSize: 11, lineHeight: 14, fontWeight: "700" as const, letterSpacing: .8 },
};
