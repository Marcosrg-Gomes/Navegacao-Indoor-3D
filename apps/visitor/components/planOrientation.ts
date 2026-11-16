import type { MapOrientation } from "./navigationOrientation";

/**
 * Mantém legíveis os textos gravados na planta SVG quando a planta gira 180°.
 *
 * A planta inteira gira junto com o mapa (geometria coerente com rota e 3D);
 * apenas cada <text> recebe uma rotação de 180° em torno do próprio centro
 * visual, o que a faz aparecer na posição de leitura normal.
 * Textos que já possuem `transform` são preservados sem alteração.
 */
export function orientPlanSvg(svg: string, rotation: MapOrientation): string {
  if (rotation !== 180) return svg;
  return svg.replace(/<text\b([^>]*)>/g, (tag, attrs: string) => {
    if (/\stransform\s*=/.test(attrs)) return tag;
    const x = Number(attribute(attrs, "x") ?? 0);
    const y = Number(attribute(attrs, "y") ?? 0);
    const size = Number(attribute(attrs, "font-size") ?? 0);
    if (![x, y, size].every(Number.isFinite)) return tag;
    // `y` é a linha de base; o centro visual das maiúsculas fica ~0,35 em acima.
    const cy = y - size * .35;
    return `<text${attrs} transform="rotate(180 ${round(x)} ${round(cy)})">`;
  });
}

function attribute(attrs: string, name: string): string | undefined {
  const match = attrs.match(new RegExp(`\\s${name}\\s*=\\s*"([^"]*)"`));
  return match?.[1];
}

function round(value: number) {
  return Math.round(value * 10000) / 10000;
}

export function isSvgPlan(url?: string | null): boolean {
  return !!url && /\.svg(\?|#|$)/i.test(url);
}
