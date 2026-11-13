import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useNavigation } from "@/context/NavigationContext";
import type { useDirectory } from "@/hooks/useDirectory";
import type { Loja } from "@/types";
import { SearchBar } from "./SearchBar";
import { directoryStyles as d, ink, rule } from "./directoryDesign";
import { colors } from "@/constants/colors";
import { DsButton } from "@/components/DesignSystem";

const quickPlaces = [
  { label: "Banheiros", sign: "WC", shortcut: "wc", tone: colors.primarySoft },
  { label: "Alimentação", sign: "☕", shortcut: "food", tone: colors.accentSoft },
  { label: "Elevadores", sign: "↕", shortcut: "lift", tone: colors.accessibleSoft },
  { label: "Lojas", sign: "▦", shortcut: "shops", tone: colors.routeSoft },
] as const;

export function IntentHome({ directory, onOrigin, onSaved, onMap, onPoi, onHelp }: { directory: ReturnType<typeof useDirectory>; onOrigin: () => void; onSaved: () => void; onMap: () => void; onPoi: (poi: Loja) => void; onHelp: () => void }) {
  const nav = useNavigation(), router = useRouter();
  const near = directory.places.filter((place) => place.node.id !== nav.originNode?.id && directory.distances?.[place.node.id] !== undefined).sort((a, b) => directory.distances![a.node.id] - directory.distances![b.node.id]);
  const services = ["banheiro", "elevador", "food"].flatMap((type) => { const found = near.find((place) => type === "food" ? /alimenta|gastronom|cafe/i.test(place.category) : place.node.tipo === type); return found ? [found] : []; });
  return <View style={styles.screen}>
    <View style={styles.intro}>
      <View style={styles.introTop}><Text style={d.label}>GUIA DO SHOPPING</Text><TouchableOpacity accessibilityRole="button" accessibilityLabel="Ajuda" style={d.link} onPress={onHelp}><Text style={d.linkText}>Como usar</Text></TouchableOpacity></View>
      <Text accessibilityRole="header" style={d.title}>Onde você quer ir?</Text>
      <Text style={d.muted}>Busque uma loja ou serviço para começar.</Text>
      <SearchBar onSelect={onPoi} shoppingId={nav.shopping?.id} placeholder="Buscar loja ou serviço" />
    </View>

    <View style={styles.position}>
      <View style={styles.positionHeading}><View style={styles.number}><Text style={styles.numberText}>1</Text></View><View style={{ flex: 1 }}><Text style={d.label}>{nav.originNode ? "SUA POSIÇÃO CONFIRMADA" : "PRIMEIRO, DIGA ONDE ESTÁ"}</Text><Text testID="origin-label" style={styles.positionName}>{nav.originNode?.nome || "Ponto de partida não definido"}</Text></View></View>
      <Text style={d.muted}>{nav.originNode ? `${nav.floors.find((floor) => floor.id === nav.originNode?.piso_id)?.nome || "Piso"} · As distâncias partem daqui.` : "Assim mostramos o caminho certo a partir de você."}</Text>
      <View style={styles.positionActions}>
        <DsButton variant="primary" onPress={() => router.push("/scan")}>
          ▣  Ler QR Code
        </DsButton>
        <DsButton variant="outline" onPress={onOrigin}>
          {nav.originNode ? "Mudar local" : "Escolher local"}
        </DsButton>
      </View>
    </View>

    <View style={{ gap: 12 }}><Text accessibilityRole="header" aria-level={2} style={d.section}>O que você procura?</Text>
      <View style={styles.quickGrid}>{quickPlaces.map((item) => <DsButton key={item.shortcut} variant="outline" style={[styles.quick, { backgroundColor: item.tone }]} onPress={() => router.push({ pathname: "/explore", params: { shortcut: item.shortcut } })}>
        <Text style={[styles.quickSign, { color: ink }]} accessible={false}>{item.sign}</Text>
        <Text style={[styles.quickLabel, { color: ink }]}>{item.label}</Text>
        <Text style={[styles.quickArrow, { color: ink }]} accessible={false}>›</Text>
      </DsButton>)}</View>
    </View>

    {nav.originNode && <View style={{ gap: 8 }}><Text accessibilityRole="header" aria-level={2} style={d.section}>Perto de você</Text><Text style={d.muted}>Distâncias desde sua última posição confirmada.</Text>
      {services.map((place) => <TouchableOpacity key={place.key} accessibilityRole="button" accessibilityLabel={"Ir para " + place.name} style={styles.nearRow} onPress={() => place.poi ? onPoi(place.poi) : void nav.setDestinationNode(place.node)}><Text style={[d.text, { flex: 1, fontWeight: "600" }]}>{place.name}</Text><Text style={styles.nearDistance}>{Math.round(directory.distances![place.node.id])} m  ›</Text></TouchableOpacity>)}
      {directory.distanceError && <Text accessibilityRole="alert" style={d.text}>{directory.distanceError}</Text>}
    </View>}

    <View style={styles.more}><DsButton variant="secondary" onPress={() => router.push("/explore")}>
      Ver todos os lugares  →
    </DsButton><View style={d.row}><TouchableOpacity accessibilityRole="button" style={d.link} onPress={onSaved}><Text style={d.linkText}>Meus lugares</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" style={d.link} onPress={onMap}><Text style={d.linkText}>Abrir mapa completo</Text></TouchableOpacity></View></View>
  </View>;
}

const styles = StyleSheet.create({
  screen: { gap: 22 },
  intro: { gap: 10, paddingTop: 4 },
  introTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  position: { backgroundColor: "#ffffff", borderWidth: 1, borderColor: rule, borderLeftWidth: 6, borderLeftColor: colors.sun, borderRadius: 12, padding: 16, gap: 12 },
  positionHeading: { flexDirection: "row", alignItems: "center", gap: 12 },
  number: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.sun, alignItems: "center", justifyContent: "center" },
  numberText: { fontSize: 19, fontWeight: "800", color: ink },
  positionName: { color: ink, fontSize: 19, lineHeight: 25, fontWeight: "700", marginTop: 2 },
  positionActions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  quick: { flexBasis: "47%", flexGrow: 1, minHeight: 76, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 10 },
  quickSign: { fontSize: 21, fontWeight: "800", color: ink },
  quickLabel: { flex: 1, color: ink, fontSize: 16, fontWeight: "700" },
  quickArrow: { fontSize: 24, color: ink },
  nearRow: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 54, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: rule },
  nearDistance: { color: colors.primary, fontSize: 15, fontWeight: "700" },
  more: { gap: 6, paddingBottom: 12 },
});
