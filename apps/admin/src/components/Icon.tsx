/** Ícones de traço único, mesmo desenho do app do visitante (WayfindingIcon). */
const paths = {
  dashboard: "M4 4h7v7H4V4m9 0h7v4h-7V4m0 6h7v10h-7V10M4 13h7v7H4v-7",
  mall: "M3 10h18M4 10v11h16V10M3 10l2-7h14l2 7M9 21v-7h6v7",
  floors: "m12 3 9 5-9 5-9-5 9-5m-9 9 9 5 9-5m-18 4 9 5 9-5",
  node: "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Zm-5 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
  edge: "M6 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0m16-12a2 2 0 1 1-4 0 2 2 0 0 1 4 0M5.5 16.5l13-9",
  store: "M4 9h16l-1-5H5L4 9m0 0v11h16V9M9 20v-6h6v6",
  tag: "M3 12V3h9l9 9-9 9-9-9m5-4h.01",
  qr: "M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M7 7h3v3H7V7m7 0h3v3h-3V7M7 14h3v3H7v-3m7 0h3v3h-3v-3",
  check: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0m-13 0 3 3 5-6",
  cube: "m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3m0 9 8-4.5M12 12v9m0-9L4 7.5",
  history: "M3 12a9 9 0 1 0 3-6.7M3 4v5h5m4-2v5l3 2",
  alert: "M12 3 2 20h20L12 3m0 6v5m0 3v.1",
  logout: "M15 4h4v16h-4M10 8l-4 4 4 4m-4-4h12",
  arrow: "M4 12h16m-6-6 6 6-6 6",
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, size = 18, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <path d={paths[name]} stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
