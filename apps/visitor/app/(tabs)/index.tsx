import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, FlatList, Modal, ScrollView, StyleSheet,
  Text, TouchableOpacity, useWindowDimensions, View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SceneMap } from "@/components/SceneMap";
import { Map2D } from "@/components/Map2D";
import { SearchBar } from "@/components/SearchBar";
import { PoiDetails } from "@/components/PoiDetails";
import { useNavigation } from "@/context/NavigationContext";
import { getPoi, listPois, resolveQrCode } from "@/services/api";
import { TIPO_NO_LABEL, getStatusOperacional, STATUS_OPERACIONAL_LABEL, type Loja, type No } from "@/types";
import { colors } from "@/constants/colors";

export default function MapScreen() {
  const nav = useNavigation();
  const router = useRouter();
  const params = useLocalSearchParams<{ qr?: string; token?: string; manualOrigin?: string; shopping?: string; floor?: string }>();
  const { width, height } = useWindowDimensions();
  const viewportWidth = Math.max(240, Math.min(width - 34, 1080));
  const mapHeight = Math.min(600, Math.max(420, height * .64));
  const [locateRequest, setLocateRequest] = useState(0);
  function locate() {
    setLocateRequest((value) => value + 1);
    if (nav.originNode && nav.originNode.piso_id !== nav.floor?.id) void nav.selectFloor(nav.originNode.piso_id);
  }
  const [manual, setManual] = useState(false);
  const [instructions, setInstructions] = useState(false);
  const [poi, setPoi] = useState<Loja | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [qrBusy, setQrBusy] = useState(false);
  const qrRead = useRef<string | null>(null);
  useEffect(() => {
    if (params.manualOrigin === "1") { setManual(true); router.setParams({ manualOrigin: "" }); }
  }, [params.manualOrigin]);
  useEffect(() => {
    const token = params.qr || params.token;
    if (!token || nav.loading || qrRead.current === token) return;
    qrRead.current = token;
    setQrBusy(true);
    setLocalError(null);
    resolveQrCode(token).then((result) => nav.setOriginNode(result.no))
      .catch((e) => { setLocalError(e.message); setManual(true); })
      .finally(() => { setQrBusy(false); router.setParams({ qr: "", token: "" }); });
  }, [params.qr, params.token, nav.loading, nav.setOriginNode]);

  const initialSelection = useRef(false);
  useEffect(() => {
    if (nav.loading || initialSelection.current || !params.shopping) return;
    initialSelection.current = true;
    void nav.selectShopping(Number(params.shopping)).then(() => params.floor ? nav.selectFloor(Number(params.floor)) : undefined)
      .catch((error) => setLocalError(error.message));
  }, [nav.loading, params.shopping, params.floor]);

  async function chooseOrigin(node: No) {
    try { await nav.setOriginNode(node); setManual(false); setLocalError(null); }
    catch (error) { setLocalError(error instanceof Error ? error.message : "Falha ao definir a origem."); }
  }
  async function navigateTo(destination: Loja) {
    setPoi(null);
    await nav.setDestinationLoja(destination);
    if (!nav.originNode) setManual(true);
  }
  async function inspectNode(node: No) {
    try {
      const pois = await listPois({ shopping_id: nav.shopping?.id, piso_id: node.piso_id });
      const found = pois.find((item) => item.no_id === node.id);
      if (found) setPoi(found);
      else { setLocalError("Este ponto é uma referência do mapa. Para usá-lo como origem, toque em Alterar origem."); }
    } catch (e) { setLocalError(e instanceof Error ? e.message : "Falha ao consultar o ponto."); }
  }

  const error = localError || nav.error;
  const status = nav.destinationLoja ? getStatusOperacional(nav.destinationLoja) : null;
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <SearchBar onSelect={setPoi} shoppingId={nav.shopping?.id} />
        {(nav.loading || qrBusy) && <View style={styles.row}><ActivityIndicator /><Text>Carregando mapa e localização…</Text></View>}
        {error && <View style={styles.error} accessibilityRole="alert">
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity accessibilityRole="button" onPress={() => { setLocalError(null); nav.clearError(); void nav.refresh(); }}>
            <Text style={styles.link}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>}
        {nav.shoppings.length > 1 && <ScrollView horizontal contentContainerStyle={styles.row}>
          {nav.shoppings.map((s) => <TouchableOpacity key={s.id} accessibilityRole="button" style={styles.chip}
            onPress={() => void nav.selectShopping(s.id)}><Text>{s.nome}{nav.shopping?.id === s.id ? " ✓" : ""}</Text></TouchableOpacity>)}
        </ScrollView>}
        <Text style={styles.location} testID="origin-label">📍 {nav.originNode?.nome || "Ponto de partida não definido"}</Text>
        <View style={styles.row}>
          <TouchableOpacity accessibilityRole="button" style={styles.button} onPress={() => setManual(true)}>
            <Text style={styles.buttonText}>{nav.originNode ? "Alterar origem" : "Definir ponto de partida"}</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" style={styles.chip} onPress={() => router.push("/scan")}>
            <Text>Escanear QR</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="switch" accessibilityState={{ checked: nav.acessivel }}
            accessibilityLabel="Rota acessível" style={styles.chip} onPress={() => nav.setAcessivel(!nav.acessivel)}>
            <Text>♿ {nav.acessivel ? "Acessível: sim" : "Acessível: não"}</Text>
          </TouchableOpacity>
        </View>
        {nav.floors.length > 0 && <ScrollView horizontal contentContainerStyle={styles.row}>
          {nav.floors.map((f) => <TouchableOpacity accessibilityRole="button" key={f.id} style={[styles.chip, nav.floor?.id === f.id && styles.selected]}
            onPress={() => void nav.selectFloor(f.id)}><Text>{f.nome}{nav.floor?.id === f.id ? " ✓" : ""}</Text></TouchableOpacity>)}
        </ScrollView>}
        <View style={{ gap: 5, paddingVertical: 4 }}>
          <Text style={styles.location}>Mapa: {nav.floor?.nome || "nenhum piso disponível"}</Text>
          <Text style={styles.small}>{nav.originNode ? `Origem atual: ${nav.originNode.nome || "ponto selecionado"} · ${nav.floors.find((f) => f.id === nav.originNode?.piso_id)?.nome || ""}` : "Leia um QR Code ou selecione a origem para se localizar."}</Text>
          {nav.originNode && <Text style={styles.small}>A posição é atualizada por QR Code ou seleção manual.</Text>}
        </View>
        {nav.floor && <SceneMap
          shoppingId={nav.shopping?.id} floorId={nav.floor.id} width={viewportWidth} height={mapHeight}
          routeNodes={nav.route?.nos || []} originNodeId={nav.originNode?.id}
          destinationNodeId={nav.destinationLoja?.no_id} onLocate={locate} locateRequest={locateRequest} hasOrigin={!!nav.originNode}
          onPoiPress={(id) => { void getPoi(id).then(setPoi).catch((error) => setLocalError(error.message)); }}
          fallback={nav.graph?.piso_id === nav.floor.id ? <Map2D key={nav.floor.id} width={viewportWidth} height={mapHeight}
            floor={nav.floor} graph={nav.graph} routeNodes={nav.route?.nos || []} origin={nav.originNode}
            destination={nav.destinationLoja?.no_id} onNodePress={(node) => void inspectNode(node)}
            onLocate={locate} locateRequest={locateRequest} /> : <ActivityIndicator accessibilityLabel="Carregando piso" />} />}

        {nav.destinationLoja && <TouchableOpacity accessibilityRole="button" style={styles.card} onPress={() => setPoi(nav.destinationLoja)}>
          <Text style={styles.location}>Destino: {nav.destinationLoja.nome}</Text>
          <Text style={status !== "aberto" ? styles.errorText : styles.small}>{status && STATUS_OPERACIONAL_LABEL[status]} · Ver informações</Text>
          {status !== "aberto" && <Text style={styles.errorText}>Atendimento indisponível neste local.</Text>}
        </TouchableOpacity>}
        {nav.routeLoading && <View style={styles.row}><ActivityIndicator /><Text>Calculando rota…</Text></View>}
        {nav.hasArrived && <View testID="arrival-notice" style={styles.arrival} accessibilityRole="alert" accessibilityLiveRegion="assertive">
          <Text style={styles.location}>🎉 Você chegou ao destino!</Text>
          <Text>{nav.destinationLoja?.nome}</Text>
          <TouchableOpacity accessibilityRole="button" onPress={nav.clearRoute}><Text style={styles.link}>Iniciar outra navegação</Text></TouchableOpacity>
        </View>}
        {nav.route && !nav.hasArrived && <View style={styles.card} testID="route-panel">
          <Text style={styles.distance}>{nav.route.distancia_total_metros.toFixed(1)} m</Text>
          <Text style={styles.small}>Siga as instruções. A posição é atualizada ao ler outro QR Code.</Text>
          {nav.route.instrucoes.map((item, i) => <Text key={i} style={styles.small}>{i + 1}. {item}</Text>)}
          {new Set(nav.route.nos.map((n) => n.piso_id)).size > 1 && <Text style={styles.small}>Rota entre pisos: use o seletor acima para ver cada trecho.</Text>}
          <View style={styles.row}>
            <TouchableOpacity accessibilityRole="button" style={styles.button} onPress={() => setInstructions(true)}><Text style={styles.buttonText}>Ver instruções</Text></TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" style={styles.chip} onPress={() => void nav.recalculate()}><Text>Recalcular</Text></TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" style={styles.chip} onPress={nav.completeNavigation}><Text>Cheguei ao destino</Text></TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" style={styles.chip} onPress={nav.clearRoute}><Text>Cancelar rota</Text></TouchableOpacity>
          </View>
        </View>}
      </ScrollView>
      <PoiDetails poi={poi} onClose={() => setPoi(null)} onNavigate={(p) => void navigateTo(p)} />
      <Modal visible={manual} transparent animationType="slide" onRequestClose={() => setManual(false)}>
        <View style={styles.backdrop}><View style={styles.modal}>
          <Text style={styles.location}>Selecionar ponto de partida</Text>
          <Text style={styles.small}>Piso: {nav.floor?.nome}. Feche e escolha outro piso, se necessário.</Text>
          <FlatList data={nav.graph?.nos || []} keyExtractor={(n) => String(n.id)}
            renderItem={({ item }) => <TouchableOpacity accessibilityRole="button" style={styles.picker} onPress={() => void chooseOrigin(item)}>
              <Text style={styles.location}>{item.nome || "Nó " + item.id}</Text><Text>{TIPO_NO_LABEL[item.tipo]}</Text>
            </TouchableOpacity>}
            ListEmptyComponent={<Text>Nenhum ponto disponível. Verifique a conexão e recarregue.</Text>} />
          <TouchableOpacity accessibilityRole="button" style={styles.chip} onPress={() => setManual(false)}><Text>Fechar seleção</Text></TouchableOpacity>
        </View></View>
      </Modal>
      <Modal visible={instructions} transparent animationType="slide" onRequestClose={() => setInstructions(false)}>
        <View style={styles.backdrop}><View style={styles.modal}>
          <Text style={styles.location}>Instruções de rota</Text>
          <FlatList data={nav.route?.instrucoes || []} keyExtractor={(_, i) => String(i)}
            renderItem={({ item, index }) => <Text style={styles.picker}>{index + 1}. {item}</Text>} />
          <Text style={styles.small}>Ao alcançar o local, leia o QR do destino ou confirme sua chegada.</Text>
          <TouchableOpacity accessibilityRole="button" style={styles.chip} onPress={() => setInstructions(false)}><Text>Fechar instruções</Text></TouchableOpacity>
        </View></View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 12, paddingBottom: 24, width: "100%", maxWidth: 1120, alignSelf: "center" },
  row: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
  location: { fontSize: 16, fontWeight: "600", color: colors.text },
  small: { fontSize: 12, color: colors.textMuted },
  button: { backgroundColor: colors.primary, padding: 12, borderRadius: 10 },
  buttonText: { color: "white", fontWeight: "600" },
  chip: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10 },
  selected: { backgroundColor: "#dbeafe", borderColor: colors.primary },
  card: { backgroundColor: colors.surface, borderRadius: 12, padding: 14, gap: 10, borderWidth: 1, borderColor: colors.border },
  distance: { fontSize: 24, fontWeight: "700", color: colors.primary },
  error: { backgroundColor: "#fee2e2", padding: 12, borderRadius: 8, gap: 8 },
  errorText: { color: "#b91c1c", fontSize: 14 },
  link: { color: colors.primary, fontWeight: "700", paddingVertical: 6 },
  arrival: { backgroundColor: "#dcfce7", borderRadius: 12, padding: 16, gap: 8 },
  backdrop: { flex: 1, backgroundColor: "#0008", justifyContent: "flex-end", alignItems: "center" },
  modal: { backgroundColor: colors.surface, width: "100%", maxWidth: 640, maxHeight: "80%", padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, gap: 12 },
  picker: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border, color: colors.text },
});
