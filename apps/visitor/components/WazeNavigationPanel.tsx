import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "@/constants/colors";
import { useNavigation } from "@/context/NavigationContext";
import type { EtapaRota } from "@/types";

function direction(step?: EtapaRota) {
  if (!step) return "↑";
  if (step.tipo === "chegada") return "✓";
  if (step.tipo === "troca_piso") return "↕";
  if (/esquerda/i.test(step.texto)) return "↰";
  if (/direita/i.test(step.texto)) return "↱";
  return "↑";
}

export function WazeManeuverBanner() {
  const nav = useNavigation();
  if (!nav.route && !nav.routeLoading && !nav.routeError) return null;
  const steps = nav.route?.etapas?.filter((item) => item.tipo !== "inicio") ?? [];
  const moving = nav.simulationStatus !== "idle" && !!nav.simulationProgress;
  const current = moving ? nav.simulationProgress?.instruction : steps[0];
  const index = current ? steps.findIndex((item) => item.no_origem_id === current.no_origem_id && item.no_destino_id === current.no_destino_id) : -1;
  const next = index >= 0 ? steps[index + 1] : undefined;
  const arrived = nav.simulationStatus === "arrived";
  const failed = !nav.route && !!nav.routeError;
  const loading = !nav.route && nav.routeLoading;
  return <View testID="maneuver-banner" style={styles.maneuver} accessibilityLiveRegion="polite">
    <Text style={[styles.maneuverArrow, failed && styles.maneuverArrowError]} accessible={false}>{failed ? "!" : direction(current)}</Text>
    <View style={{ flex: 1, minWidth: 0 }}>
      <Text style={[styles.maneuverEyebrow, failed && styles.maneuverEyebrowError]}>{arrived ? "VOCÊ CHEGOU" : moving ? "NAVEGAÇÃO SIMULADA" : failed ? "ROTA NÃO DISPONÍVEL" : loading ? "CALCULANDO CAMINHO" : "CAMINHO PREPARADO"}</Text>
      <Text testID="current-instruction" style={styles.maneuverInstruction} numberOfLines={2}>{arrived ? nav.destinationName : failed ? nav.routeError : current?.texto || (nav.routeLoading ? "Calculando caminho…" : "Rota pronta para começar")}</Text>
      {!!next && !arrived && <Text style={styles.maneuverNext} numberOfLines={1}>Depois: {next.texto}</Text>}
    </View>
  </View>;
}

export function WazeNavigationPanel({ onChooseDestination, onCorrectPosition, onHelp }: {
  onChooseDestination: () => void;
  onCorrectPosition: () => void;
  onHelp: () => void;
}) {
  const nav = useNavigation();
  const [more, setMore] = useState(false);
  useEffect(() => setMore(false), [nav.route]);
  if (!nav.route && !nav.routeLoading && !nav.routeError) return null;

  const moving = nav.simulationStatus !== "idle" && !!nav.simulationProgress;
  const remaining = moving ? nav.simulationProgress?.remainingMeters : nav.route?.distancia_total_metros;
  const busy = nav.routeLoading || nav.arrivalLoading || nav.simulationStatus === "rerouting";
  const arrived = nav.simulationStatus === "arrived";

  function primaryAction() {
    if (nav.simulationStatus === "running") nav.pauseSimulation();
    else if (nav.routeStale || nav.simulationStatus === "error" || !nav.route) void nav.recalculate();
    else if (nav.simulationStatus === "paused") void nav.resumeSimulation();
    else if (arrived) onChooseDestination();
    else void nav.startSimulation();
  }

  const primaryLabel = nav.simulationStatus === "running" ? "Pausar" :
    nav.routeStale || nav.simulationStatus === "error" || (!nav.route && !busy) ? "Tentar novamente" :
    nav.simulationStatus === "paused" ? "Continuar" :
    arrived ? "Novo destino" : "Iniciar navegação";

  return <View testID="route-panel" style={styles.panel} accessibilityState={{ busy }}>
    <View style={styles.tripLine}><View style={{ flex: 1, minWidth: 0 }}><Text style={styles.tripDestination} numberOfLines={1}>{nav.destinationName || "Destino"}</Text><Text style={styles.tripMeta} numberOfLines={1}>De <Text testID="origin-label">{nav.originNode?.nome || "origem"}</Text> · {arrived ? "destino alcançado" : nav.simulationStatus === "running" ? "simulação" : "rota pronta"}</Text></View>
      {remaining !== undefined && !arrived && <View style={styles.distanceBlock}><Text testID="remaining-distance" style={styles.distance}>{Math.max(0, Math.round(remaining))}</Text><Text style={styles.unit}>m restantes</Text></View>}
    </View>

    {(nav.routeError || nav.simulationError) && <Text accessibilityRole="alert" style={styles.error}>{nav.simulationError || nav.routeError}</Text>}
    {busy && <View style={styles.busy}><ActivityIndicator color={colors.route} /><Text style={styles.busyText}>Atualizando caminho…</Text></View>}

    <View style={styles.actions}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={primaryLabel} disabled={busy}
        accessibilityState={{ disabled: busy }} onPress={primaryAction} style={[styles.primary, busy && styles.disabled]}>
        <Text style={styles.primaryText}>{primaryLabel}</Text>
      </TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Mais opções" accessibilityState={{ expanded: more }}
        onPress={() => setMore(!more)} style={styles.roundButton}><Text style={styles.roundText}>•••</Text></TouchableOpacity>
    </View>

    {more && <View style={styles.moreActions}>
      <TouchableOpacity accessibilityRole="switch" accessibilityLabel="Rota sem escadas" accessibilityState={{ checked: nav.acessivel, disabled: busy }}
        disabled={busy} onPress={() => nav.setAcessivel(!nav.acessivel)} style={styles.secondary}>
        <Text style={styles.secondaryText}>{nav.acessivel ? "✓ " : ""}Sem escadas</Text>
      </TouchableOpacity>
      {moving && !arrived && <TouchableOpacity accessibilityRole="button" disabled={busy} onPress={() => void nav.simulateDeviation()} style={styles.secondary}><Text style={styles.secondaryText}>Estou fora da rota</Text></TouchableOpacity>}
      {!arrived && <TouchableOpacity accessibilityRole="button" disabled={busy} onPress={() => void nav.recalculate()} style={styles.secondary}><Text style={styles.secondaryText}>Recalcular rota</Text></TouchableOpacity>}
      <TouchableOpacity accessibilityRole="button" onPress={onCorrectPosition} style={styles.secondary}><Text style={styles.secondaryText}>Corrigir posição</Text></TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" onPress={onHelp} style={styles.secondary}><Text style={styles.secondaryText}>Ajuda</Text></TouchableOpacity>
      {nav.simulationStatus === "idle" && nav.route && !nav.routeStale && <TouchableOpacity accessibilityRole="button" disabled={busy} onPress={() => void nav.completeNavigation()} style={styles.secondary}><Text style={styles.secondaryText}>Cheguei ao destino</Text></TouchableOpacity>}
      {moving && <TouchableOpacity accessibilityRole="button" onPress={() => void nav.stopSimulation()} style={styles.stop}><Text style={styles.stopText}>Encerrar</Text></TouchableOpacity>}
      <TouchableOpacity accessibilityRole="button" onPress={nav.clearRoute} style={styles.stop}><Text style={styles.stopText}>Cancelar rota</Text></TouchableOpacity>
    </View>}
  </View>;
}

