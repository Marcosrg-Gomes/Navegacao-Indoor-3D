import { useState, type ReactNode } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "@/components/AppText";
import { colors } from "@/constants/colors";
import { WayfindingIcon, type WayfindingIconName } from "./WayfindingIcon";

const TOUCH_SLOP = { top: 6, bottom: 6, left: 6, right: 6 };

function ToolButton({ label, icon, onPress, tone = "neutral", accessibilityLabel, expanded, iconOnly = false }: {
  label: string; icon?: WayfindingIconName; onPress: () => void; tone?: "neutral" | "primary"; accessibilityLabel?: string; expanded?: boolean; iconOnly?: boolean;
}) {
  const primary = tone === "primary";
  return <TouchableOpacity accessibilityRole="button" accessibilityLabel={accessibilityLabel} accessibilityState={expanded === undefined ? undefined : { expanded }}
    onPress={onPress} hitSlop={TOUCH_SLOP} style={[styles.button, primary && styles.primary, iconOnly && styles.iconOnly]}>
    {icon && <WayfindingIcon name={icon} color={primary ? colors.textOnPrimary : colors.primary} size={18} strokeWidth={2} />}
    {iconOnly ? null : <Text style={[styles.text, primary && styles.textOnPrimary]}>{label}</Text>}
  </TouchableOpacity>;
}

export function MapToolbar({ zoom, onZoom, onReset, onLocate, onRoute, children }: {
  zoom: number; onZoom: (factor: number) => void; onReset: () => void;
  onLocate?: () => void; onRoute?: () => void; children?: ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  return <View style={styles.toolbar}>
    <View style={styles.zoom}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Diminuir zoom" style={styles.step} hitSlop={TOUCH_SLOP} onPress={() => onZoom(1 / 1.5)}>
        <WayfindingIcon name="minus" color={colors.primary} size={18} strokeWidth={2.2} />
      </TouchableOpacity>
      <Text style={styles.value} testID="map-zoom">{zoom.toFixed(1)}×</Text>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Aumentar zoom" style={styles.step} hitSlop={TOUCH_SLOP} onPress={() => onZoom(1.5)}>
        <WayfindingIcon name="plus" color={colors.primary} size={18} strokeWidth={2.2} />
      </TouchableOpacity>
    </View>
    <ToolButton label="Piso inteiro" accessibilityLabel="Ver piso inteiro" icon="overview" onPress={onReset} />
    {onLocate && <ToolButton label="Minha posição" accessibilityLabel="Minha posição" icon="locate" onPress={onLocate} />}
    {onRoute && <ToolButton label="Centralizar rota" icon="map" onPress={onRoute} tone="primary" />}
    {children && <ToolButton label={expanded ? "Menos controles" : "Mais controles"} accessibilityLabel={expanded ? "Menos controles" : "Mais controles"} icon="more" iconOnly expanded={expanded} onPress={() => setExpanded(!expanded)} />}
    {expanded && children}
  </View>;
}

/** Amostras desenhadas com a mesma forma usada no mapa (não glifos de texto). */
function Swatch({ kind, color }: { kind: "position" | "origin" | "destination" | "route" | "floors"; color: string }) {
  if (kind === "route") return <View style={{ width: 22, height: 5, borderRadius: 3, backgroundColor: color }} />;
  if (kind === "destination") return <View style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: color }} />;
  if (kind === "floors") return <WayfindingIcon name="lift" color={color} size={16} strokeWidth={2} />;
  if (kind === "position") return <View style={{ width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: color, backgroundColor: colors.surface }} />;
  return <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: color, borderWidth: 2, borderColor: colors.surface }} />;
}

const legendItems = [
  { color: colors.primary, label: "Sua posição", kind: "position" },
  { color: colors.origin, label: "Origem", kind: "origin" },
  { color: colors.destination, label: "Destino", kind: "destination" },
  { color: colors.route, label: "Rota", kind: "route" },
  { color: colors.accessible, label: "Acesso entre pisos", kind: "floors" },
] as const;

export function MapLegend({ simulated: _simulated = false }: { simulated?: boolean }) {
  return <View style={styles.legend} accessibilityLabel="Legenda do mapa">
    {legendItems.map((item) => <View key={item.label} style={styles.item}>
      <View style={styles.swatch} accessible={false}><Swatch kind={item.kind} color={item.color} /></View>
      <Text style={styles.legendText}>{item.label}</Text>
    </View>)}
  </View>;
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    padding: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  zoom: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  step: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  value: { minWidth: 44, textAlign: "center", color: colors.primary, fontWeight: "700", fontSize: 13, fontVariant: ["tabular-nums"] },
  button: {
    minHeight: 48,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  primary: { backgroundColor: colors.primary, borderColor: colors.primary },
  iconOnly: { width: 44, paddingHorizontal: 0, justifyContent: "center" },
  text: { fontSize: 13, color: colors.primary, fontWeight: "600" },
  textOnPrimary: { color: colors.textOnPrimary },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  item: { flexDirection: "row", alignItems: "center", gap: 8 },
  swatch: { width: 22, alignItems: "center" },
  legendText: { color: colors.textMuted, fontSize: 13, fontWeight: "500" },
});
