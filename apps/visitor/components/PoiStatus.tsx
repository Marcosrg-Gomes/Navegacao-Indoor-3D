import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/constants/colors";
import { STATUS_OPERACIONAL_LABEL, type StatusOperacional } from "@/types";

const palette = {
  aberto: [colors.success, colors.successSoft],
  fechado: [colors.danger, colors.dangerSoft],
  manutencao: [colors.warning, colors.warningSoft],
};

export function PoiStatus({ status }: { status: StatusOperacional }) {
  const [foreground, backgroundColor] = palette[status];
  return <View style={[styles.badge, { backgroundColor }]}>
    <Text accessible={false} style={{ color: foreground, fontSize: 14 }}>{status === "aberto" ? "✓" : status === "fechado" ? "×" : "!"}</Text>
    <Text style={[styles.label, { color: foreground }]}>{STATUS_OPERACIONAL_LABEL[status]}</Text>
  </View>;
}

const styles = StyleSheet.create({
  badge: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 6, paddingHorizontal: 6, paddingVertical: 2 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { fontSize: 14, fontWeight: "500" },
});
