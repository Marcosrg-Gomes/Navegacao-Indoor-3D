import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/constants/colors";
import { WayfindingIcon } from "./WayfindingIcon";

const tabs = {
  index: { label: "Início", icon: "home", accessible: "Início" },
  map: { label: "Mapa", icon: "map", accessible: "Mapa" },
  scan: { label: "Ler QR", icon: "scan", accessible: "Ler QR Code" },
  explore: { label: "Explorar", icon: "explore", accessible: "Explorar" },
} as const;

export function VisitorTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const largeText = useWindowDimensions().fontScale >= 1.4;
  return <View style={[styles.bar, { paddingBottom: Math.max(6, insets.bottom) }]} accessibilityRole="tablist">
    {state.routes.map((route, index) => {
      const tab = tabs[route.name as keyof typeof tabs];
      if (!tab) return null;
      const selected = state.index === index;
      return <Pressable key={route.key} accessibilityRole="tab" accessibilityLabel={tab.accessible}
        accessibilityState={{ selected }} aria-selected={selected}
        style={({ pressed }) => [styles.tab, largeText && styles.tabLarge, pressed && styles.pressed]}
        onPress={() => {
          const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
          if (!selected && !event.defaultPrevented) navigation.navigate(route.name, route.params);
        }}
        onLongPress={() => navigation.emit({ type: "tabLongPress", target: route.key })}>
        <View style={[styles.iconPill, selected && styles.iconPillSelected]}>
          <WayfindingIcon name={tab.icon} color={selected ? colors.primary : colors.textMuted} size={23} />
        </View>
        <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={largeText ? 2 : 1}>{tab.label}</Text>
      </Pressable>;
    })}
  </View>;
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
});
