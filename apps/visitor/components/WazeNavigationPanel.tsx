import { useEffect, useRef, useState } from "react";
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
  return <View testID="maneuver-banner" style={[styles.maneuver, failed && styles.maneuverFailed]} accessibilityLiveRegion="polite">
    <Text style={[styles.maneuverArrow, failed && styles.maneuverArrowError]} accessible={false}>{failed ? "!" : direction(current)}</Text>
    <View style={{ flex: 1, minWidth: 0 }}>
      <Text style={[styles.maneuverEyebrow, failed && styles.maneuverEyebrowError]}>{arrived ? "VOCÊ CHEGOU" : moving ? "NAVEGAÇÃO SIMULADA" : failed ? "ROTA NÃO DISPONÍVEL" : loading ? "CALCULANDO CAMINHO" : "CAMINHO PREPARADO"}</Text>
      <Text testID="current-instruction" style={[styles.maneuverInstruction, failed && styles.maneuverInstructionError]}>{arrived ? nav.destinationName : failed ? nav.routeError : current?.texto || (nav.routeLoading ? "Calculando caminho…" : "Rota pronta para começar")}</Text>
      {!!next && !arrived && <Text style={[styles.maneuverNext, failed && styles.maneuverNextError]}>Depois: {next.texto}</Text>}
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
  const prevRouteKey = useRef<{ revisao: string | null } | null>(null);
  useEffect(() => {
    const key = nav.route ? { revisao: nav.route.revisao } : null;
    if (prevRouteKey.current && key &&
        prevRouteKey.current.revisao === key.revisao) {
      return;
    }
    prevRouteKey.current = key;
    setMore(false);
  }, [nav.route]);
  if (!nav.route && !nav.routeLoading && !nav.routeError) return null;

  const moving = nav.simulationStatus !== "idle" && !!nav.simulationProgress;
  const remaining = moving ? nav.simulationProgress?.remainingMeters : nav.route?.distancia_total_metros;
  const busy = nav.routeLoading || nav.arrivalLoading || nav.simulationStatus === "rerouting";
  const arrived = nav.simulationStatus === "arrived";

  function primaryAction() {
    if (nav.simulationStatus === "running") nav.pauseSimulation();
    else if (nav.simulationStatus === "error" || !nav.route) void nav.recalculate();
    else if (nav.simulationStatus === "paused") void nav.resumeSimulation();
    else if (arrived) onChooseDestination();
    else void nav.startSimulation();
  }

  const primaryLabel = nav.simulationStatus === "running" ? "Pausar" :
    nav.routeStale || nav.simulationStatus === "error" || (!nav.route && !busy) ? "Tentar novamente" :
    nav.simulationStatus === "paused" ? "Continuar" :
    arrived ? "Novo destino" : "Iniciar navegação";

  return <View testID="route-panel" style={[styles.panel, nav.arrivalLoading && styles.panelBusy]} accessibilityState={{ busy }}>
    <View style={styles.tripLine}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.tripDestination} numberOfLines={1}>{nav.destinationName || "Destino"}</Text>
        <Text style={styles.tripMeta} numberOfLines={1}>
          De <Text testID="origin-label">{nav.originNode?.nome || "origem"}</Text> ·
          {arrived ? "destino alcançado" : nav.simulationStatus === "running" ? "simulação" : "rota pronta"}
        </Text>
      </View>
      {remaining !== undefined && !arrived && <View style={styles.distanceBlock}>
        <Text testID="remaining-distance" style={styles.distance}>{Math.max(0, Math.round(remaining))}</Text>
        <Text style={styles.unit}>m restantes</Text>
      </View>}
    </View>

    {(nav.routeError || nav.simulationError) && <Text accessibilityRole="alert" style={styles.error}>{nav.simulationError || nav.routeError}</Text>}
    {busy && <View style={styles.busy}>
      <ActivityIndicator color={colors.route} />
      <Text style={styles.busyText}>Atualizando caminho…</Text>
    </View>}

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
  maneuver: {
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 86,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#e2eae8",
  },
  maneuverFailed: {
    borderColor: "#f3c6c2",
    backgroundColor: "#fdf1f0",
  },
  maneuverArrow: {
    width: 56,
    color: "#ffffff",
    fontSize: 52,
    lineHeight: 56,
    fontWeight: "900",
    textAlign: "center",
  },
  maneuverArrowError: {
    color: "#d9736b",
  },
  maneuverEyebrow: {
    color: "#5e736e",
    fontSize: 9,
    lineHeight: 13,
    letterSpacing: 1.2,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  maneuverEyebrowError: {
    color: "#d9736b",
  },
  maneuverInstruction: {
    color: "#22332d",
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800",
  },
  maneuverInstructionError: {
    color: "#d9736b",
  },
  maneuverNext: {
    color: "#8da7a2",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  maneuverNextError: {
    color: "#c48a84",
  },
  panel: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 10,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#e2eae8",
  },
  panelBusy: {
    opacity: 0.92,
  },
  tripLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  tripDestination: {
    color: "#22332d",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
  },
  tripMeta: {
    color: "#5e736e",
    fontSize: 12,
    lineHeight: 17,
  },
  distanceBlock: {
    minWidth: 56,
    alignItems: "flex-end",
  },
  distance: {
    color: "#14332e",
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "900",
  },
  unit: {
    color: "#5e736e",
    fontSize: 11,
    fontWeight: "700",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  primary: {
    flex: 1,
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: "#14332e",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    shadowColor: "#14332e",
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryText: {
    color: "white",
    fontSize: 15,
    fontWeight: "800",
  },
  roundButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#e2eae8",
    backgroundColor: "#f4f1ea",
    alignItems: "center",
    justifyContent: "center",
  },
  roundText: {
    color: "#22332d",
    fontSize: 18,
    lineHeight: 20,
    fontWeight: "900",
  },
  moreActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#e8ede8",
    paddingTop: 10,
  },
  secondary: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: "#f4f1ea",
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: {
    color: "#5e736e",
    fontSize: 13,
    fontWeight: "800",
  },
  stop: {
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  stopText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "800",
  },
  busy: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  busyText: {
    color: "#5e736e",
    fontSize: 12,
  },
  error: {
    color: "#a3332c",
    backgroundColor: "#fbece8",
    padding: 10,
    borderRadius: 10,
    fontSize: 12,
    fontWeight: "700",
    alignSelf: "center",
  },
  disabled: {
    opacity: 0.55,
  },
});
