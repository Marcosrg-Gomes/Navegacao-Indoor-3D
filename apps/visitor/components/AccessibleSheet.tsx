import { useEffect, useRef, type ReactNode } from "react";
import { AccessibilityInfo, findNodeHandle, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "@/constants/colors";
import { WayfindingIcon } from "./WayfindingIcon";

export function AccessibleSheet({ visible, title, onClose, children, footer }: {
  visible: boolean; title: string; onClose: () => void; children: ReactNode; footer?: ReactNode;
}) {
  const heading = useRef<Text>(null);
  const panel = useRef<View>(null);
  const close = useRef(onClose); close.current = onClose;
  const previousFocus = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!visible || Platform.OS !== "web") return;
    previousFocus.current = document.activeElement as HTMLElement;
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); close.current(); return; }
      if (event.key !== "Tab") return;
      const element = panel.current as unknown as HTMLElement;
      const focusable = Array.from(element?.querySelectorAll<HTMLElement>('button, input, select, textarea, a[href], [tabindex="0"]') || [])
        .filter((item) => item.getAttribute("aria-disabled") !== "true" && !item.hasAttribute("disabled") && item.getClientRects().length > 0);
      const first = focusable[0], last = focusable.at(-1);
      if (!first || !last) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || !focusable.includes(document.activeElement as HTMLElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !element.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", keydown, true);
    return () => {
      document.removeEventListener("keydown", keydown, true);
      const previous = previousFocus.current;
      requestAnimationFrame(() => { if (previous?.isConnected) previous.focus(); });
    };
  }, [visible]);
  function focusHeading() {
    if (Platform.OS === "web") (heading.current as unknown as HTMLElement)?.focus();
    else { const handle = findNodeHandle(heading.current); if (handle) AccessibilityInfo.setAccessibilityFocus(handle); }
  }
  return <Modal visible={visible} accessibilityLabel={title} transparent animationType="none" onRequestClose={onClose} onShow={focusHeading}>
    <View style={styles.backdrop}><View ref={panel} style={styles.sheet} accessibilityViewIsModal accessibilityLabel={title}>
      <View style={styles.top}><Text ref={heading} accessibilityRole="header" {...(Platform.OS === "web" ? { tabIndex: -1, "aria-level": 2 } : {})} style={styles.title}>{title}</Text>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Fechar ${title}`} onPress={onClose} style={styles.close}><WayfindingIcon name="close" /></TouchableOpacity>
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>{children}</ScrollView>
      {footer && <View style={styles.footer}>{footer}</View>}
    </View></View>
  </Modal>;
}
const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end", alignItems: "center", backgroundColor: "#101f2bcc" },
  sheet: { width: "100%", maxWidth: 660, maxHeight: "90%", backgroundColor: colors.surface, borderTopWidth: 5, borderTopColor: colors.accent },
  top: { padding: 18, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { flex: 1, color: colors.text, fontSize: 24, fontWeight: "600" },
  close: { minWidth: 48, minHeight: 48, justifyContent: "center", alignItems: "center" },
  body: { padding: 20, gap: 16 }, footer: { padding: 16, borderTopWidth: 1, borderTopColor: colors.border, gap: 8 },
});
