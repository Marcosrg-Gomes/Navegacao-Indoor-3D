import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import type { GraphResponse, No, Piso } from "@/types";
import { Map2D } from "./Map2D";
import { directoryStyles as d, ink, paper, rule } from "./directoryDesign";

export function DirectoryMap({ floors, graphs, selected, origin, pins = [], onSelect }: {
  floors: Piso[]; graphs: GraphResponse[]; selected: No | null; origin: No | null; pins?: number[]; onSelect: (node: No) => void;
}) {
  const [floorId, setFloorId] = useState<number>();
  const [width, setWidth] = useState(350);
  const [locate, setLocate] = useState(0);
  useEffect(() => { if (selected) setFloorId(selected.piso_id); }, [selected?.id]);
  const floor = floors.find((item) => item.id === floorId) || floors.find((item) => item.id === origin?.piso_id) || floors[0];
  const graph = graphs.find((item) => item.piso_id === floor?.id);
  return <View style={{ flex: 1, gap: 12, backgroundColor: paper }} onLayout={(event) => setWidth(Math.max(240, event.nativeEvent.layout.width - 2))}>
    <View style={[d.row, { justifyContent: "space-between" }]}><Text style={d.label}>PLANTA / {floor?.nome}</Text><Text style={d.muted}>Toque em um espaço</Text></View>
    <View style={d.row}>{floors.map((item) => <TouchableOpacity key={item.id} accessibilityRole="button" accessibilityLabel={`Planta ${item.nome}`} accessibilityState={{ selected: floor?.id === item.id }} onPress={() => setFloorId(item.id)} style={{ minHeight: 44, padding: 10, borderBottomWidth: floor?.id === item.id ? 3 : 1, borderBottomColor: ink }}><Text style={d.text}>{item.nome}</Text></TouchableOpacity>)}</View>
    {graph && floor && <Map2D key={floor.id} width={width} height={Math.max(390, Math.min(650, width * 1.15))} floor={floor} graph={graph} routeNodes={[]} origin={origin} destination={selected?.piso_id === floor.id ? selected.id : undefined} highlight={selected?.id} pins={pins} onNodePress={onSelect} onLocate={() => { setFloorId(origin?.piso_id); setLocate((value) => value + 1); }} locateRequest={locate} />}
    {selected && <View testID="directory-selection" style={{ borderTopWidth: 1, borderTopColor: rule, paddingTop: 12 }}><Text style={d.section}>{selected.nome}</Text><Text style={d.muted}>Local destacado na planta. Sua posição permanece a última confirmada.</Text></View>}
  </View>;
}
