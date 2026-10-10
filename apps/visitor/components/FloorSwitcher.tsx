import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

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
      <Text style={styles.chevron}>{open ? "⌃" : "⌄"}</Text>
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
  trigger: { minHeight: 52, backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#cfdee2", flexDirection: "row", alignItems: "center", paddingHorizontal: 12, gap: 8, elevation: 3, shadowColor: "#152c3a", shadowOpacity: .13, shadowRadius: 7 },
  kicker: { color: "#566b73", fontSize: 9, fontWeight: "800", letterSpacing: .5 },
  name: { color: "#142d38", fontSize: 15, fontWeight: "800" },
  chevron: { color: "#174f65", fontSize: 20, fontWeight: "700", lineHeight: 22 },
  options: { marginTop: 5, padding: 4, backgroundColor: "#fff", borderWidth: 1, borderColor: "#cfdee2", borderRadius: 15, elevation: 6, shadowColor: "#152c3a", shadowOpacity: .17, shadowRadius: 9 },
  option: { minHeight: 46, paddingHorizontal: 11, borderRadius: 11, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  optionText: { color: "#223b45", fontSize: 15, fontWeight: "700" },
  selectedText: { color: "#0971a5" },
  check: { color: "#0971a5", fontSize: 19, fontWeight: "900" },
});
