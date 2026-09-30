import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@/context/NavigationContext";
import { colors } from "@/constants/colors";
import { directoryStyles as d, ink, paper, accent, mono } from "./directoryDesign";
import { useVisitPlan } from "@/context/VisitPlan";
import type { EtapaRota } from "@/types";

export function RouteGuide({ onLost, onPreview, onMap }: { onMap?: () => void; onLost?: () => void; onPreview?: (step: EtapaRota) => void }) {
  const nav = useNavigation();
  const plan = useVisitPlan();
  const [step, setStep] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  useEffect(() => { setStep(0); setExpanded(false); setShowDetails(false); }, [nav.route]);
  if (nav.hasArrived || (!nav.route && !nav.routeLoading && !nav.routeError)) return null;
  const route = nav.route;
  const steps = route?.etapas?.length ? route.etapas.filter((item) => item.tipo !== "inicio") :
    (route?.instrucoes.slice(1) || []).map((texto) => ({ texto, tipo: "caminho", piso_origem_id: nav.floor?.id, piso_destino_id: nav.floor?.id, distancia_metros: undefined, referencia: undefined }));
  const current = steps[step];
  const busy = nav.routeLoading || nav.arrivalLoading;
  const disabled = busy || nav.routeStale;
  const floors = nav.floors.filter((floor) => route?.nos.some((node) => node.piso_id === floor.id));
  function moveStep(index: number) {
    setStep(index);
    const targetFloor = steps[index]?.piso_origem_id;
    if (targetFloor && targetFloor !== nav.floor?.id) void nav.selectFloor(targetFloor);
  }
  return <View style={styles.panel} testID="route-panel" accessibilityState={{ busy }}>
    <View style={styles.heading}>
      <View style={{ flex: 1, minWidth: 160, gap: 5 }}>
        <Text style={d.label}>A CAMINHO DE</Text>
        <Text accessibilityRole="header" aria-level={2} style={styles.title}>{nav.originNode?.nome} → {nav.destinationName}</Text>
      </View>
      {route && <Text style={styles.distance}>{route.distancia_total_metros.toFixed(1)} m</Text>}
    </View>
    {nav.routeLoading && <View style={styles.row} accessibilityLiveRegion="polite"><ActivityIndicator color={colors.primary} /><Text style={styles.text}>{route ? "Recalculando trajeto…" : "Calculando rota…"}</Text></View>}
    {nav.routeError && <View style={styles.error} accessibilityRole="alert"><Text style={styles.errorText}>{nav.routeError}</Text>
      {route && <Text style={styles.errorText}>Este é o trajeto anterior. Recalcule antes de continuar.</Text>}
    </View>}
    {route && current && <>
      <View style={styles.current} accessibilityLiveRegion="polite" testID="current-instruction">
        <Text style={styles.direction} accessible={false}>{current.tipo === "troca_piso" ? "↕" : /esquerda/.test(current.texto) ? "↰" : /direita/.test(current.texto) ? "↱" : current.tipo === "chegada" ? "✓" : "↑"}</Text>
        <Text style={styles.nowLabel}>AGORA · PASSO {step + 1} DE {steps.length}</Text>
        <Text style={styles.instruction}>{current.texto}</Text>
        {current.referencia && <Text style={{ color: "#f4d8b0", fontSize: 16, lineHeight: 24 }}>{current.referencia}</Text>}
        {!!current.distancia_metros && <Text style={{ color: paper, fontFamily: mono, fontSize: 23 }}>{current.distancia_metros} m neste trecho</Text>}
        {current.tipo === "troca_piso" && <TouchableOpacity accessibilityRole="button" style={styles.secondary}
          onPress={() => current.piso_destino_id && void nav.selectFloor(current.piso_destino_id)}>
          <Text style={[styles.link, { color: paper }]}>Ver trecho no {nav.floors.find((floor) => floor.id === current.piso_destino_id)?.nome}</Text>
        </TouchableOpacity>}
      </View>
      <View style={styles.routeTools}>
        {onMap && <TouchableOpacity accessibilityRole="button" style={styles.mapAction} onPress={onMap}><Text style={styles.mapActionText}>Ver mapa do trajeto ↓</Text></TouchableOpacity>}
        {onLost && <TouchableOpacity accessibilityRole="button" style={styles.lostAction} onPress={onLost}><Text style={styles.lostActionText}>Estou perdido</Text></TouchableOpacity>}
      </View>
      {steps.slice(step + 1, step + 3).map((item, offset) => <View key={offset} style={styles.step}><Text style={d.label}>{offset === 0 ? "DEPOIS" : "EM SEGUIDA"}</Text><Text style={[d.text, { flex: 1 }]}>{item.texto}</Text></View>)}
      {route && <TouchableOpacity accessibilityRole="button" style={[styles.primary, disabled && styles.disabled]} disabled={disabled}
        accessibilityState={{ disabled }} onPress={() => void nav.completeNavigation()}><Text style={styles.primaryText}>{nav.arrivalLoading ? "Atualizando posição…" : "Cheguei ao destino"}</Text></TouchableOpacity>}
      {onPreview && Platform.OS === "web" && route.etapas && current.tipo !== "chegada" && <TouchableOpacity accessibilityRole="button" style={d.link} onPress={() => onPreview(current as EtapaRota)}><Text style={d.linkText}>Ver o que encontrarei ↗</Text></TouchableOpacity>}
      <View style={styles.row}>
        {step > 0 && <TouchableOpacity accessibilityRole="button" style={styles.secondary} disabled={disabled}
          accessibilityState={{ disabled }} onPress={() => moveStep(step - 1)}><Text style={styles.link}>Passo anterior</Text></TouchableOpacity>}
        {step < steps.length - 1 && <TouchableOpacity accessibilityRole="button" style={styles.secondary} disabled={disabled}
          accessibilityState={{ disabled }} onPress={() => moveStep(step + 1)}><Text style={styles.link}>Próximo passo</Text></TouchableOpacity>}
      </View>
      <TouchableOpacity accessibilityRole="button" accessibilityState={{ expanded }} style={styles.secondary} onPress={() => setExpanded((value) => !value)}>
        <Text style={styles.link}>{expanded ? "Ocultar instruções" : "Ver instruções"}</Text>
      </TouchableOpacity>
      {expanded && <View testID="route-instructions">{steps.map((item, index) => index >= step && index <= step + 2 ? null : <View key={index} style={styles.step}>
        <Text style={styles.stepIndex}>{index + 1}</Text><Text style={styles.stepText}>{item.texto}</Text>
      </View>)}</View>}
    </>}
    {route?.resumo && <TouchableOpacity accessibilityRole="button" accessibilityState={{ expanded: showDetails }} style={styles.detailToggle} onPress={() => setShowDetails((value) => !value)}><Text style={styles.detailToggleText}>{showDetails ? "Ocultar detalhes" : "Detalhes do percurso"}  {showDetails ? "⌃" : "⌄"}</Text><Text style={d.muted}>{route.resumo.minutos_estimados} min estimados · {nav.acessivel ? "sem escadas" : "rota padrão"}</Text></TouchableOpacity>}
    {showDetails && route?.resumo && <View style={d.line} testID="route-composition"><Text style={d.label}>{nav.acessivel ? "ROTA SEM ESCADAS" : "SEU PERCURSO"}</Text>
      <Text style={d.text}>{route.resumo.metros_corredor} m no piso · {route.resumo.elevadores} elevador(es) · {route.resumo.escadas} escada(s)</Text>
      <Text style={d.muted}>≈ {route.resumo.minutos_estimados} min caminhando a 1 m/s, sem espera nos acessos. Ajuste ao seu ritmo.</Text>
      {nav.acessivel && <Text style={d.muted}>O caminho evita escadas. Não há certificação de portas ou do interior das lojas.</Text>}
    </View>}
    {showDetails && floors.length > 1 && <View style={{ gap: 8 }}>
      <Text style={styles.text}>Rota entre pisos</Text>
      <View style={styles.row}>{floors.map((floor) => <TouchableOpacity key={floor.id} accessibilityRole="button"
        accessibilityLabel={`Ver trechos de ${floor.nome}`} accessibilityState={{ selected: nav.floor?.id === floor.id }}
        style={styles.secondary} onPress={() => void nav.selectFloor(floor.id)}>
        <Text style={styles.link}>{floor.nome} · {steps.filter((item) => item.piso_origem_id === floor.id && item.tipo !== "chegada").length} passos</Text>
      </TouchableOpacity>)}</View>
    </View>}
    {showDetails && plan.stops[0]?.id === nav.destinationNodeId && <Text style={d.text}>Passeio: {plan.stops.map((node) => node.nome).join(" → ")}</Text>}
    <View style={styles.row}>
      <TouchableOpacity accessibilityRole="button" style={styles.secondary} disabled={busy} accessibilityState={{ disabled: busy }} onPress={() => void nav.recalculate()}><Text style={styles.link}>Recalcular</Text></TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" style={styles.secondary} onPress={() => { plan.cancel(); nav.clearRoute(); }}><Text style={styles.link}>Cancelar rota</Text></TouchableOpacity>
    </View>
    <Text style={styles.note}>Avançar os passos não altera sua posição. Leia um QR durante o caminho ou confirme a chegada ao destino.</Text>
  </View>;
}

