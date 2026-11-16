import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Platform, Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { Text } from "@/components/AppText";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/constants/colors";
import { useNavigation } from "@/context/NavigationContext";
import { WayfindingIcon } from "./WayfindingIcon";

const tabs = {
  index: { label: "Início", icon: "home", accessible: "Início" },
  map: { label: "Mapa", icon: "map", accessible: "Mapa" },
  scan: { label: "Ler QR", icon: "scan", accessible: "Ler QR Code" },
  explore: { label: "Explorar", icon: "explore", accessible: "Explorar" },
} as const;

/** Largura a partir da qual o web usa trilho lateral em vez de abas no rodapé. */
export const RAIL_BREAKPOINT = 1024;
export const RAIL_WIDTH = 248;
export function useRailLayout() {
  const { width } = useWindowDimensions();
  return Platform.OS === "web" && width >= RAIL_BREAKPOINT;
}

export function VisitorTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { fontScale, width } = useWindowDimensions();
  const rail = useRailLayout();
  const { shopping, floor } = useNavigation();
  const largeText = fontScale >= 1.4;
  const mobile = width < 600;
  const items = state.routes.map((route, index) => {
    const tab = tabs[route.name as keyof typeof tabs];
    if (!tab || mobile && route.name === "map") return null;
    const label = mobile && route.name === "index" ? "Mapa" : tab.label;
    const selected = state.index === index;
    return <Pressable key={route.key} accessibilityRole="tab" accessibilityLabel={label === "Ler QR" ? "Ler QR Code" : label}
      accessibilityState={{ selected }} aria-selected={selected}
      style={({ pressed }) => rail
        ? [styles.railItem, selected && styles.railItemSelected, pressed && styles.railPressed]
        : [styles.tab, largeText && styles.tabLarge, pressed && styles.pressed]}
      onPress={() => {
        const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
        if (!selected && !event.defaultPrevented) navigation.navigate(route.name, route.params);
      }}
      onLongPress={() => navigation.emit({ type: "tabLongPress", target: route.key })}>
      {rail ? <>
        <WayfindingIcon name={tab.icon} color={selected ? colors.primary : "#c5d8d2"} size={22} strokeWidth={selected ? 2 : 1.7} />
        <Text style={[styles.railLabel, selected && styles.railLabelSelected]} numberOfLines={1}>{label}</Text>
      </> : <>
        <View style={[styles.iconPill, selected && styles.iconPillSelected]}>
          <WayfindingIcon name={mobile && route.name === "index" ? "map" : tab.icon} color={selected ? colors.primary : colors.textMuted} size={23} />
        </View>
        <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={largeText ? 2 : 1}>{label}</Text>
      </>}
    </Pressable>;
  });

  if (rail) return <View style={styles.rail} accessibilityRole="tablist">
    <View style={styles.railBrand}>
      <View style={styles.railMark} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.railBrandName} numberOfLines={2}>{shopping?.nome || "Guia do shopping"}</Text>
        <Text style={styles.railBrandCaption}>Navegação indoor</Text>
      </View>
    </View>
    <View style={styles.railItems}>{items}</View>
    {!!floor && <View style={styles.railFoot}>
      <WayfindingIcon name="lift" color="#a9c2bb" size={18} />
      <Text style={styles.railFootText} numberOfLines={1}>{floor.nome}</Text>
    </View>}
  </View>;

  return <View style={[styles.bar, { paddingBottom: Math.max(6, insets.bottom) }]} accessibilityRole="tablist">{items}</View>;
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", alignItems: "flex-start", paddingTop: 6, paddingHorizontal: 4, backgroundColor: "#ffffff", borderTopWidth: 1, borderTopColor: colors.border },
  tab: { flex: 1, minHeight: 56, alignItems: "center", justifyContent: "center", gap: 2, borderRadius: 10 },
  tabLarge: { minHeight: 82 },
  pressed: { backgroundColor: colors.bg },
  iconPill: { width: 44, height: 31, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  iconPillSelected: { backgroundColor: colors.sunSoft },
  label: { color: colors.textMuted, fontSize: 12, lineHeight: 16, fontWeight: "700", textAlign: "center" },
  labelSelected: { color: colors.primary, fontWeight: "800" },
  // Trilho lateral (web ≥ 1024 px): marca, seções e piso atual.
  rail: { width: RAIL_WIDTH, height: "100%", backgroundColor: colors.primary, paddingHorizontal: 14, paddingTop: 22, paddingBottom: 18, gap: 26 },
  railBrand: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 8 },
  railMark: { width: 8, height: 34, borderRadius: 4, backgroundColor: colors.accent },
  railBrandName: { color: "#ffffff", fontSize: 17, lineHeight: 22, fontWeight: "700" },
  railBrandCaption: { color: "#a9c2bb", fontSize: 12, lineHeight: 16, fontWeight: "500", marginTop: 2 },
  railItems: { gap: 4 },
  railItem: { minHeight: 46, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 12, borderRadius: 12 },
  railItemSelected: { backgroundColor: colors.bg },
  railPressed: { backgroundColor: "rgba(255,255,255,0.08)" },
  railLabel: { color: "#dfe9e5", fontSize: 15, fontWeight: "500" },
  railLabelSelected: { color: colors.primary, fontWeight: "700" },
  railFoot: { marginTop: "auto", flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.06)" },
  railFootText: { color: "#dfe9e5", fontSize: 13, fontWeight: "500", flex: 1 },
});
