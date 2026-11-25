import { useEffect, useRef, type ReactNode } from "react";
import { AccessibilityInfo, findNodeHandle, Platform, StyleSheet, Text, View } from "react-native";
import { colors } from "@/constants/colors";
import { WayfindingIcon } from "./WayfindingIcon";

export function AccessibleSheet({ visible, title, onClose, children, footer }: {
  visible: boolean; title: string; onClose: () => void; children: ReactNode; footer?: ReactNode;
}) {
  const heading = useRef<HTMLHeadingElement | null>(null);
  const panel = useRef<HTMLDivElement | null>(null);
  const close = useRef(onClose); close.current = onClose;
  const previousFocus = useRef<HTMLElement | null>(null);

  // Listener permanente para capturar o último elemento clicado antes de abrir qualquer sheet
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const handleGlobalMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.tagName !== "BODY" && target.tagName !== "HTML") {
        (window as any).__lastFocusedElement = target;
      }
    };
    window.addEventListener("mousedown", handleGlobalMouseDown, true);
    return () => {
      window.removeEventListener("mousedown", handleGlobalMouseDown, true);
    };
  }, []);

  useEffect(() => {
    if (!visible || Platform.OS !== "web") return;

    // Captura o elemento que tinha foco antes de abrir o sheet
    previousFocus.current = document.activeElement as HTMLElement | null;

    const panelEl = panel.current;
    if (panelEl) panelEl.focus();

    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        // Restaura o foco ao elemento anterior ANTES de fechar o sheet (WebKit precisa disso)
        const target = previousFocus.current?.isConnected ? previousFocus.current : (window as any).__lastFocusedElement || document.getElementById("filtro-ordenar-btn");
        if (target?.focus) target.focus();
        close.current();
        return;
      }
      if (event.key !== "Tab") return;
      const element = panel.current;
      if (!element) { event.preventDefault(); return; }
      const focusable = Array.from(element.querySelectorAll<HTMLElement>('button, input, select, textarea, a[href], [tabindex="0"]') || [])
        .filter((item) => item.getAttribute("aria-disabled") !== "true" && !item.hasAttribute("disabled") && item.getClientRects().length > 0);
      const first = focusable[0], last = focusable.at(-1);
      if (!first || !last) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || !focusable.includes(document.activeElement as HTMLElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !element.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", keydown, true);

    return () => {
      document.removeEventListener("keydown", keydown, true);
      const previous =
        previousFocus.current?.isConnected
          ? previousFocus.current
          : (window as any).__lastFocusedElement
          || document.getElementById("filtro-ordenar-btn")
          || document.querySelector('[aria-label="Filtrar e ordenar"]')
          || document.querySelector('button[aria-label*="Filtrar"]')
          || document.querySelector('[id="filtro-ordenar-btn"]');
      const restore = () => { if (previous?.focus) previous.focus(); };
      restore();
      setTimeout(restore, 50);
      setTimeout(restore, 150);
      setTimeout(restore, 300);
    };
  }, [visible]);

  if (!visible) return null;

  const titleId = `sheet-title-${title.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      {/* Backdrop: apenas visual, não captura cliques (cliques passam para o sheet) */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(16, 31, 43, 0.8)", pointerEvents: "none" }} />
      {/* Sheet */}
      <div
        ref={panel}
        style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          width: "100%", maxWidth: 660, maxHeight: "90%",
          backgroundColor: colors.surface, borderTopWidth: 5, borderTopColor: colors.accent,
          zIndex: 1001, pointerEvents: "auto", overflow: "hidden", display: "flex", flexDirection: "column",
        }}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: 18, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: 1, borderBottomColor: colors.border, pointerEvents: "auto" }}>
          <h2 ref={heading} id={titleId} tabIndex={-1} style={{ flex: 1, color: colors.text, fontSize: 24, fontWeight: "600" }}>{title}</h2>
          <button
            aria-label={`Fechar ${title}`}
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            style={{ minWidth: 48, minHeight: 48, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            <WayfindingIcon name="close" />
          </button>
        </div>
        <div style={{ padding: 20, gap: 16, pointerEvents: "auto", overflowY: "auto", flex: 1 }}>
          {children}
        </div>
        {footer && <div style={{ padding: 16, borderTopWidth: 1, borderTopColor: colors.border, gap: 8, pointerEvents: "auto" }}>{footer}</div>}
      </div>
    </div>
  );
}
