import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useNavigation } from "@/context/NavigationContext";
import { useVisitorPreferences } from "@/context/VisitorPreferences";
import { useVisitPlan } from "@/context/VisitPlan";
import { useDirectory } from "@/hooks/useDirectory";
import { getStatusOperacional } from "@/types";
import { AccessibleSheet } from "./AccessibleSheet";
import { directoryStyles as d } from "./directoryDesign";

export function SavedPlacesSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const nav = useNavigation(), preferences = useVisitorPreferences(), plan = useVisitPlan(), router = useRouter();
  const directory = useDirectory(visible), [selection, setSelection] = useState<string[]>([]), [busy, setBusy] = useState(false);
  const favorites = preferences.data.favorites[nav.shopping?.codigo || ""] || [];
  const places = directory.places.filter((place) => favorites.includes(place.key));
  useEffect(() => { if (!visible) setSelection([]); }, [visible]);
  async function start() {
    setBusy(true);
    try {
      await plan.start(selection.flatMap((key) => { const place = places.find((item) => item.key === key); return place ? [place.node] : []; }));
      onClose(); router.replace(nav.originNode ? "/(tabs)/" : "/(tabs)/?manualOrigin=1");
    } finally { setBusy(false); }
  }
  return <AccessibleSheet visible={visible} title="Meus lugares" onClose={onClose} footer={<TouchableOpacity accessibilityRole="button" disabled={!selection.length || busy} accessibilityState={{ disabled: !selection.length || busy }} style={[d.button, (!selection.length || busy) && { opacity: .5 }]} onPress={() => void start()}><Text style={d.buttonText}>{busy ? "Preparando percurso…" : "Visitar " + selection.length + " lugares nesta ordem"}</Text></TouchableOpacity>}>
    <Text style={d.text}>Seus lugares estão fixados na planta. Selecione na ordem em que deseja visitar; cada trecho será calculado pela API a partir da chegada anterior.</Text>
    <TouchableOpacity accessibilityRole="switch" accessibilityLabel="Avisos de favoritos próximos" accessibilityState={{ checked: preferences.data.nearbyAlerts, disabled: !preferences.ready }} disabled={!preferences.ready} style={d.line} onPress={preferences.toggleNearbyAlerts}><Text style={d.text}>{preferences.data.nearbyAlerts ? "✓ " : "○ "}Avisar sobre favoritos a até 35 m</Text><Text style={d.muted}>O aviso aparece no mapa após confirmar uma posição. Não usa rastreamento em segundo plano.</Text></TouchableOpacity>
    {directory.error && <Text accessibilityRole="alert" style={d.text}>{directory.error}</Text>}
    {!places.length && <Text style={d.text}>Use “Fixar +” no diretório para guardar seus lugares.</Text>}
    {places.map((place) => {
      const index = selection.indexOf(place.key), unavailable = !!place.poi && getStatusOperacional(place.poi) !== "aberto";
      return <TouchableOpacity key={place.key} accessibilityRole="button" accessibilityLabel={"Incluir " + place.name + " no passeio"} accessibilityState={{ selected: index >= 0, disabled: unavailable }} disabled={unavailable} style={[d.line, unavailable && { opacity: .6 }]} onPress={() => setSelection((current) => index >= 0 ? current.filter((key) => key !== place.key) : [...current, place.key])}>
        <Text style={d.text}>{index >= 0 ? index + 1 + ". " : "+ "}{place.name}</Text><Text style={d.muted}>{unavailable ? "Atendimento indisponível" : directory.distances?.[place.node.id] !== undefined ? Math.round(directory.distances[place.node.id]) + " m da posição confirmada" : "Defina sua origem para ver a distância"}</Text>
      </TouchableOpacity>;
    })}
    {!!selection.length && <View style={d.line}><Text style={d.label}>ORDEM DA VISITA</Text>{selection.map((key, index) => <Text key={key} style={d.text}>{index + 1}. {places.find((place) => place.key === key)?.name}</Text>)}<Text style={d.muted}>Toque em um local selecionado para removê-lo e incluir novamente em outra posição.</Text></View>}
  </AccessibleSheet>;
}