const styles = StyleSheet.create({
  panel: { gap: 10, paddingVertical: 8, backgroundColor: paper },
  heading: { flexDirection: "row", flexWrap: "wrap", gap: 10, alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 17, color: colors.text, fontWeight: "600" },
  eyebrow: { fontSize: 11, color: colors.primary, fontWeight: "600", letterSpacing: 1 },
  distance: { fontSize: 24, color: colors.primary, fontWeight: "600" },
  row: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 10 },
  current: { gap: 8, padding: 18, borderLeftWidth: 6, borderLeftColor: colors.sun, borderRadius: 12, backgroundColor: colors.primary },
  direction: { fontSize: 54, lineHeight: 58, color: colors.sun, fontWeight: "700" },
  nowLabel: { color: "#ffffff", fontSize: 13, fontWeight: "800", letterSpacing: 1 },
  instruction: { color: "#ffffff", fontSize: 23, lineHeight: 30, fontWeight: "700" },
  routeTools: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  mapAction: { flexGrow: 1, minHeight: 52, justifyContent: "center", alignItems: "center", paddingHorizontal: 12, borderRadius: 10, backgroundColor: colors.sun },
  mapActionText: { color: ink, fontSize: 16, fontWeight: "800" },
  lostAction: { minHeight: 52, justifyContent: "center", alignItems: "center", paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: colors.primary },
  lostActionText: { color: colors.primary, fontSize: 15, fontWeight: "700" },
  detailToggle: { minHeight: 52, justifyContent: "center", paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.border },
  detailToggleText: { color: colors.primary, fontSize: 16, fontWeight: "700" },
  text: { color: colors.text, fontSize: 14, lineHeight: 22 },
  note: { color: colors.textMuted, fontSize: 13, lineHeight: 20 },
  secondary: { minHeight: 44, padding: 10, justifyContent: "center" },
  link: { color: accent, fontSize: 14, fontWeight: "600" },
  primary: { minHeight: 52, justifyContent: "center", alignItems: "center", padding: 14, borderRadius: 10, backgroundColor: colors.primary },
  primaryText: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
  disabled: { opacity: .55 },
  error: { padding: 12, gap: 8, backgroundColor: colors.dangerSoft },
  errorText: { color: colors.danger, fontSize: 14, lineHeight: 22 },
  step: { flexDirection: "row", alignItems: "flex-start", borderTopWidth: 1, borderTopColor: colors.border, gap: 12, paddingVertical: 12 },
  stepIndex: { color: colors.primary, fontSize: 14, minWidth: 24 },
  stepText: { flex: 1, color: colors.text, fontSize: 14, lineHeight: 22 },
});
