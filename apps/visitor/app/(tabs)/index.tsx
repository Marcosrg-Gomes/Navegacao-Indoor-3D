import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, Platform, ScrollView, StyleSheet,
  Text, TouchableOpacity, useWindowDimensions, View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AccessibleSheet } from "@/components/AccessibleSheet";
import { SceneMap } from "@/components/SceneMap";
import { Map2D } from "@/components/Map2D";
import { SearchBar } from "@/components/SearchBar";
import { PoiDetails } from "@/components/PoiDetails";
import { WayfindingIcon } from "@/components/WayfindingIcon";
import { RouteGuide } from "@/components/RouteGuide";
import { WazeManeuverBanner, WazeNavigationPanel } from "@/components/WazeNavigationPanel";
import { FirstVisitHelp, MapHelp } from "@/components/MapHelp";
import { useNavigation } from "@/context/NavigationContext";
import { getPoi, listPois, resolveQrCode } from "@/services/api";
import { TIPO_NO_LABEL, getStatusOperacional, STATUS_OPERACIONAL_LABEL, type Loja, type No } from "@/types";
import { colors } from "@/constants/colors";
import { useIsFocused } from "@react-navigation/native";
import { useDirectory } from "@/hooks/useDirectory";
import { IntentHome } from "@/components/IntentHome";
import { FloorSwitcher } from "@/components/FloorSwitcher";
import { OrientationPicker } from "@/components/OrientationPicker";
import { SavedPlacesSheet } from "@/components/SavedPlacesSheet";
import { directoryStyles as d, paper, ink } from "@/components/directoryDesign";
import { useVisitPlan } from "@/context/VisitPlan";
import { useVisitorPreferences } from "@/context/VisitorPreferences";
import type { EtapaRota } from "@/types";

