import { createRequire } from "node:module";

const requireVisitor = createRequire(import.meta.url);

/**
 * Carrega módulos TypeScript de apps/visitor pelo pipeline CommonJS do
 * Playwright. O pacote do visitante não declara "type": "module" (e seu
 * babel.config.js é CommonJS), então imports ESM nomeados diretos não são
 * coletados pelo Playwright.
 */
export function loadVisitorModule<T>(specifier: string): T {
  return requireVisitor(specifier) as T;
}
