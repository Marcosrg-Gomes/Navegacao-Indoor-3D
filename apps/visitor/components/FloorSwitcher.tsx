import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "@/constants/colors";
import { WayfindingIcon } from "./WayfindingIcon";

type Floor = { id: number; nome: string };

export function FloorSwitcher({ floors, currentId, top, onSelect }: {
  floors: Floor[]; currentId?: number; top: number; onSelect: (floorId: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = floors.find((floor) => floor.id === currentId) ?? floors[0];
  useEffect(() => setOpen(false), [currentId]);
  if (!current) return null;
  return <View style={[styles.wrapper, { top }]}>
    <TouchableOpacity testID="floor-switch" accessibilityRole="button" accessibilityLabel={`Piso atual: ${current.nome}. Trocar piso`}
      accessibilityState={{ expanded: open }} onPress={() => setOpen((value) => !value)} style={styles.trigger}>
      <View style={{ flex: 1 }}><Text style={styles.kicker}>PISO DO MAPA</Text><Text style={styles.name}>{current.nome}</Text></View>
      <View style={{ transform: [{ rotate: open ? "180deg" : "0deg" }] }}><WayfindingIcon name="chevron" color={colors.primaryDark} size={20} strokeWidth={2.2} /></View>
    </TouchableOpacity>
    {open && <View style={styles.options} accessibilityLabel="Escolher piso do mapa">
      {floors.map((floor) => <TouchableOpacity key={floor.id} accessibilityRole="button" accessibilityLabel={floor.nome}
        accessibilityState={{ selected: floor.id === current.id }} style={styles.option}
        onPress={() => { setOpen(false); onSelect(floor.id); }}>
        <Text style={[styles.optionText, floor.id === current.id && styles.selectedText]}>{floor.nome}</Text>
        {floor.id === current.id && <Text style={styles.check}>✓</Text>}
      </TouchableOpacity>)}
    </View>}
  </View>;
}

const styles = StyleSheet.create({
  wrapper: { position: "absolute", left: 10, zIndex: 6, width: 160 },
  trigger: { minHeight: 52, backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.borderLight, flexDirection: "row", alignItems: "center", paddingHorizontal: 12, gap: 8, elevation: 3, shadowColor: colors.shadowLight, shadowOpacity: .13, shadowRadius: 7 },
  kicker: { color: colors.textMuted, fontSize: 9, fontWeight: "800", letterSpacing: .5 },
  name: { color: colors.text, fontSize: 15, fontWeight: "800" },
  chevron: { color: colors.primaryDark, fontSize: 20, fontWeight: "700", lineHeight: 22 },
  options: { marginTop: 5, padding: 4, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight, borderRadius: 15, elevation: 6, shadowColor: colors.shadowLight, shadowOpacity: .17, shadowRadius: 9 },
  option: { minHeight: 46, paddingHorizontal: 11, borderRadius: 11, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  optionText: { color: colors.text, fontSize: 15, fontWeight: "700" },
  selectedText: { color: colors.primaryDark },
  check: { color: colors.primaryDark, fontSize: 19, fontWeight: "900" },
});
