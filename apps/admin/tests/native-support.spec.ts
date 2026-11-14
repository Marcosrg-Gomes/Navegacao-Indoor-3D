import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { loadVisitorModule } from "./visitorModules";

// Unitários (sem navegador) do suporte mobile nativo: planta legível a 180° e fontes por peso.
const { orientPlanSvg, isSvgPlan } =
  loadVisitorModule<typeof import("../../visitor/components/planOrientation")>("../../visitor/components/planOrientation");
const { plexWeight, plexFamilies } =
  loadVisitorModule<typeof import("../../visitor/constants/fontWeights")>("../../visitor/constants/fontWeights");

const terreo = readFileSync(new URL("../../../assets/models/mini-shopping/terreo-v1.svg", import.meta.url), "utf-8");

test("planta a 0° não é alterada", () => {
  expect(orientPlanSvg(terreo, 0)).toBe(terreo);
});

test("planta a 180°: cada texto gira 180° em torno do próprio centro e a geometria fica intacta", () => {
  const rotated = orientPlanSvg(terreo, 180);
  const texts = [...rotated.matchAll(/<text\b([^>]*)>/g)].map((m) => m[1]);
  expect(texts.length).toBe((terreo.match(/<text\b/g) || []).length);
  expect(texts.length).toBeGreaterThan(0);
  for (const attrs of texts) {
    const x = Number(attrs.match(/\sx="([^"]*)"/)![1]);
    const y = Number(attrs.match(/\sy="([^"]*)"/)![1]);
    const size = Number(attrs.match(/font-size="([^"]*)"/)![1]);
    const [, angle, cx, cy] = attrs.match(/transform="rotate\(([-\d.]+) ([-\d.]+) ([-\d.]+)\)"/)!.map(Number);
    expect(angle).toBe(180);
    expect(cx).toBeCloseTo(x, 3);
    expect(cy).toBeCloseTo(y - size * .35, 3);
  }
  // Retângulos, cores e conteúdo dos textos permanecem os mesmos.
  expect(rotated.replace(/ transform="rotate\([^"]*\)"/g, "")).toBe(terreo);
});

test("textos com transform próprio são preservados", () => {
  const svg = '<svg><text x="1" y="2" font-size="1" transform="scale(2)">A</text><text x="3" y="4" font-size="1">B</text></svg>';
  const rotated = orientPlanSvg(svg, 180);
  expect(rotated).toContain('transform="scale(2)">A');
  expect(rotated).toContain('transform="rotate(180 3 3.65)">B');
});

test("detecção de planta SVG", () => {
  expect(isSvgPlan("/static/models/mini-shopping/terreo-v1.svg")).toBe(true);
  expect(isSvgPlan("https://x/planta.SVG?v=2")).toBe(true);
  expect(isSvgPlan("/static/plantas/piso.png")).toBe(false);
  expect(isSvgPlan(null)).toBe(false);
});

test("pesos tipográficos usam os quatro arquivos IBM Plex Sans", () => {
  expect(plexWeight(undefined)).toBe(400);
  expect(plexWeight("normal")).toBe(400);
  expect(plexWeight("300")).toBe(400);
  expect(plexWeight("500")).toBe(500);
  expect(plexWeight("600")).toBe(600);
  expect(plexWeight("bold")).toBe(700);
  expect(plexWeight("800")).toBe(700);
  expect(plexWeight(900)).toBe(700);
  expect(Object.values(plexFamilies)).toEqual(["IBMPlexSans_400Regular", "IBMPlexSans_500Medium", "IBMPlexSans_600SemiBold", "IBMPlexSans_700Bold"]);
});
