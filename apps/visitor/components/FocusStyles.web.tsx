import { useEffect } from "react";
import { Asset } from "expo-asset";
import { plexFontAssets } from "@/constants/fontAssets";
import { colors } from "@/constants/colors";
import { fontStack } from "@/constants/typography";

// Arquivos TTF empacotados no build: nenhuma requisição a serviços externos de fontes.
const faces: [number, number][] = [[400, plexFontAssets.IBMPlexSans_400Regular], [500, plexFontAssets.IBMPlexSans_500Medium], [600, plexFontAssets.IBMPlexSans_600SemiBold], [700, plexFontAssets.IBMPlexSans_700Bold]];

export function FocusStyles() {
  useEffect(() => {
    const style = document.createElement("style");
    const fontFaces = faces.map(([weight, module]) =>
      `@font-face { font-family: 'IBM Plex Sans'; font-style: normal; font-weight: ${weight}; font-display: swap; src: url("${Asset.fromModule(module).uri}") format("truetype"); }`).join("\n");
    // Weights 800/900 usados em alguns rótulos caem no Bold (700) da família.
    style.textContent = `
      ${fontFaces}
      html, body { background: ${colors.bg}; -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }
      html body, html body [class*="css-text"], html body [class*="r-fontFamily"], input, textarea, button, select, svg text { font-family: ${fontStack}; }
      ::selection { background: ${colors.accent}66; color: ${colors.primaryDark}; }
      input, textarea { caret-color: ${colors.primary}; }
      input::placeholder, textarea::placeholder { color: #6f8580; opacity: 1; }
      * { scrollbar-width: thin; scrollbar-color: #b9c9c3 transparent; }
      *::-webkit-scrollbar { width: 10px; height: 10px; }
      *::-webkit-scrollbar-thumb { background: #b9c9c3; border-radius: 10px; border: 3px solid transparent; background-clip: content-box; }
      *::-webkit-scrollbar-thumb:hover { background-color: #8fa6a0; }
      a { text-underline-offset: 3px; }
      [style*="tabular-nums"] { font-feature-settings: "tnum" 1; }
      :focus-visible { outline: 3px solid ${colors.accent} !important; outline-offset: 2px; }
      [role="button"]:focus-visible, [role="tab"]:focus-visible, a:focus-visible { outline: 3px solid ${colors.accent} !important; outline-offset: 2px; box-shadow: 0 0 0 5px ${colors.primary}33 !important; }
      [role="tab"]:focus-visible { outline-offset: -3px; }
      [role="button"], [role="tab"] { transition: transform 140ms cubic-bezier(0.23, 1, 0.32, 1), background-color 160ms ease, opacity 160ms ease, box-shadow 160ms ease; }
      @media (hover: hover) and (pointer: fine) { [role="button"]:hover { filter: brightness(.97); } }
      [role="button"]:active, [role="tab"]:active { transform: scale(.97); }
      @keyframes destination-pulse { 50% { opacity: .45; } }
      [data-testid="destination-marker"] { animation: destination-pulse 1.8s ease-in-out 2; }
      @keyframes position-halo { 0% { opacity: .22; } 50% { opacity: .08; } 100% { opacity: .22; } }
      [data-testid="position-marker"] > circle:first-child { animation: position-halo 2.4s ease-in-out infinite; }
      @media (prefers-reduced-motion: reduce) { *,*::before,*::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; scroll-behavior: auto !important; } }
      @media (forced-colors: active) { [role="button"],[role="tab"],input { border: 1px solid ButtonText !important; } }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);
  return null;
}
