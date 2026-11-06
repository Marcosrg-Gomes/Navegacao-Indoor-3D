/**
 * Paleta de cores - Navegação Indoor 3D
 * Identidade visual profissional, moderna e consistente.
 * 
 * Cores baseadas em tons de verde escuro (sobreposição ao mapa),
 * laranja dourado (destaques e ações principais), e tons neutros
 * suaves para superfícies e textos.
 */
export const colors = {
  // Cores primárias
  primary: "#14332e",      // Verde escuro profundo - identidade principal
  primaryDark: "#0f2a26",  // Verde ainda mais escuro para contraste
  primarySoft: "#e8f3ee",  // Verde muito claro para fundos suaves
  primaryLighter: "#d4e8e0", // Verde claro para estados ativos suaves

  // Acentos (mantém aliases sun/sunSoft para compatibilidade com código existente)
  accent: "#e8a54b",       // Laranja dourado - ações principais
  accentDark: "#c88338",   // Laranja mais escuro para estados ativos
  accentSoft: "#fdf0d9",   // Laranja muito claro para fundos suaves
  sun: "#e8a54b",          // Alias para accent (compatibilidade)
  sunSoft: "#fdf0d9",      // Alias para accentSoft (compatibilidade)

  // Superfícies
  bg: "#f7f5ef",           // Fundo principal (cinza quente muito claro)
  surface: "#ffffff",      // Branco puro para cards e painéis
  surfaceElevated: "#f4f1ea", // Cinza quente para elevações leves
  surfaceHover: "#efe9e0", // Cinza quente para estados hover

  // Textos
  text: "#22332d",         // Verde escuro quase preto para texto principal
  textMuted: "#5e736e",    // Verde cinza para texto secundário
  textLight: "#8da7a2",    // Cinza verde claro para texto secundário suave
  textOnPrimary: "#ffffff", // Branco sobre cores escuras

  // Bordas
  border: "#c9d7d0",       // Verde cinza claro para bordas suaves
  borderLight: "#e2eae8",  // Cinza muito claro para bordas sutis
  borderFocus: "#14332e",  // Verde escuro para bordas de foco

  // Estados semânticos
  success: "#205f3d",      // Verde escuro para sucesso
  successSoft: "#e3f2e5",  // Verde muito claro para fundo de sucesso
  warning: "#805600",      // Laranja escuro para aviso
  warningSoft: "#fff1cf",  // Laranja muito claro para fundo de aviso
  danger: "#a3332c",       // Vermelho escuro para erro/perigo
  dangerSoft: "#fbece8",   // Vermelho muito claro para fundo de erro

  // Semânticos específicos do app
  route: "#6842d8",        // Roxo suave para rotas
  routeSoft: "#ede2f5",    // Roxo muito claro para fundo de rota
  origin: "#22c55e",       // Verde para origem
  originSoft: "#dcfce7",   // Verde claro para origem
  destination: "#ef4444",  // Vermelho para destino
  destinationSoft: "#fecaca", // Vermelho claro para destino
  accessible: "#7c3aed",   // Roxo para acessibilidade
  accessibleSoft: "#f0e7ff", // Roxo claro para acessibilidade

  // Sombras (usadas em CSS customizado via style)
  shadowLight: "0 1px 3px rgba(0, 0, 0, 0.08)",
  shadowMedium: "0 4px 12px rgba(0, 0, 0, 0.10)",
  shadowHeavy: "0 12px 40px rgba(0, 0, 0, 0.15)",
};
