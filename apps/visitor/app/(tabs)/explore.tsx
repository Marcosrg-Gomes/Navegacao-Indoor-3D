import React, { useCallback, useEffect, useState } from "react";
import { AccessibilityInfo, ActivityIndicator, ScrollView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { getPoi } from "@/services/api";
import { useNavigation } from "@/context/NavigationContext";
import { useVisitorPreferences } from "@/context/VisitorPreferences";
import { getStatusOperacional, TIPO_NO_LABEL } from "@/types";
import { useDirectory, normalize, type Place } from "@/hooks/useDirectory";
import { PoiDetails } from "@/components/PoiDetails";
import { PoiStatus } from "@/components/PoiStatus";
import { DirectorySkeleton } from "@/components/DirectorySkeleton";
import { WayfindingIcon } from "@/components/WayfindingIcon";
import { colors } from "@/constants/colors";
import { AccessibleSheet } from "@/components/AccessibleSheet";
import { PlaceIdentity } from "@/components/PlaceIdentity";
import { DirectoryMap } from "@/components/DirectoryMap";
import { directoryStyles as d, ink, paper, rule, accent, mono, placeIdentity } from "@/components/directoryDesign";
import { SavedPlacesSheet } from "@/components/SavedPlacesSheet";

const shortcuts = [
  ["all", "Todos"], ["shops", "Lojas"], ["food", "Alimentação"], ["wc", "Banheiros"],
  ["lift", "Elevadores"], ["exit", "Saídas e entradas"], ["favorites", "Favoritos"], ["recent", "Recentes"],
] as const;
type Shortcut = typeof shortcuts[number][0];
const sorting = [["floor", "Meu piso primeiro"], ["name", "Nome A–Z"], ["distance", "Mais próximos"], ["category", "Categoria"]] as const;
type Sort = typeof sorting[number][0];

export default function ExploreScreen() {
  const nav = useNavigation();
  const { shopping, floors, originNode } = nav;
  const saved = useVisitorPreferences();
  const [accessibleOnly, setAccessibleOnly] = useState(false);
  const [status, setStatus] = useState("all");
  const focused = useIsFocused();
  const directory = useDirectory(focused, accessibleOnly);
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string; status?: string; shortcut?: Shortcut }>();
  const { width, fontScale } = useWindowDimensions();
  const wide = width >= 1000 && fontScale < 1.4;
  const [mapView, setMapView] = useState(false);
  const [selected, setSelected] = useState<Place | null>(null);
  const [letter, setLetter] = useState("");
  const [grouped, setGrouped] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);
  const [detail, setDetail] = useState<Place | null>(null);
  const [query, setQuery] = useState("");
  const [shortcut, setShortcut] = useState<Shortcut>("all");
  const [sort, setSort] = useState<Sort>("name");
  const [category, setCategory] = useState<string | undefined>();
  const [floorId, setFloorId] = useState<number | undefined>();
  const [filters, setFilters] = useState(false);
  const [navigatingKey, setNavigatingKey] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const favorites = saved.data.favorites[shopping?.codigo || ""] || [];
  const recent = saved.data.recent[shopping?.codigo || ""] || [];
  const currentFloorId = originNode?.piso_id ?? nav.floor?.id;

  function clearFilters() { setLetter(""); setCategory(undefined); setFloorId(undefined); setQuery(""); setShortcut("all"); setStatus("all"); setAccessibleOnly(false); setSort("name"); }
  useEffect(() => { if (!originNode) setAccessibleOnly(false); }, [originNode]);
  useEffect(() => { clearFilters(); setDetail(null); setSort("name"); }, [shopping?.id]);
  useEffect(() => { if (params.category && shopping) { setCategory(params.category); setStatus(params.status === "aberto" ? "aberto" : "all"); setQuery(""); setLetter(""); setShortcut("all"); } }, [params.category, params.status, shopping?.id]);
  useEffect(() => { if (params.shortcut && shortcuts.some(([value]) => value === params.shortcut)) { setShortcut(params.shortcut); setQuery(""); setLetter(""); } }, [params.shortcut, shopping?.id]);
  const term = normalize(query.trim());
  const filtered = directory.places.filter((place) => {
    if (letter && !normalize(place.name).startsWith(letter.toLowerCase())) return false;
    if (status !== "all" && (!place.poi || getStatusOperacional(place.poi) !== status)) return false;
    if (accessibleOnly && (!directory.distances || directory.distances[place.node.id] === undefined)) return false;
    if (category !== undefined && place.category !== category) return false;
    if (floorId !== undefined && place.node.piso_id !== floorId) return false;
    if (term && !normalize(place.name + " " + place.category + " " + TIPO_NO_LABEL[place.node.tipo]).includes(term)) return false;
    switch (shortcut) {
      case "shops": return place.node.tipo === "loja";
      case "food": return /alimenta|gastronom|restaurante|cafe/.test(normalize(place.category));
      case "wc": return place.node.tipo === "banheiro";
      case "lift": return place.node.tipo === "elevador";
      case "exit": return ["saida", "entrada"].includes(place.node.tipo);
      case "favorites": return favorites.includes(place.key);
      case "recent": return recent.includes(place.key);
      default: return true;
    }
  }).sort((a, b) => {
    if (shortcut === "recent") return recent.indexOf(a.key) - recent.indexOf(b.key);
    if (sort === "floor") {
      const floorOrder = Number(b.node.piso_id === currentFloorId) - Number(a.node.piso_id === currentFloorId);
      if (floorOrder) return floorOrder;
    }
    if (sort === "distance" && directory.distances) {
      const distanceOrder = (directory.distances[a.node.id] ?? Infinity) - (directory.distances[b.node.id] ?? Infinity);
      if (distanceOrder) return distanceOrder;
    }
    if (sort === "category") {
      const categoryOrder = a.category.localeCompare(b.category, "pt-BR");
      if (categoryOrder) return categoryOrder;
    }
    return a.name.localeCompare(b.name, "pt-BR");
  });

  const navigateTo = useCallback(async (place: Place, confirmed = false) => {
    setActionError(null); setNavigatingKey(place.key);
    try {
      if (place.poi) {
        const current = await getPoi(place.poi.id);
        if (getStatusOperacional(current) !== "aberto" && !confirmed) {
          setDetail({ ...place, poi: current }); return;
        }
        setDetail(null);
        await nav.setDestinationLoja(current);
      } else {
        setDetail(null); await nav.setDestinationNode(place.node);
      }
      router.replace(originNode ? "/(tabs)/" : "/(tabs)/?manualOrigin=1");
    } catch (err) { setActionError(err instanceof Error ? err.message : "Não foi possível consultar este local."); }
    finally { setNavigatingKey(null); }
  }, [nav.setDestinationLoja, nav.setDestinationNode, router, originNode]);

  function filterButton(label: string, selected: boolean, action: () => void, disabled = false) {
    return <TouchableOpacity key={label} accessibilityRole="button" accessibilityState={{ selected, disabled }} disabled={disabled}
      style={[styles.filter, selected && styles.filterActive, disabled && styles.disabled]} onPress={action}>
      <Text style={[styles.filterText, selected && styles.filterTextActive]}>{label}</Text>
    </TouchableOpacity>;
  }

  const activeFilters = [
    ...(shortcut !== "all" ? [{ key: "type", label: shortcuts.find(([value]) => value === shortcut)![1], remove: () => setShortcut("all") }] : []),
    ...(category ? [{ key: "category", label: category, remove: () => setCategory(undefined) }] : []),
    ...(floorId !== undefined ? [{ key: "floor", label: floors.find((floor) => floor.id === floorId)?.nome || "Piso", remove: () => setFloorId(undefined) }] : []),
    ...(status !== "all" ? [{ key: "status", label: status === "aberto" ? "Abertos" : status === "fechado" ? "Fechados" : "Em manutenção", remove: () => setStatus("all") }] : []),
    ...(accessibleOnly ? [{ key: "access", label: "Com rota sem escadas", remove: () => setAccessibleOnly(false) }] : []),
  ];
  const waiting = directory.loading || (accessibleOnly && directory.distanceLoading);
  const resultAnnouncement = waiting ? "Consultando locais" : `${filtered.length} locais encontrados. ${activeFilters.map((filter) => filter.label).join(", ")}`;
  useEffect(() => {
    if (Platform.OS === "web" || !focused || filters || waiting) return;
    const timer = setTimeout(() => AccessibilityInfo.announceForAccessibility(resultAnnouncement), 500);
    return () => clearTimeout(timer);
  }, [focused, filters, waiting, resultAnnouncement]);

  const connectedNodes = detail ? directory.graphs.find((graph) => graph.piso_id === detail.node.piso_id)?.conexoes_entre_pisos?.[detail.node.id] || [] : [];
  const connectedFloors = [...new Set(directory.places.filter((place) => connectedNodes.includes(place.node.id)).map((place) => floors.find((floor) => floor.id === place.node.piso_id)?.nome).filter(Boolean))];
  const selectedPlace = filtered.find((place) => place.key === selected?.key) || (filtered.length === 1 ? filtered[0] : null);
  const pinIds = directory.places.filter((place) => favorites.includes(place.key)).map((place) => place.node.id);
  const letters = [...new Set(directory.places.map((place) => normalize(place.name)[0]?.toUpperCase()))].filter(Boolean).sort();
  const groups = grouped ? directory.categories.map((label) => ({ label, places: filtered.filter((place) => place.category === label) })).filter((group) => group.places.length) : [{ label: "Destinos", places: filtered }];
  const directoryHeader = <View style={[styles.directoryHeader, wide && styles.directoryHeaderWide]}>
      <View style={{ flex: 1, minWidth: 0 }}><Text style={d.label}>{shopping?.nome || "SHOPPING"} · LOJAS E SERVIÇOS</Text><Text accessibilityRole="header" style={d.title}>Encontre seu lugar.</Text></View>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Meus lugares ↗" style={styles.savedHeader} onPress={() => setSavedOpen(true)}><Text style={styles.savedHeaderText}>☆  Meus lugares</Text></TouchableOpacity>
    </View>;
  return <View style={{ flex: 1, backgroundColor: paper }} role="main" accessibilityLabel="Explorar lojas e serviços">
    {wide && directoryHeader}
    <View style={{ flex: 1, flexDirection: "row" }}>
      {(!mapView || wide) && <ScrollView style={wide ? { width: "46%", flexGrow: 0, flexShrink: 0, borderRightWidth: 1, borderRightColor: rule } : { flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }} keyboardShouldPersistTaps="handled">
        {!wide && directoryHeader}
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Ver minha localização no mapa" style={styles.positionBanner} onPress={() => router.push(originNode ? "/map?locate=1" : "/map?manualOrigin=1")}>
          <Text style={styles.positionPin} accessible={false}>◎</Text><Text style={styles.positionText}>{originNode ? `Você está em ${originNode.nome} · ${floors.find((floor) => floor.id === originNode.piso_id)?.nome || "Piso"}` : "Onde você está? Defina sua posição"}  ›</Text>
        </TouchableOpacity>
        <View style={styles.searchRow}><WayfindingIcon name="search" color={ink} /><TextInput accessibilityLabel="Buscar no Explorar" placeholder="Buscar por nome ou serviço" placeholderTextColor={colors.textMuted} style={styles.search} value={query} onChangeText={(value) => { setQuery(value); setLetter(""); }} />{!!query && <TouchableOpacity accessibilityRole="button" accessibilityLabel="Limpar busca" style={styles.iconButton} onPress={() => setQuery("")}><WayfindingIcon name="close" /></TouchableOpacity>}</View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shortcutStrip} accessibilityLabel="Tipos de lugares">{shortcuts.filter(([value]) => ["all", "shops", "food", "wc", "lift"].includes(value)).map(([value, label]) => <TouchableOpacity key={value} accessibilityRole="button" accessibilityLabel={`Mostrar ${label}`} accessibilityState={{ selected: shortcut === value }} aria-pressed={shortcut === value} style={[styles.shortcutChip, shortcut === value && styles.shortcutSelected]} onPress={() => { setShortcut(value); setLetter(""); }}><Text style={[styles.shortcutText, shortcut === value && styles.shortcutTextSelected]}>{label}</Text></TouchableOpacity>)}</ScrollView>
        <View style={styles.actionBar}><TouchableOpacity accessibilityRole="button" accessibilityLabel="Filtrar e ordenar" style={styles.actionButton} onPress={() => setFilters(true)}><Text style={styles.actionText}>☷  Filtros {activeFilters.length ? `(${activeFilters.length})` : ""}</Text></TouchableOpacity>
          {!wide && <TouchableOpacity accessibilityRole="button" style={[styles.actionButton, styles.mapButton]} onPress={() => setMapView(true)}><Text style={styles.mapButtonText}>Ver no mapa ↗</Text></TouchableOpacity>}
        </View>
        <View style={styles.resultRow}><Text accessibilityLiveRegion="polite" style={d.muted}>{waiting ? "Consultando locais…" : filtered.length + (filtered.length === 1 ? " local" : " locais") + (activeFilters.length ? ` · ${activeFilters.map((filter) => filter.label.toLowerCase()).join(", ")}` : "")}</Text><TouchableOpacity accessibilityRole="button" style={d.link} onPress={() => setGrouped(!grouped)}><Text style={d.linkText}>{grouped ? "Ordem A–Z" : "Por categoria"}</Text></TouchableOpacity></View>
        {!query && ["all", "shops"].includes(shortcut) && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.alphabetStrip} accessibilityLabel="Índice alfabético">{["", ...letters].map((value) => <TouchableOpacity key={value} accessibilityRole="button" accessibilityLabel={value ? "Nomes com " + value : "Todas as letras"} accessibilityState={{ selected: letter === value }} style={[styles.letter, letter === value && styles.letterSelected]} onPress={() => { setLetter(value); setQuery(""); }}><Text style={[styles.letterText, letter === value && styles.letterTextSelected]}>{value || "A–Z"}</Text></TouchableOpacity>)}</ScrollView>}
        {!!activeFilters.length && <View style={styles.quickFilters}>{activeFilters.map((item) => <TouchableOpacity key={item.key} accessibilityRole="button" accessibilityLabel={"Remover filtro " + item.label} style={d.link} onPress={item.remove}><Text style={d.linkText}>{item.label} ×</Text></TouchableOpacity>)}{activeFilters.length > 1 && <TouchableOpacity accessibilityRole="button" style={d.link} onPress={clearFilters}><Text style={d.linkText}>Limpar filtros</Text></TouchableOpacity>}</View>}
        {(directory.error || actionError || directory.distanceError) && <View accessibilityRole="alert" style={d.line}><Text style={d.text}>{actionError || directory.error || directory.distanceError}</Text><TouchableOpacity accessibilityRole="button" style={d.link} onPress={() => { setActionError(null); directory.reload(); }}><Text style={d.linkText}>Tentar novamente</Text></TouchableOpacity></View>}
        {waiting && <DirectorySkeleton />}
        {!waiting && !filtered.length && <View style={d.line}><Text style={d.section}>Nenhum local nesta seleção.</Text><Text style={d.text}>Remova um critério ou experimente outro nome.</Text><TouchableOpacity accessibilityRole="button" style={d.link} onPress={clearFilters}><Text style={d.linkText}>Limpar filtros</Text></TouchableOpacity></View>}
        {groups.map((group) => <View key={group.label}>{grouped && <Text accessibilityRole="header" aria-level={2} style={[d.section, { marginVertical: 16 }]}>{group.label}</Text>}{group.places.map((item) => {
          const here = item.node.id === originNode?.id, identity = placeIdentity(item), distance = directory.distances?.[item.node.id], favorite = favorites.includes(item.key);
          return <View key={item.key} testID={item.poi ? "explore-poi-" + item.poi.id : "explore-node-" + item.node.id} style={[styles.store, { flexDirection: "row", backgroundColor: selectedPlace?.key === item.key ? colors.sunSoft : paper }]} {...(Platform.OS === "web" ? { onMouseEnter: () => setSelected(item) } : {})}>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel={item.name + ", ver detalhes"} onFocus={() => setSelected(item)} onPress={() => { setSelected(item); setDetail(item); }} style={styles.storeTitle}>
              <View style={styles.spaceCode}>{item.poi?.logo_url ? <PlaceIdentity name={item.name} code={identity.sign} logo={item.poi.logo_url} /> : <Text style={[styles.spaceCodeText, { color: identity.color }]}>{identity.sign}</Text>}</View>
              <View style={{ flex: 1, gap: 3 }}><Text style={styles.storeName}>{item.name}</Text><Text style={styles.storeMeta}>{identity.label} · {floors.find((floor) => floor.id === item.node.piso_id)?.nome}</Text>
                <Text style={styles.storeStatus}>{item.poi ? (item.poi.horario_resumo || (getStatusOperacional(item.poi) === "aberto" ? "Aberto" : getStatusOperacional(item.poi) === "fechado" ? "Fechado" : "Em manutenção")) + " · " : ""}{here ? "Você está aqui" : distance !== undefined ? "≈ " + Math.round(distance) + " m de percurso" : originNode ? "Distância indisponível" : "Distância após definir origem"}</Text>
                {item.poi?.horario_funcionamento && !item.poi.horario_resumo && <Text style={d.muted}>{item.poi.horario_funcionamento}</Text>}
              </View>
            </TouchableOpacity>
            <View style={styles.storeActions}><TouchableOpacity accessibilityRole="button" accessibilityLabel={(here ? "Ver " : "Como chegar a ") + item.name + (here ? " no mapa" : "")} style={styles.goButton} disabled={navigatingKey !== null} onPress={() => here ? router.push("/map?locate=1") : void navigateTo(item)}><Text style={styles.goButtonText}>{here ? "Ver" : "Ir"} →</Text></TouchableOpacity>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel={favorite ? "Remover " + item.name + " dos favoritos" : "Salvar " + item.name + " nos favoritos"} accessibilityState={{ selected: favorite, disabled: !saved.ready }} disabled={!saved.ready} onPress={() => shopping && saved.toggleFavorite(shopping.codigo, item.key)} style={d.link}><Text style={styles.saveText}>{favorite ? "Salvo ✓" : "Salvar"}</Text></TouchableOpacity>
            </View>
          </View>;
        })}</View>)}
        {originNode && <TouchableOpacity accessibilityRole="button" style={d.link} onPress={() => void nav.returnToEntry().then(() => router.replace("/(tabs)/"))}><Text style={d.linkText}>Voltar para a entrada</Text></TouchableOpacity>}
      </ScrollView>}
      {(wide || mapView) && <ScrollView style={{ flex: 1, backgroundColor: "#ecf3ef" }} contentContainerStyle={{ padding: wide ? 24 : 16, gap: 12 }}>
        {!wide && <TouchableOpacity accessibilityRole="button" style={styles.backToList} onPress={() => setMapView(false)}><Text style={styles.backToListText}>← Voltar à lista ({filtered.length})</Text></TouchableOpacity>}
        <DirectoryMap floors={floors} graphs={directory.graphs} selected={selectedPlace?.node || null} origin={originNode} pins={pinIds} onSelect={(node) => { const place = directory.places.find((item) => item.node.id === node.id); if (place) setSelected(place); }} />
        {selectedPlace && <View style={d.row}><TouchableOpacity accessibilityRole="button" style={d.button} onPress={() => void navigateTo(selectedPlace)}><Text style={d.buttonText}>Traçar rota ↗</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" style={d.link} onPress={() => setDetail(selectedPlace)}><Text style={d.linkText}>Informações do local</Text></TouchableOpacity></View>}
      </ScrollView>}
    </View>
    <PoiDetails poi={detail?.poi ?? null} onClose={() => setDetail(null)} onNavigate={() => detail && void navigateTo(detail, true)} />
    <AccessibleSheet visible={!!detail && !detail.poi} title={detail?.name || "Detalhes do local"} onClose={() => setDetail(null)}>
      <Text style={styles.intro}>{detail?.category} · {floors.find((floor) => floor.id === detail?.node.piso_id)?.nome}</Text>
      {detail?.node.tipo === "elevador" && <Text style={d.text}>Conexões cadastradas: {connectedFloors.join(", ") || "Nenhum outro piso disponível"}</Text>}
      <TouchableOpacity accessibilityRole="button" style={styles.primary} onPress={() => detail && void navigateTo(detail)}><Text style={styles.primaryText}>Traçar rota até este ponto</Text></TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" style={styles.secondary} onPress={() => setDetail(null)}><Text style={styles.secondaryText}>Fechar detalhes</Text></TouchableOpacity>
    </AccessibleSheet>
    <AccessibleSheet visible={filters} title="Filtros e ordenação" onClose={() => setFilters(false)}
      footer={<TouchableOpacity accessibilityRole="button" style={styles.primary} onPress={() => setFilters(false)}><Text style={styles.primaryText}>Mostrar resultados</Text></TouchableOpacity>}>
      <Text style={styles.filterLabel}>O que você procura?</Text><View style={styles.quickFilters}>
        {shortcuts.map(([value, label]) => filterButton(label, shortcut === value, () => setShortcut(value)))}
      </View>
      <Text style={styles.filterLabel}>Em qual piso?</Text><View style={styles.quickFilters}>
        {filterButton("Todos os pisos", floorId === undefined, () => setFloorId(undefined))}
        {floors.map((floor) => filterButton(floor.nome, floorId === floor.id, () => setFloorId(floor.id)))}
      </View>
      <Text style={styles.filterLabel}>Algum tipo de loja?</Text><View style={styles.quickFilters}>
        {filterButton("Todas", category === undefined, () => setCategory(undefined))}
        {directory.categories.map((label) => filterButton(label, category === label, () => setCategory(label)))}
      </View>
      <Text style={styles.filterLabel}>Qual ordem ajuda você?</Text><View style={styles.quickFilters}>
        {sorting.map(([value, label]) => filterButton(label, sort === value, () => setSort(value), value === "distance" && !originNode))}
      </View>
      <Text style={styles.filterLabel}>Está funcionando?</Text><View style={styles.quickFilters}>
        {[["all", "Todos os estados"], ["aberto", "Abertos"], ["fechado", "Fechados"], ["manutencao", "Em manutenção"]].map(([value, label]) => filterButton(label, status === value, () => setStatus(value)))}
      </View>
      <Text style={styles.filterLabel}>Precisa evitar escadas?</Text><View style={styles.quickFilters}>
        {filterButton("Todos os percursos", !accessibleOnly, () => setAccessibleOnly(false))}
        {filterButton("Com rota sem escadas", accessibleOnly, () => { setAccessibleOnly(true); nav.setAcessivel(true); }, !originNode)}
      </View>
      <Text style={styles.intro}>Mostra destinos alcançáveis por trechos acessíveis e elevadores a partir de você. Também ativa a preferência de rota sem escadas no mapa.</Text>
      <Text style={styles.intro}>A acessibilidade do interior da loja não é avaliada por este filtro. Limpar o filtro não altera sua preferência de rota no mapa.</Text>
      {!originNode && <Text style={styles.intro}>Defina sua localização para ordenar por distância e filtrar rotas sem escadas.</Text>}
      <TouchableOpacity accessibilityRole="button" style={styles.secondary} onPress={clearFilters}><Text style={styles.secondaryText}>Limpar filtros</Text></TouchableOpacity>
    </AccessibleSheet>
    <SavedPlacesSheet visible={savedOpen} onClose={() => setSavedOpen(false)} />
  </View>;
}
const styles = StyleSheet.create({
  directoryHeader: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: "column", alignItems: "flex-start", gap: 8 },
  directoryHeaderWide: { paddingHorizontal: 20, paddingVertical: 18, flexDirection: "row", alignItems: "center" },
  savedHeader: { minHeight: 44, justifyContent: "center", paddingHorizontal: 12, borderRadius: 9, backgroundColor: colors.sunSoft },
  savedHeaderText: { color: ink, fontSize: 14, fontWeight: "700" },
  positionBanner: { minHeight: 52, flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, marginBottom: 10 },
  positionPin: { fontSize: 24, color: colors.primary, fontWeight: "700" },
  positionText: { flex: 1, color: colors.primary, fontSize: 15, lineHeight: 21, fontWeight: "700" },
  shortcutStrip: { gap: 8, paddingVertical: 10, paddingRight: 20 },
  shortcutChip: { minHeight: 44, paddingHorizontal: 14, justifyContent: "center", borderRadius: 22, borderWidth: 1, borderColor: colors.border, backgroundColor: "#ffffff" },
  shortcutSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  shortcutText: { color: colors.text, fontSize: 14, fontWeight: "600" },
  shortcutTextSelected: { color: "#ffffff" },
  actionBar: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 2 },
  actionButton: { flexGrow: 1, minHeight: 48, alignItems: "center", justifyContent: "center", paddingHorizontal: 12, borderWidth: 1, borderColor: colors.primary, borderRadius: 9, backgroundColor: "#ffffff" },
  actionText: { color: colors.primary, fontSize: 15, fontWeight: "700" },
  mapButton: { backgroundColor: colors.sun, borderColor: colors.sun },
  mapButtonText: { color: ink, fontSize: 15, fontWeight: "700" },
  resultRow: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 4 },
  alphabetStrip: { gap: 3, paddingVertical: 3, paddingRight: 20 },
  letter: { minWidth: 44, minHeight: 44, paddingHorizontal: 6, alignItems: "center", justifyContent: "center", borderRadius: 8 },
  letterSelected: { backgroundColor: colors.primary },
  letterText: { color: ink, fontFamily: mono, fontSize: 14, fontWeight: "700" },
  letterTextSelected: { color: "#ffffff" },
  backToList: { minHeight: 48, paddingHorizontal: 14, borderRadius: 9, backgroundColor: "#ffffff", justifyContent: "center" },
  backToListText: { color: colors.primary, fontSize: 16, fontWeight: "700" },
  spaceCode: { minWidth: 48, minHeight: 48, flexShrink: 0, borderRadius: 10, backgroundColor: "#e6eee9", alignItems: "center", justifyContent: "center" },
  spaceCodeText: { fontFamily: mono, fontSize: 18, lineHeight: 24, fontWeight: "700" },
  storeMeta: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  storeStatus: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  storeActions: { minWidth: 62, alignItems: "center", justifyContent: "space-between" },
  goButton: { minWidth: 60, minHeight: 44, borderRadius: 9, backgroundColor: colors.sun, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  goButtonText: { color: ink, fontSize: 15, fontWeight: "800" },
  saveText: { color: colors.accent, fontSize: 13, fontWeight: "700" },
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 18, paddingBottom: 32, width: "100%", maxWidth: 1120, alignSelf: "center", flexGrow: 1 },
  header: { gap: 10, paddingBottom: 8 },
  headingRow: { flexDirection: "row", gap: 16, alignItems: "center", marginBottom: 2 },
  title: { fontSize: 29, fontWeight: "700", letterSpacing: -.6, color: colors.text },
  signNumber: { width: 48, height: 48, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" },
  intro: { fontSize: 14, lineHeight: 21, color: colors.textMuted, flexShrink: 1 },
  location: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 9, borderLeftWidth: 3, borderLeftColor: colors.primary, paddingHorizontal: 10, paddingVertical: 6 },
  locationName: { flex: 1, fontSize: 14, lineHeight: 21, color: colors.primary, fontWeight: "500" },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 10, backgroundColor: "#ffffff", paddingLeft: 12 },
  search: { flex: 1, minWidth: 0, minHeight: 52, fontSize: 16, color: colors.text, paddingVertical: 10, paddingRight: 8 },
  iconButton: { width: 48, minHeight: 48, alignItems: "center", justifyContent: "center" },
  quickFilters: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  filter: { minHeight: 44, justifyContent: "center", paddingHorizontal: 8, borderBottomWidth: 2, borderBottomColor: rule },
  filterActive: { borderBottomColor: colors.primary, backgroundColor: colors.primarySoft },
  filterText: { color: colors.text, fontSize: 14 }, filterTextActive: { color: colors.primary, fontWeight: "700" },
  filterLabel: { fontSize: 19, lineHeight: 25, fontWeight: "700", color: ink },
  filterSummary: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10 },
  filterTrigger: { flexDirection: "row", gap: 8, minHeight: 44, alignItems: "center", paddingHorizontal: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  activeTag: { minHeight: 44, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.primarySoft },
  tagText: { fontSize: 14, color: colors.primary },
  columns: { gap: 28 },
  store: { paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 9 },
  storeColumn: { flex: 1, maxWidth: "48.6%" },
  storeTop: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  storeTitle: { flex: 1, minHeight: 48, flexDirection: "row", gap: 10, alignItems: "flex-start" },
  storeName: { fontSize: 18, lineHeight: 23, fontWeight: "700", color: ink },
  storeCategory: { fontSize: 14, lineHeight: 20, color: colors.textMuted },
  savedButton: { width: 44, minHeight: 44, justifyContent: "center", alignItems: "center" },
  favorite: { backgroundColor: colors.primarySoft },
  actions: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10 },
  distance: { color: colors.textMuted, fontSize: 14, lineHeight: 21, flexShrink: 1, maxWidth: "100%" },
  scheduleText: { color: colors.textMuted, fontSize: 14, lineHeight: 21 },
  primary: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: ink },
  primaryText: { color: "white", fontWeight: "600", fontSize: 15 },
  secondary: { minHeight: 44, justifyContent: "center", paddingHorizontal: 4 },
  secondaryText: { color: colors.primary, fontSize: 14, fontWeight: "600" },
  disabled: { opacity: .6 }, errorBox: { padding: 14, backgroundColor: colors.dangerSoft, gap: 8 },
  empty: { paddingVertical: 28, gap: 12 },
});
