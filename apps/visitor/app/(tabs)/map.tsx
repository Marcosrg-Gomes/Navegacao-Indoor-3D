import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SceneMap } from "@/components/SceneMap";
import { Map2D } from "@/components/Map2D";
import { MapHelp } from "@/components/MapHelp";
import { OrientationPicker } from "@/components/OrientationPicker";
import { PoiDetails } from "@/components/PoiDetails";
import { AccessibleSheet } from "@/components/AccessibleSheet";
import { WayfindingIcon } from "@/components/WayfindingIcon";
import { useNavigation } from "@/context/NavigationContext";
import { getPoi, listPois } from "@/services/api";
import { colors } from "@/constants/colors";
import { TIPO_NO_LABEL, type Loja, type No } from "@/types";

export default function ShoppingMapScreen() {
  const nav = useNavigation();
  const router = useRouter();
  const params = useLocalSearchParams<{ locate?: string; manualOrigin?: string }>();
  const { width, height } = useWindowDimensions();
  const [locateRequest, setLocateRequest] = useState(0);
  const [manual, setManual] = useState(false);
  const [help, setHelp] = useState(false);
  const [poi, setPoi] = useState<Loja | null>(null);
  const [reference, setReference] = useState<No | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasRoute = !nav.hasArrived && !!nav.route;
  const mapWidth = Math.max(240, Math.min(width - 32, 1080));
  const mapHeight = Math.min(540, Math.max(320, height * .55));

  function locate() {
    if (!nav.originNode) { setManual(true); return; }
    setLocateRequest((value) => value + 1);
    if (nav.originNode.piso_id !== nav.floor?.id) void nav.selectFloor(nav.originNode.piso_id);
  }
  useEffect(() => {
    if (params.manualOrigin === "1") { setManual(true); router.setParams({ manualOrigin: "" }); }
  }, [params.manualOrigin]);
  useEffect(() => {
    if (params.locate === "1" && !nav.loading && nav.originNode) { locate(); router.setParams({ locate: "" }); }
  }, [params.locate, nav.loading, nav.originNode?.id]);
  useEffect(() => { if (nav.hasArrived) setLocateRequest((value) => value + 1); }, [nav.hasArrived]);

  async function inspectNode(node: No) {
    try {
      const places = await listPois({ shopping_id: nav.shopping?.id, piso_id: node.piso_id });
      const matching = places.find((item) => item.no_id === node.id);
      if (matching) setPoi(matching);
      else setReference(node);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível abrir o local."); }
  }
  async function navigateTo(place: Loja) {
    setPoi(null);
    await nav.setDestinationLoja(place);
    if (nav.originNode) router.push("/");
    else setManual(true);
  }

  return <View style={styles.screen} role="main" accessibilityLabel="Mapa do shopping">
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.heading}>
        <View style={{ flex: 1 }}><Text style={styles.eyebrow}>PLANTA DO SHOPPING</Text><Text accessibilityRole="header" style={styles.title}>{hasRoute ? "Mapa do trajeto" : "Mapa do shopping"}</Text></View>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Ajuda do mapa" style={styles.help} onPress={() => setHelp(true)}><WayfindingIcon name="help" size={22} /><Text style={styles.helpText}>Ajuda</Text></TouchableOpacity>
      </View>
      <View style={styles.locationRow}>
        <WayfindingIcon name="pin" color={colors.primary} size={22} />
        <View style={{ flex: 1 }}><Text style={styles.caption}>SUA POSIÇÃO CONFIRMADA</Text><Text testID="origin-label" style={styles.location}>{nav.originNode?.nome || "Posição ainda não definida"}</Text></View>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={nav.originNode ? "Mostrar minha posição" : "Definir ponto de partida"} style={styles.locateButton} onPress={locate}><Text style={styles.locateText}>{nav.originNode ? "Me localizar" : "Definir local"}</Text></TouchableOpacity>
      </View>
      {hasRoute && <TouchableOpacity accessibilityRole="button" style={styles.routeNotice} onPress={() => router.push("/")}><Text style={styles.routeNoticeText}>Destino: {nav.destinationName}</Text><Text style={styles.routeNoticeLink}>Ver instruções →</Text></TouchableOpacity>}
      {nav.hasArrived && <View style={styles.arrival} accessibilityLiveRegion="polite"><Text style={styles.arrivalText}>Você chegou! Sua posição foi atualizada.</Text><TouchableOpacity accessibilityRole="button" onPress={() => { nav.clearRoute(); router.push("/"); }}><Text style={styles.arrivalLink}>Escolher outro destino →</Text></TouchableOpacity></View>}
      {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      {nav.mapError && <Text accessibilityRole="alert" style={styles.error}>{nav.mapError}</Text>}
      {nav.loading && <ActivityIndicator accessibilityLabel="Carregando mapa" color={colors.primary} />}
      {!!nav.floors.length && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.floors} accessibilityLabel="Pisos do shopping">{nav.floors.map((floor) => <TouchableOpacity key={floor.id} accessibilityRole="button" accessibilityLabel={`Ver ${floor.nome}`} aria-pressed={floor.id === nav.floor?.id} style={[styles.floor, floor.id === nav.floor?.id && styles.floorActive]} onPress={() => void nav.selectFloor(floor.id)}><Text style={[styles.floorText, floor.id === nav.floor?.id && styles.floorTextActive]}>{floor.nome}</Text></TouchableOpacity>)}</ScrollView>}
      <Text style={styles.mapLabel}>Mapa: {nav.floor?.nome || "Carregando piso…"}</Text>
      {nav.floor && <SceneMap
        initialMode={width < 600 ? "2d" : "auto"}
        navigationRevision={nav.navigationRevision} shoppingId={nav.shopping?.id} floorId={nav.floor.id}
        width={mapWidth} height={mapHeight} routeNodes={nav.route?.nos || []}
        originNodeId={nav.originNode?.id} destinationNodeId={nav.hasArrived ? undefined : nav.destinationNodeId}
        onLocate={locate} locateRequest={locateRequest} hasOrigin={!!nav.originNode}
        onPoiPress={(id) => { void getPoi(id).then(setPoi).catch((cause) => setError(cause.message)); }}
        fallback={nav.graph?.piso_id === nav.floor.id ? <Map2D key={nav.floor.id} width={mapWidth} height={mapHeight}
          floor={nav.floor} graph={nav.graph} routeNodes={nav.route?.nos || []}
          origin={nav.originNode} destination={nav.hasArrived ? undefined : nav.destinationNodeId}
          onNodePress={(node) => void inspectNode(node)} onLocate={locate} locateRequest={locateRequest} /> : <ActivityIndicator accessibilityLabel="Carregando piso" />} />}
      <View style={styles.bottomActions}>
        <TouchableOpacity accessibilityRole="button" style={styles.scanButton} onPress={() => router.push("/scan")}><WayfindingIcon name="scan" color="#ffffff" /><Text style={styles.scanText}>Escanear QR</Text></TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" style={styles.exploreButton} onPress={() => router.push("/explore")}><Text style={styles.exploreText}>Explorar lugares</Text></TouchableOpacity>
      </View>
      <Text style={styles.tip}>Arraste a planta para explorar. Use dois dedos para aproximar.</Text>
    </ScrollView>
    <MapHelp visible={help} onClose={() => setHelp(false)} />
    <OrientationPicker visible={manual} onClose={() => setManual(false)} onLocate={locate} />
    <PoiDetails poi={poi} onClose={() => setPoi(null)} onNavigate={(place) => void navigateTo(place)} />
    <AccessibleSheet visible={!!reference} title={reference?.nome || "Ponto de referência"} onClose={() => setReference(null)}>
      <Text style={styles.tip}>{reference && TIPO_NO_LABEL[reference.tipo]} · {nav.floors.find((floor) => floor.id === reference?.piso_id)?.nome}</Text>
      <TouchableOpacity accessibilityRole="button" style={styles.scanButton} onPress={() => { if (!reference) return; void nav.setDestinationNode(reference); setReference(null); if (nav.originNode) router.push("/"); else setManual(true); }}><Text style={styles.scanText}>Traçar rota até este ponto</Text></TouchableOpacity>
    </AccessibleSheet>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 32, gap: 12, width: "100%", maxWidth: 1120, alignSelf: "center" },
  heading: { flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 4 },
  eyebrow: { color: colors.textMuted, fontSize: 12, fontWeight: "800", letterSpacing: .6 },
  title: { color: colors.text, fontSize: 27, lineHeight: 34, fontWeight: "800" },
  help: { minHeight: 48, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 5 },
  helpText: { color: colors.primary, fontSize: 14, fontWeight: "700" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 64, padding: 10, borderRadius: 10, backgroundColor: colors.sunSoft },
  caption: { color: colors.textMuted, fontSize: 11, fontWeight: "800" },
  location: { color: colors.text, fontSize: 16, lineHeight: 21, fontWeight: "700" },
  locateButton: { minHeight: 44, justifyContent: "center", paddingHorizontal: 10, borderRadius: 8, backgroundColor: "#ffffff" },
  locateText: { color: colors.primary, fontSize: 13, fontWeight: "800" },
  routeNotice: { minHeight: 52, borderLeftWidth: 4, borderLeftColor: colors.sun, borderRadius: 8, backgroundColor: colors.primary, padding: 10, flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 5 },
  routeNoticeText: { flex: 1, minWidth: 130, color: "#ffffff", fontSize: 14, fontWeight: "700" },
  routeNoticeLink: { color: colors.sun, fontSize: 14, fontWeight: "800" },
  arrival: { padding: 12, borderRadius: 8, backgroundColor: colors.successSoft, gap: 4 },
  arrivalText: { color: colors.text, fontSize: 15, fontWeight: "700" },
  arrivalLink: { color: colors.primary, fontSize: 14, fontWeight: "700" },
  floors: { gap: 8, paddingRight: 16 },
  floor: { minHeight: 44, paddingHorizontal: 16, justifyContent: "center", borderRadius: 22, borderWidth: 1, borderColor: colors.border, backgroundColor: "#ffffff" },
  floorActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  floorText: { color: colors.text, fontSize: 14, fontWeight: "700" },
  floorTextActive: { color: "#ffffff" },
  mapLabel: { color: colors.text, fontSize: 16, fontWeight: "700" },
  bottomActions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  scanButton: { minHeight: 48, paddingHorizontal: 14, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, borderRadius: 9, backgroundColor: colors.primary },
  scanText: { color: "#ffffff", fontSize: 15, fontWeight: "700" },
  exploreButton: { minHeight: 48, paddingHorizontal: 14, alignItems: "center", justifyContent: "center", borderRadius: 9, borderWidth: 1, borderColor: colors.primary },
  exploreText: { color: colors.primary, fontSize: 15, fontWeight: "700" },
  tip: { color: colors.textMuted, fontSize: 13, lineHeight: 20 },
  error: { color: colors.danger, fontSize: 14 },
});