const styles = StyleSheet.create({
  maneuver: { backgroundColor: "#141a20", flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 18, paddingVertical: 12, minHeight: 82, shadowColor: "#000", shadowOpacity: .22, shadowRadius: 10, elevation: 8 },
  maneuverArrow: { width: 52, color: "#fff", fontSize: 48, lineHeight: 52, fontWeight: "900", textAlign: "center" },
  maneuverArrowError: { color: "#ffb4ab" },
  maneuverEyebrow: { color: "#8bdcfa", fontSize: 10, lineHeight: 14, letterSpacing: 1, fontWeight: "800" },
  maneuverEyebrowError: { color: "#ffb4ab" },
  maneuverInstruction: { color: "#fff", fontSize: 19, lineHeight: 23, fontWeight: "800" },
  maneuverNext: { color: "#b9c5ca", fontSize: 12, lineHeight: 17, marginTop: 2 },
  panel: { backgroundColor: "#ffffff", paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12, gap: 8, borderTopWidth: 1, borderTopColor: "#dfe5e9" },
  tripLine: { flexDirection: "row", alignItems: "center", gap: 12 },
  tripDestination: { color: "#172536", fontSize: 16, lineHeight: 21, fontWeight: "800" },
  tripMeta: { color: "#5e6f78", fontSize: 12, lineHeight: 17 },
  distanceBlock: { minWidth: 46, alignItems: "flex-end" },
  distance: { color: "#102a3a", fontSize: 23, lineHeight: 26, fontWeight: "900" },
  unit: { color: "#607787", fontSize: 11, fontWeight: "700" },
  actions: { flexDirection: "row", gap: 8 },
  primary: { flex: 1, minHeight: 48, borderRadius: 14, backgroundColor: colors.route, alignItems: "center", justifyContent: "center", paddingHorizontal: 14 },
  primaryText: { color: "white", fontSize: 16, fontWeight: "900" },
  roundButton: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: "#cbd7df", backgroundColor: "#f5f8fa", alignItems: "center", justifyContent: "center" },
  roundText: { color: "#29495c", fontSize: 18, lineHeight: 20, fontWeight: "900" },
  moreActions: { flexDirection: "row", flexWrap: "wrap", gap: 7, borderTopWidth: 1, borderTopColor: "#e4eaee", paddingTop: 9 },
  secondary: { minHeight: 44, borderRadius: 12, backgroundColor: "#edf3f6", paddingHorizontal: 12, alignItems: "center", justifyContent: "center" },
  secondaryText: { color: "#24495e", fontSize: 13, fontWeight: "800" },
  stop: { minHeight: 44, borderRadius: 12, paddingHorizontal: 12, alignItems: "center", justifyContent: "center" },
  stopText: { color: colors.danger, fontSize: 13, fontWeight: "800" },
  busy: { flexDirection: "row", alignItems: "center", gap: 8 },
  busyText: { color: "#607787", fontSize: 12 },
  error: { color: colors.danger, backgroundColor: colors.dangerSoft, padding: 8, borderRadius: 8, fontSize: 12 },
  disabled: { opacity: .55 },
});
