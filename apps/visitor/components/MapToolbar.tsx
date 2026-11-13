import { useState, type ReactNode } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "@/constants/colors";

export function MapToolbar({ zoom, onZoom, onReset, onLocate, onRoute, children }: {
  zoom: number; onZoom: (factor: number) => void; onReset: () => void;
  onLocate?: () => void; onRoute?: () => void; children?: ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  return <View style={styles.toolbar}>
    <View style={styles.zoom}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Diminuir zoom" style={styles.step} onPress={() => onZoom(1 / 1.5)}><Text style={styles.symbol}>−</Text></TouchableOpacity>
      <Text style={styles.value} testID="map-zoom">{zoom.toFixed(1)}×</Text>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Aumentar zoom" style={styles.step} onPress={() => onZoom(1.5)}><Text style={styles.symbol}>+</Text></TouchableOpacity>
    </View>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Ver piso inteiro" onPress={onReset} style={[styles.button, styles.primary]}><Text style={styles.text}>Piso inteiro</Text></TouchableOpacity>
    {onLocate && <TouchableOpacity accessibilityRole="button" accessibilityLabel="Minha posição" onPress={onLocate} style={[styles.button, styles.locate]}><Text style={[styles.text, { color: colors.primary }]}>◎ Minha posição</Text></TouchableOpacity>}
    {onRoute && <TouchableOpacity accessibilityRole="button" onPress={onRoute} style={[styles.button, styles.secondary]}><Text style={styles.text}>Centralizar rota</Text></TouchableOpacity>}
    {children && <TouchableOpacity accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded(!expanded)} style={[styles.button, styles.secondary]}><Text style={styles.text}>{expanded ? "Menos controles" : "Mais controles"}</Text></TouchableOpacity>}
    {expanded && children}
  </View>;
}

const legendItems = [
  { color: colors.primary, label: "Posição confirmada", symbol: "●" },
  { color: colors.origin, label: "Origem", symbol: "★" },
  { color: colors.destination, label: "Destino", symbol: "■" },
  { color: colors.route, label: "Rota", symbol: "━" },
  { color: colors.accessible, label: "Acesso entre pisos", symbol: "↕" },
];

export function MapLegend({ simulated = false }: { simulated?: boolean }) {
  const items = legendItems.map((item) => (
    <View key={item.label} style={styles.item}>
      <Text accessible={false} style={{ color: item.color, fontSize: 17 }}>{item.symbol}</Text>
      <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: "600" }}>{item.label}</Text>
    </View>
  ));
  return <View style={styles.legend}>{items}</View>;
}
const styles = StyleSheet.create({
  toolbar: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    padding: 12,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#e2eae8",
  },
  zoom: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2eae8",
    borderRadius: 12,
    backgroundColor: "#ffffff",
  },
  step: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  symbol: {
    fontSize: 23,
    color: "#14332e",
  },
  value: {
    minWidth: 48,
    textAlign: "center",
    color: "#14332e",
    fontWeight: "800",
    fontSize: 14,
  },
  button: {
    paddingHorizontal: 14,
    minHeight: 44,
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#f4f1ea",
    borderWidth: 1,
    borderColor: "#e2eae8",
  },
  primary: {
    backgroundColor: "#14332e",
    borderColor: "#14332e",
  },
  locate: {
    backgroundColor: "#e4f1ec",
    borderColor: "#d4e8e0",
  },
  secondary: {
    backgroundColor: "#f4f1ea",
    borderColor: "#e2eae8",
  },
  text: {
    fontSize: 13,
    color: "#22332d",
    fontWeight: "800",
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    padding: 12,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2eae8",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 5,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
});