export default function MapScreen() {
  const nav = useNavigation();
  const router = useRouter();
  const directory = useDirectory(useIsFocused());
  const plan = useVisitPlan();
  const preferences = useVisitorPreferences();
  const scroll = useRef<ScrollView>(null);
  const mapOffset = useRef(0);
  const guideOffset = useRef(0);
  const goToMap = () => scroll.current?.scrollTo({ y: mapOffset.current, animated: false });
  const [fullMap, setFullMap] = useState(false);
  const [following, setFollowing] = useState(true);
  const [mobileMapSpace, setMobileMapSpace] = useState(0);
  const [lost, setLost] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);
  const [preview, setPreview] = useState<EtapaRota | null>(null);
  const activeRoute = !nav.hasArrived && !!(nav.route || nav.routeLoading || nav.routeError);
  const showMap = fullMap || activeRoute || nav.hasArrived;
  const nearFavorites = directory.places.filter((place) => (preferences.data.favorites[nav.shopping?.codigo || ""] || []).includes(place.key) && directory.distances?.[place.node.id] !== undefined && directory.distances[place.node.id] <= 35);
  async function previewStep(step: EtapaRota) { await nav.selectFloor(step.piso_origem_id); setPreview(step); requestAnimationFrame(goToMap); }
  useEffect(() => { setPreview(null); }, [nav.route, nav.hasArrived]);

  const params = useLocalSearchParams<{ qr?: string; token?: string; manualOrigin?: string; shopping?: string; floor?: string; locate?: string }>();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const mobileJourney = width < 600;
  const mobileMapHeight = Math.max(280, height - 190);
  const viewportWidth = Math.max(240, Math.min(width - 34, 1080));
  const mapHeight = Math.min(600, Math.max(420, height * .64));
  const [locateRequest, setLocateRequest] = useState(0);
  function locate() {
    setFollowing(true);
    setLocateRequest((value) => value + 1);
    const floorId = nav.positionEstimate?.floorId ?? nav.originNode?.piso_id;
    if (floorId && floorId !== nav.floor?.id) void nav.selectFloor(floorId);
  }
  const [manual, setManual] = useState(false);
  const [help, setHelp] = useState(false);
  const [options, setOptions] = useState(false);
  const [reference, setReference] = useState<No | null>(null);
  const [accessibilityHelp, setAccessibilityHelp] = useState(false);
  const [poi, setPoi] = useState<Loja | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [qrBusy, setQrBusy] = useState(false);
  const qrRead = useRef<string | null>(null);
  useEffect(() => {
    if (nav.hasArrived) setLocateRequest((value) => value + 1);
  }, [nav.hasArrived]);
  useEffect(() => {
    if (following && nav.simulationStatus !== "idle" && nav.positionEstimate?.floorId && nav.floor?.id !== nav.positionEstimate.floorId)
      void nav.selectFloor(nav.positionEstimate.floorId);
  }, [following, nav.simulationStatus, nav.positionEstimate?.floorId, nav.floor?.id]);
  useEffect(() => { if (nav.simulationStatus === "running" && nav.simulationProgress?.traveledMeters === 0) setFollowing(true); }, [nav.simulationStatus]);
  useEffect(() => {
    if (params.locate === "1" && !nav.loading && nav.originNode) { setFullMap(true); locate(); router.setParams({ locate: "" }); }
  }, [params.locate, nav.loading, nav.originNode?.id]);
  useEffect(() => {
    if (params.manualOrigin === "1") { setManual(true); router.setParams({ manualOrigin: "" }); }
  }, [params.manualOrigin]);
  useEffect(() => {
    const token = params.qr || params.token;
    if (token) setFullMap(true);
    if (!token || nav.loading || qrRead.current === token) return;
    qrRead.current = token;
    setQrBusy(true);
    setLocalError(null);
    resolveQrCode(token).then((result) => nav.setOriginNode(result.no, "qr"))
      .catch((e) => { setLocalError(e.message); setManual(true); })
      .finally(() => { setQrBusy(false); if (qrRead.current === token) qrRead.current = null; router.setParams({ qr: "", token: "" }); });
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
      else setReference(node);
    } catch (e) { setLocalError(e instanceof Error ? e.message : "Falha ao consultar o ponto."); }
  }

  const error = localError || nav.error;
  const status = nav.destinationLoja ? getStatusOperacional(nav.destinationLoja) : null;
  const renderMap = (surfaceHeight: number, compact: boolean) => nav.floor ? <SceneMap
    initialMode={compact ? "2d" : "auto"} compact={compact} controlsTop={compact ? activeRoute ? 90 : 75 : undefined}
    navigationRevision={nav.navigationRevision} previewStep={preview}
    shoppingId={nav.shopping?.id} floorId={nav.floor.id} width={compact ? width : viewportWidth} height={surfaceHeight}
    routeNodes={nav.routeDisplayNodes} originNodeId={nav.originNode?.id} position={nav.positionEstimate}
    following={following && nav.simulationStatus !== "idle"} onExplore={() => setFollowing(false)}
    destinationNodeId={nav.hasArrived ? undefined : nav.destinationNodeId} onLocate={locate} locateRequest={locateRequest} hasOrigin={!!nav.originNode}
    onPoiPress={(id) => { void getPoi(id).then(setPoi).catch((cause) => setLocalError(cause.message)); }}
    fallback={nav.graph?.piso_id === nav.floor.id ? <Map2D key={nav.floor.id} compact={compact} controlsTop={compact ? activeRoute ? 90 : 75 : undefined} width={compact ? width : viewportWidth} height={surfaceHeight}
      floor={nav.floor} graph={nav.graph} routeNodes={nav.routeDisplayNodes} origin={nav.originNode} position={nav.positionEstimate}
      following={following && nav.simulationStatus !== "idle"} onExplore={() => setFollowing(false)}
      destination={nav.hasArrived ? undefined : nav.destinationNodeId} onNodePress={(node) => void inspectNode(node)}
      onLocate={locate} locateRequest={locateRequest} highlight={preview?.referencia_no_id ?? preview?.no_destino_id} />
      : <ActivityIndicator accessibilityLabel="Carregando piso" />} /> : <ActivityIndicator accessibilityLabel="Carregando piso" />;
  return (
    <View style={styles.screen} role="main" accessibilityLabel="Mapa e instruções de navegação">
      {mobileJourney ? <View style={[styles.mobileJourney, { paddingTop: insets.top, backgroundColor: activeRoute ? "#141a20" : "#e6eeec" }]}>
        <StatusBar style={activeRoute ? "light" : "dark"} backgroundColor={activeRoute ? "#141a20" : "#e6eeec"} />
        <View style={styles.mobileMap} onLayout={(event) => setMobileMapSpace(Math.floor(event.nativeEvent.layout.height))}>
          {renderMap(mobileMapSpace || mobileMapHeight, true)}
          {activeRoute ? <View style={styles.mobileTop}><WazeManeuverBanner /></View> : <View style={styles.mobileTop}>
            <View style={styles.mobileSearchRow}><TouchableOpacity accessibilityRole="button" accessibilityLabel="Pesquisar destinos" style={styles.mobileSearch} onPress={() => router.push("/explore")}><WayfindingIcon name="search" color="#223246" /><Text style={styles.mobileSearchText} numberOfLines={1}>Para onde você vai?</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" accessibilityLabel="Ajuda" style={styles.mobileHelp} onPress={() => setHelp(true)}><WayfindingIcon name="help" color="#223246" /></TouchableOpacity></View>
          </View>}
          <FloorSwitcher floors={nav.floors} currentId={nav.floor?.id} top={Platform.OS === "web" ? activeRoute ? 155 : 136 : activeRoute ? 90 : 76}
            onSelect={(floorId) => { setFollowing(false); void nav.selectFloor(floorId); }} />
          {(nav.mapError || error) && <View style={styles.mobileError} accessibilityRole="alert"><Text style={styles.errorText}>{error || nav.mapError}</Text><TouchableOpacity accessibilityRole="button" onPress={() => { setLocalError(null); nav.clearError(); void nav.refresh(); }}><Text style={styles.link}>Tentar novamente</Text></TouchableOpacity></View>}
        </View>
        {activeRoute ? <WazeNavigationPanel onChooseDestination={() => router.push("/explore")} onCorrectPosition={() => setLost(true)} onHelp={() => setHelp(true)} /> : nav.hasArrived ? <View testID="arrival-notice" style={styles.mobileBottom} accessibilityRole="alert">
          <Text accessibilityRole="header" style={styles.mobileBottomTitle}>Você chegou a <Text testID="origin-label">{nav.originNode?.nome || nav.destinationName}</Text></Text><Text testID="location-update" style={styles.mobileBottomMeta}>{nav.floor?.nome} · Posição atualizada. A próxima rota começa daqui.</Text>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Iniciar outra navegação" style={styles.mobilePrimary} onPress={() => { nav.clearRoute(); router.push("/explore"); }}><Text style={styles.mobilePrimaryText}>Escolher outro destino</Text></TouchableOpacity>
        </View> : <View style={styles.mobileBottom}>
          <View style={styles.mobileBottomRow}><View style={{ flex: 1, minWidth: 0 }}><Text testID="origin-label" style={styles.mobileBottomTitle} numberOfLines={1}>{nav.originNode ? nav.originNode.nome : "Onde você está?"}</Text><Text testID="location-update" style={styles.mobileBottomMeta} numberOfLines={1}>{nav.floor?.nome || "Shopping"} · {nav.originNode ? nav.originUpdate?.source === "qr" ? "Posição por QR" : "Posição definida" : "Defina a posição para navegar"}</Text></View><TouchableOpacity accessibilityRole="button" accessibilityLabel={nav.originNode ? "Corrigir minha posição" : "Definir minha posição"} style={styles.mobilePin} onPress={() => setManual(true)}><WayfindingIcon name="pin" color="#223246" /></TouchableOpacity></View>
          <TouchableOpacity accessibilityRole="button" style={styles.mobilePrimary} onPress={() => router.push("/explore")}><Text style={styles.mobilePrimaryText}>Explorar destinos</Text><Text style={styles.mobilePrimaryText}>→</Text></TouchableOpacity>
        </View>}
      </View> : <ScrollView ref={scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {(nav.loading || qrBusy) && <View style={styles.row}><ActivityIndicator /><Text>Carregando mapa e localização…</Text></View>}
        {error && <View style={styles.error} accessibilityRole="alert">
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity accessibilityRole="button" onPress={() => { setLocalError(null); nav.clearError(); void nav.refresh(); }}>
            <Text style={styles.link}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>}
        {!showMap && <IntentHome directory={directory} onOrigin={() => setManual(true)} onSaved={() => setSavedOpen(true)} onMap={() => router.push("/map")} onPoi={setPoi} onHelp={() => setHelp(true)} />}
        {showMap && <Text accessibilityRole="header" style={d.section}>{activeRoute ? "Seu caminho" : nav.hasArrived ? "Você chegou." : "Mapa do shopping"}</Text>}
        {preferences.data.nearbyAlerts && nav.originNode && nearFavorites.length > 0 && <View style={d.line} accessibilityLiveRegion="polite"><Text style={d.label}>SEUS LUGARES POR PERTO</Text><Text style={d.text}>{nearFavorites.map((place) => place.name + " · " + Math.round(directory.distances![place.node.id]) + " m").join(" / ")}</Text><Text style={d.muted}>Até 35 m de percurso da última posição confirmada. Atualize por QR para conferir ao caminhar.</Text></View>}
        {showMap && !activeRoute && !nav.hasArrived && <TouchableOpacity accessibilityRole="button" style={d.link} onPress={() => { setFullMap(false); if (nav.hasArrived) nav.clearRoute(); }}><Text style={d.linkText}>← Buscar outro destino</Text></TouchableOpacity>}
        {nav.hasArrived && <View testID="arrival-notice" style={styles.arrival} accessibilityRole="alert" accessibilityLiveRegion="assertive">
          <View style={styles.row}><WayfindingIcon name="check" color={colors.success} /><Text style={styles.location}>Você chegou ao destino!</Text></View>
          <Text style={styles.controlText}>Localização atualizada para <Text testID="origin-label">{nav.originNode?.nome || nav.destinationName}</Text>.</Text>
          <Text style={styles.small}>Sua próxima rota começa aqui.</Text>
          <View style={styles.arrivalActions}>
            {plan.stops[0]?.id === nav.originNode?.id && <TouchableOpacity accessibilityRole="button" style={d.button} onPress={() => void plan.next()}><Text style={d.buttonText}>{plan.stops.length > 1 ? "Próxima parada: " + plan.stops[1].nome : "Concluir passeio"}</Text></TouchableOpacity>}
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Iniciar outra navegação" style={d.button} onPress={() => { nav.clearRoute(); setFullMap(false); }}><Text style={d.buttonText}>Escolher novo destino  →</Text></TouchableOpacity>
            <View style={d.row}><TouchableOpacity accessibilityRole="button" style={d.link} onPress={() => { nav.clearRoute(); setFullMap(false); }}><Text style={d.linkText}>Ver lugares próximos</Text></TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" style={d.link} onPress={() => setLost(true)}><Text style={d.linkText}>Corrigir minha posição</Text></TouchableOpacity></View>
          </View>
        </View>}
        {showMap && !activeRoute && !nav.hasArrived && <>
        <View style={styles.topLine}><View style={{ flex: 1 }}><SearchBar onSelect={setPoi} shoppingId={nav.shopping?.id} /></View>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Ajuda" style={styles.iconButton} onPress={() => setHelp(true)}><WayfindingIcon name="help" /></TouchableOpacity></View>
        <FirstVisitHelp onOpen={() => setHelp(true)} />
        {nav.shoppings.length > 1 && <ScrollView horizontal contentContainerStyle={styles.row}>
          {nav.shoppings.map((s) => <TouchableOpacity key={s.id} accessibilityRole="button" style={styles.chip}
            onPress={() => void nav.selectShopping(s.id)}><Text>{s.nome}{nav.shopping?.id === s.id ? " ✓" : ""}</Text></TouchableOpacity>)}
        </ScrollView>}
        <View style={styles.position}>
          <WayfindingIcon name="pin" color={colors.primary} size={24} />
          <View style={{ flex: 1, gap: 4 }}><Text style={styles.small}>Sua localização</Text>
            <Text style={styles.location} testID="origin-label">{nav.originNode?.nome || "Ponto de partida não definido"}</Text>
            {nav.originUpdate && <Text style={styles.small} testID="location-update">{nav.floors.find((f) => f.id === nav.originNode?.piso_id)?.nome} · {({ qr: "QR Code", manual: "Seleção manual", arrival: "Chegada confirmada" })[nav.originUpdate.source]} às {new Date(nav.originUpdate.at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</Text>}
          </View>
        </View>
        <View style={styles.row}>
          <TouchableOpacity accessibilityRole="button" style={styles.button} onPress={() => setManual(true)}>
            <Text style={styles.buttonText}>{nav.originNode ? "Alterar origem" : "Definir ponto de partida"}</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" style={styles.chip} onPress={() => router.push("/scan")}>
            <Text>Escanear QR</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.accessibility}>
          <TouchableOpacity accessibilityRole="switch" accessibilityState={{ checked: nav.acessivel, disabled: nav.arrivalLoading }}
            accessibilityLabel="Rota acessível" accessibilityHint="Evita escadas e usa elevadores para mudar de piso."
            disabled={nav.arrivalLoading} style={styles.accessibilityToggle} onPress={() => nav.setAcessivel(!nav.acessivel)}>
            <View style={[styles.switchTrack, nav.acessivel && styles.switchOn]}><View style={[styles.switchThumb, nav.acessivel && { alignSelf: "flex-end" }]} /></View>
            <Text style={styles.controlText}>Rota sem escadas</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" accessibilityState={{ expanded: accessibilityHelp }} style={styles.helpButton}
            onPress={() => setAccessibilityHelp((value) => !value)}><Text style={styles.link}>O que é acessível?</Text></TouchableOpacity>
        </View>
        {accessibilityHelp && <View style={styles.help}>
          <Text style={styles.controlText}>Um caminho com menos barreiras</Text>
          <Text style={styles.small}>Usa os trechos cadastrados como acessíveis e o elevador para mudar de piso. Evita escadas e escadas rolantes. É útil para quem usa cadeira de rodas, carrinho de bebê ou tem dificuldade de locomoção.</Text>
          <Text style={styles.small}>O trajeto pode ser mais longo. Se o elevador estiver bloqueado e não houver alternativa acessível, o aplicativo informa que não encontrou uma rota.</Text>
          <Text style={styles.small}>A opção avalia o caminho cadastrado. Ela não confirma as condições de acessibilidade dentro de cada loja.</Text>
        </View>}
        <TouchableOpacity accessibilityRole="button" accessibilityState={{ expanded: options }} style={styles.helpButton} onPress={() => setOptions((value) => !value)}><Text style={styles.link}>{options ? "Menos opções" : "Mais opções de navegação"}</Text></TouchableOpacity>
        {options && <View style={styles.row}><TouchableOpacity accessibilityRole="button" style={styles.chip} onPress={() => { void nav.returnToEntry().then(() => { if (!nav.originNode) setManual(true); }); }}><Text style={styles.controlText}>Voltar para a entrada</Text></TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" style={styles.chip} onPress={() => router.push("/explore")}><Text style={styles.controlText}>Favoritos e recentes</Text></TouchableOpacity></View>}
        </>}
        {activeRoute && <Text testID="origin-label" style={d.muted}>Última posição: {nav.originNode?.nome}</Text>}
        {(activeRoute || nav.hasArrived) && nav.originUpdate && <Text style={d.muted} testID="location-update">{nav.floors.find((f) => f.id === nav.originNode?.piso_id)?.nome} · {({ qr: "QR Code", manual: "Seleção manual", arrival: "Chegada confirmada" })[nav.originUpdate.source]}</Text>}
        {activeRoute && <View onLayout={(event) => { guideOffset.current = event.nativeEvent.layout.y; }}><RouteGuide onMap={goToMap} onLost={() => setLost(true)} onPreview={(step) => void previewStep(step)} /></View>}
        {showMap && <View style={{ gap: 12 }} onLayout={(event) => { mapOffset.current = event.nativeEvent.layout.y; }}>
        {activeRoute && <View style={d.row}><TouchableOpacity accessibilityRole="button" style={d.link} onPress={() => scroll.current?.scrollTo({ y: guideOffset.current, animated: false })}><Text style={d.linkText}>↑ Voltar às instruções</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" style={d.link} onPress={() => setLost(true)}><Text style={d.linkText}>Corrigir localização</Text></TouchableOpacity></View>}
        {preview && <View style={d.line}><Text style={d.label}>PRÉVIA DO TRECHO / NÃO É POSIÇÃO AO VIVO</Text><Text style={d.text}>{preview.referencia || preview.texto}</Text><View style={d.row}><TouchableOpacity accessibilityRole="button" style={d.link} onPress={() => setPreview(null)}><Text style={d.linkText}>Voltar à vista do mapa</Text></TouchableOpacity>{preview.piso_origem_id !== preview.piso_destino_id && <TouchableOpacity accessibilityRole="button" style={d.link} onPress={() => { const following = nav.route?.etapas?.find((step) => step.no_origem_id === preview.no_destino_id && step.piso_destino_id === preview.piso_destino_id && step.no_origem_id !== step.no_destino_id); if (following) void previewStep(following); else { void nav.selectFloor(preview.piso_destino_id); setPreview(null); } }}><Text style={d.linkText}>Ver saída no outro piso ↗</Text></TouchableOpacity>}</View></View>}
        {nav.floors.length > 0 && <ScrollView horizontal contentContainerStyle={styles.row}>
          {nav.floors.map((f) => <TouchableOpacity accessibilityRole="button" accessibilityState={{ selected: nav.floor?.id === f.id }} key={f.id} style={[styles.chip, nav.floor?.id === f.id && styles.selected]}
            onPress={() => void nav.selectFloor(f.id)}><Text style={nav.floor?.id === f.id ? styles.buttonText : styles.controlText}>{f.nome}</Text></TouchableOpacity>)}
        </ScrollView>}
        <View style={{ gap: 5, paddingVertical: 4 }}>
          <Text style={styles.location}>Mapa: {nav.floor?.nome || "nenhum piso disponível"}</Text>
          {!nav.originNode && <Text style={styles.small}>Leia um QR Code ou selecione a origem para se localizar.</Text>}
        </View>
        {nav.mapError && <View style={styles.error} accessibilityRole="alert"><Text style={styles.errorText}>{nav.mapError}</Text><TouchableOpacity accessibilityRole="button" style={styles.helpButton} onPress={() => nav.floor && void nav.selectFloor(nav.floor.id)}><Text style={styles.link}>Tentar mapa novamente</Text></TouchableOpacity></View>}
        {nav.floor && renderMap(mapHeight, false)}

        {nav.destinationLoja && !nav.hasArrived && <TouchableOpacity accessibilityRole="button" style={styles.card} onPress={() => setPoi(nav.destinationLoja)}>
          <Text style={styles.location}>Destino: {nav.destinationLoja.nome}</Text>
          <Text style={status !== "aberto" ? styles.errorText : styles.small}>{status && STATUS_OPERACIONAL_LABEL[status]} · Ver informações</Text>
          {status !== "aberto" && <Text style={styles.errorText}>Atendimento indisponível neste local.</Text>}
        </TouchableOpacity>}


        </View>}
      </ScrollView>}
      <MapHelp visible={help} onClose={() => setHelp(false)} />
      <AccessibleSheet visible={!!reference} title={reference?.nome || "Ponto de referência"} onClose={() => setReference(null)}>
        <Text style={styles.small}>{reference && TIPO_NO_LABEL[reference.tipo]} · {nav.floors.find((f) => f.id === reference?.piso_id)?.nome}</Text>
        <TouchableOpacity accessibilityRole="button" style={styles.button} onPress={() => { if (reference) { void nav.setDestinationNode(reference); setReference(null); if (!nav.originNode) setManual(true); } }}><Text style={styles.buttonText}>Traçar rota até este ponto</Text></TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" style={styles.chip} onPress={() => setReference(null)}><Text style={styles.controlText}>Fechar detalhes</Text></TouchableOpacity>
      </AccessibleSheet>
      <PoiDetails poi={poi} onClose={() => setPoi(null)} onNavigate={(p) => void navigateTo(p)} />
      <OrientationPicker visible={manual || lost} lost={lost} onClose={() => { setManual(false); setLost(false); }} onLocate={locate} />
      <SavedPlacesSheet visible={savedOpen} onClose={() => setSavedOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: paper },
  mobileJourney: { flex: 1, backgroundColor: "#e6eeec" },
  mobileTop: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 5 },
  mobileSearchRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12 },
  mobileSearch: { flex: 1, minWidth: 0, minHeight: 54, marginTop: 10, borderRadius: 28, flexDirection: "row", gap: 10, alignItems: "center", paddingHorizontal: 16, backgroundColor: "#fff", shadowColor: "#102234", shadowOpacity: .18, shadowRadius: 9, elevation: 6 },
  mobileSearchText: { flex: 1, color: "#263744", fontSize: 16, fontWeight: "700" },
  mobileHelp: { width: 48, height: 48, marginTop: 10, borderRadius: 24, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", shadowColor: "#102234", shadowOpacity: .14, shadowRadius: 7, elevation: 5 },
  mobileError: { position: "absolute", bottom: 14, left: 12, right: 12, zIndex: 6, backgroundColor: "#fff", padding: 10, borderRadius: 12 },
  mobileBottom: { backgroundColor: "#fff", paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12, gap: 8, borderTopWidth: 1, borderTopColor: "#dfe5e9" },
  mobileBottomRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  mobileBottomTitle: { color: "#172536", fontSize: 17, lineHeight: 22, fontWeight: "800" },
  mobileBottomMeta: { color: "#61727b", fontSize: 12, lineHeight: 17 },
  mobilePin: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "#eaf2f5" },
  mobilePrimary: { minHeight: 48, borderRadius: 15, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 17, backgroundColor: "#168bd6" },
  mobilePrimaryText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  mobileMap: { flex: 1, minHeight: 100, overflow: "hidden" },
  topLine: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  iconButton: { minWidth: 44, minHeight: 48, alignItems: "center", justifyContent: "center" },
  content: { padding: 16, gap: 12, paddingBottom: 24, width: "100%", maxWidth: 1120, alignSelf: "center" },
  row: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
  position: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6 },
  eyebrow: { fontSize: 10, letterSpacing: 1.2, fontWeight: "600", color: colors.textMuted },
  controlText: { color: colors.text, fontSize: 14, fontWeight: "500" },
  accessibility: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 6, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 8 },
  accessibilityToggle: { flexDirection: "row", alignItems: "center", minHeight: 44, gap: 10 },
  switchTrack: { width: 38, height: 24, borderRadius: 12, padding: 3, backgroundColor: "#68776e" },
  switchOn: { backgroundColor: colors.primary },
  switchThumb: { width: 18, height: 18, borderRadius: 9, backgroundColor: "white" },
  helpButton: { minHeight: 44, justifyContent: "center" },
  help: { backgroundColor: colors.primarySoft, padding: 16, gap: 8, borderRadius: 6 },
  routeHeading: { flexDirection: "row", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" },
  instructionsToggle: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", minHeight: 44, borderTopWidth: 1, borderTopColor: colors.border },
  step: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.border },
  stepNumber: { minWidth: 28, height: 28, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center", borderRadius: 4 },
  stepNumberText: { fontSize: 12, fontWeight: "600", color: colors.primary },
  stepText: { flex: 1, color: colors.text, fontSize: 14, lineHeight: 22 },
  location: { fontSize: 16, fontWeight: "600", color: colors.text },
  small: { fontSize: 13, lineHeight: 20, color: colors.textMuted },
  button: { backgroundColor: colors.primary, padding: 12, borderRadius: 6, minHeight: 44, justifyContent: "center" },
  buttonText: { color: "white", fontWeight: "600" },
  chip: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 6, padding: 12, minHeight: 44, justifyContent: "center" },
  selected: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
  card: { backgroundColor: colors.surface, borderRadius: 8, padding: 18, gap: 12, borderWidth: 1, borderColor: colors.border },
  distance: { fontSize: 24, fontWeight: "700", color: colors.primary },
  error: { backgroundColor: "#fee2e2", padding: 12, borderRadius: 8, gap: 8 },
  errorText: { color: "#b91c1c", fontSize: 14 },
  link: { color: colors.primary, fontWeight: "700", paddingVertical: 6 },
  arrival: { backgroundColor: colors.successSoft, borderLeftWidth: 4, borderLeftColor: colors.success, borderRadius: 6, padding: 18, gap: 10 },
  arrivalActions: { gap: 8, alignItems: "flex-start" },
  backdrop: { flex: 1, backgroundColor: "#0008", justifyContent: "flex-end", alignItems: "center" },
  modal: { backgroundColor: colors.surface, width: "100%", maxWidth: 640, maxHeight: "80%", padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, gap: 12 },
  picker: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border, color: colors.text },
});
