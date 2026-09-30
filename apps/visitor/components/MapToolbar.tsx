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
    <TouchableOpacity accessibilityRole="button" onPress={onReset} style={styles.button}><Text style={styles.text}>Ver piso inteiro</Text></TouchableOpacity>
    {onLocate && <TouchableOpacity accessibilityRole="button" onPress={onLocate} style={[styles.button, styles.locate]}><Text style={[styles.text, { color: "#166534" }]}>◎ Minha posição</Text></TouchableOpacity>}
    {onRoute && <TouchableOpacity accessibilityRole="button" onPress={onRoute} style={styles.button}><Text style={styles.text}>Centralizar rota</Text></TouchableOpacity>}
    {children && <TouchableOpacity accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded(!expanded)} style={styles.button}><Text style={styles.text}>{expanded ? "Menos controles" : "Mais controles"}</Text></TouchableOpacity>}
    {expanded && children}
  </View>;
}

export function MapLegend() {
  return <View style={styles.legend}>{[["#166534", "Você está aqui", "●"], ["#be123c", "Destino", "■"], ["#2563eb", "Rota", "━"], ["#6d28d9", "Acesso entre pisos", "↕"]].map(([color, label, symbol]) =>
    <View key={label} style={styles.item}><Text accessible={false} style={{ color, fontSize: 17 }}>{symbol}</Text><Text style={{ color: colors.textMuted, fontSize: 14 }}>{label}</Text></View>)}</View>;
}
const styles = StyleSheet.create({
  toolbar: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8, padding: 12, backgroundColor: "#fff" },
  zoom: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: colors.border, borderRadius: 2 },
  step: { width: 44, height: 44, alignItems: "center", justifyContent: "center" }, symbol: { fontSize: 23, color: "#1e3a5f" },
  value: { minWidth: 43, textAlign: "center", color: "#334155", fontWeight: "600" },
  button: { paddingHorizontal: 13, minHeight: 44, justifyContent: "center", borderRadius: 2, backgroundColor: colors.primarySoft },
  locate: { backgroundColor: "#ecfdf5" }, text: { fontSize: 13, color: "#334155", fontWeight: "600" },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 14, padding: 12, backgroundColor: "#fff" }, item: { flexDirection: "row", alignItems: "center", gap: 5 },
});
