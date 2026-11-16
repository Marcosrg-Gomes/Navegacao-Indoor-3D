import { Platform, StyleSheet, type StyleProp, type TextStyle } from "react-native";
import { plexFamilies, plexWeight } from "./fontWeights";

/**
 * IBM Plex Sans empacotada no app (@expo-google-fonts/ibm-plex-sans).
 *
 * Android e iOS não escolhem o arquivo de fonte por `fontWeight` quando a
 * família é carregada pelo expo-font: cada peso é uma família própria. Por isso
 * o app usa `AppText`, que converte `fontWeight` na família correspondente.
 * No web, as quatro variações são registradas como uma única família CSS
 * ('IBM Plex Sans') em FocusStyles.web.tsx e o navegador resolve o peso.
 */
export { plexFamilies, plexWeight } from "./fontWeights";

/** Pilha tipográfica da identidade, com fallbacks do sistema. */
export const fontStack = "'IBM Plex Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
export const fontFamily = Platform.select({ web: fontStack, default: plexFamilies[400] });
export const monoFamily = Platform.select({ web: "'IBM Plex Mono', ui-monospace, 'SFMono-Regular', Menlo, monospace", ios: "Menlo", default: "monospace" });

type Weight = TextStyle["fontWeight"];

/** Família Plex usada nas plataformas nativas para um peso (também em textos SVG). */
export function plexFamily(weight?: Weight): string {
  return Platform.OS === "web" ? fontStack : plexFamilies[plexWeight(weight)];
}

const isPlex = (family?: string) => !family || family === fontStack || family.startsWith("IBMPlexSans") || family === "System" || family === "sans-serif";

/**
 * Aplica a família Plex correta no Android/iOS. Fontes monoespaçadas e outras
 * famílias explícitas são preservadas. No web o estilo não é alterado.
 */
export function nativeFontStyle<T extends StyleProp<TextStyle>>(style: T): T | TextStyle {
  if (Platform.OS === "web") return style;
  const flat = StyleSheet.flatten(style) || {};
  if (!isPlex(flat.fontFamily)) return flat;
  // Sem fontWeight: o arquivo já define o peso; manter os dois gera negrito sintético no Android.
  const { fontWeight, ...rest } = flat;
  return { ...rest, fontFamily: plexFamilies[plexWeight(fontWeight)] };
}

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
