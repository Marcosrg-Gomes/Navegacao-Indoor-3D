import type { ReactNode } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export function MapToolbar({ zoom, onZoom, onReset, onLocate, onRoute, children }: {
  zoom: number; onZoom: (factor: number) => void; onReset: () => void;
  onLocate?: () => void; onRoute?: () => void; children?: ReactNode;
}) {
  return <View style={styles.toolbar}>
    <View style={styles.zoom}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Diminuir zoom" style={styles.step} onPress={() => onZoom(1 / 1.5)}><Text style={styles.symbol}>−</Text></TouchableOpacity>
      <Text style={styles.value} testID="map-zoom">{zoom.toFixed(1)}×</Text>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Aumentar zoom" style={styles.step} onPress={() => onZoom(1.5)}><Text style={styles.symbol}>+</Text></TouchableOpacity>
    </View>
    <TouchableOpacity accessibilityRole="button" onPress={onReset} style={styles.button}><Text style={styles.text}>Ver piso inteiro</Text></TouchableOpacity>
    {onLocate && <TouchableOpacity accessibilityRole="button" onPress={onLocate} style={[styles.button, styles.locate]}><Text style={[styles.text, { color: "#166534" }]}>◎ Minha posição</Text></TouchableOpacity>}
    {onRoute && <TouchableOpacity accessibilityRole="button" onPress={onRoute} style={styles.button}><Text style={styles.text}>Centralizar rota</Text></TouchableOpacity>}
    {children}
  </View>;
}

export function MapLegend() {
  return <View style={styles.legend}>{[["#16a34a", "Você está aqui"], ["#e11d48", "Destino"], ["#2563eb", "Rota"], ["#7c3aed", "Acesso entre pisos"]].map(([color, label]) =>
    <View key={label} style={styles.item}><View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: color }} /><Text style={{ color: "#475569", fontSize: 12 }}>{label}</Text></View>)}</View>;
}
const styles = StyleSheet.create({
  toolbar: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8, padding: 12, backgroundColor: "#fff" },
  zoom: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#dbe3ed", borderRadius: 10 },
  step: { width: 44, height: 42, alignItems: "center", justifyContent: "center" }, symbol: { fontSize: 23, color: "#1e3a5f" },
  value: { minWidth: 43, textAlign: "center", color: "#334155", fontWeight: "600" },
  button: { paddingHorizontal: 13, minHeight: 44, justifyContent: "center", borderRadius: 9, backgroundColor: "#f1f5f9" },
  locate: { backgroundColor: "#ecfdf5" }, text: { fontSize: 13, color: "#334155", fontWeight: "600" },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 14, padding: 12, backgroundColor: "#fff" }, item: { flexDirection: "row", alignItems: "center", gap: 5 },
});
