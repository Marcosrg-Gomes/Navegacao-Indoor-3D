import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { colors } from "@/constants/colors";
import { useNavigation } from "@/context/NavigationContext";
import type { EtapaRota } from "@/types";
import { WayfindingIcon, type WayfindingIconName } from "./WayfindingIcon";

/** Ícone de manobra derivado do tipo e do texto da etapa (a API é a fonte das instruções). */
function maneuverIcon(step?: Pick<EtapaRota, "tipo" | "texto">): { icon: WayfindingIconName; label: string } {
  if (!step) return { icon: "straight", label: "Seguir em frente" };
  if (step.tipo === "chegada") return { icon: "arrive", label: "Chegada" };
  if (step.tipo === "troca_piso") return { icon: /elevador/i.test(step.texto) ? "lift" : "floors", label: "Trocar de piso" };
  if (/esquerda/i.test(step.texto)) return { icon: "turnLeft", label: "Virar à esquerda" };
  if (/direita/i.test(step.texto)) return { icon: "turnRight", label: "Virar à direita" };
  return { icon: "straight", label: "Seguir em frente" };
}

/** Ritmo médio de caminhada em shopping (~1,2 m/s), apenas para a estimativa exibida. */
export function walkingMinutes(meters: number) {
  return Math.max(1, Math.round(meters / 1.2 / 60));
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
  const maneuver = maneuverIcon(arrived ? { tipo: "chegada", texto: "" } : current);
  return <View testID="maneuver-banner" style={[styles.maneuver, failed && styles.maneuverFailed, arrived && styles.maneuverArrived]} accessibilityLiveRegion="polite">
    <View style={[styles.maneuverTile, failed && styles.maneuverTileFailed]} accessible accessibilityRole="image" accessibilityLabel={failed ? "Atenção" : maneuver.label}>
      {loading ? <ActivityIndicator color={colors.primary} />
        : <WayfindingIcon name={failed ? "alert" : maneuver.icon} color={failed ? colors.danger : colors.primary} size={34} strokeWidth={2.4} />}
    </View>
    <View style={{ flex: 1, minWidth: 0 }}>
      <Text style={[styles.maneuverEyebrow, failed && styles.maneuverEyebrowError]}>{arrived ? "VOCÊ CHEGOU" : moving ? "NAVEGAÇÃO SIMULADA" : failed ? "ROTA NÃO DISPONÍVEL" : loading ? "CALCULANDO CAMINHO" : "CAMINHO PREPARADO"}</Text>
      <Text testID="current-instruction" style={[styles.maneuverInstruction, failed && styles.maneuverInstructionError]}>{arrived ? nav.destinationName : failed ? nav.routeError : current?.texto || (nav.routeLoading ? "Calculando caminho…" : "Rota pronta para começar")}</Text>
      {!!next && !arrived && !failed && <Text style={styles.maneuverNext} numberOfLines={1}>Depois: {next.texto}</Text>}
    </View>
  </View>;
}

export function WazeNavigationPanel({ onChooseDestination, onCorrectPosition, onHelp }: {
  onChooseDestination: () => void;
  onCorrectPosition: () => void;
  onHelp: () => void;
}) {
  const nav = useNavigation();
  const { width } = useWindowDimensions();
  // Em telas estreitas o chip mostra só o ícone; o rótulo acessível continua completo.
  const narrow = width < 360;
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
  const total = nav.route?.distancia_total_metros ?? 0;
  const progress = moving && total > 0 && remaining !== undefined ? Math.min(1, Math.max(0, 1 - remaining / total)) : 0;
  const minutes = remaining !== undefined ? walkingMinutes(remaining) : 0;

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
    {moving && !arrived && <View style={styles.progressTrack} accessible accessibilityRole="progressbar" accessibilityLabel="Progresso do percurso"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}>
      <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
    </View>}
    <View style={styles.tripLine}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.tripDestination} numberOfLines={1} accessibilityRole="header">{nav.destinationName || "Destino"}</Text>
        <Text style={styles.tripMeta} numberOfLines={1}>
          De <Text testID="origin-label">{nav.originNode?.nome || "origem"}</Text> ·
          {arrived ? "destino alcançado" : nav.simulationStatus === "running" ? "simulação" : "rota pronta"}
          {nav.acessivel ? " · sem escadas" : ""}
        </Text>
      </View>
      {remaining !== undefined && !arrived && <View style={styles.distanceBlock} accessible
        accessibilityLabel={`${Math.max(0, Math.round(remaining))} metros restantes, cerca de ${minutes} minuto${minutes > 1 ? "s" : ""}`}>
        <Text testID="remaining-distance" style={styles.distance}>{Math.max(0, Math.round(remaining))}</Text>
        <Text style={styles.unit}>m restantes · ~{minutes} min</Text>
      </View>}
    </View>

    {(nav.routeError || nav.simulationError) && <Text accessibilityRole="alert" style={styles.error}>{nav.simulationError || nav.routeError}</Text>}
    {busy && <View style={styles.busy} accessibilityLiveRegion="polite">
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.busyText}>Atualizando caminho…</Text>
    </View>}

    <View style={styles.actions}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={primaryLabel} disabled={busy}
        accessibilityState={{ disabled: busy }} onPress={primaryAction} style={[styles.primary, busy && styles.disabled]}>
        <Text style={styles.primaryText}>{primaryLabel}</Text>
      </TouchableOpacity>
      {!arrived && <TouchableOpacity testID="accessible-toggle" accessibilityRole="switch" accessibilityLabel="Rota sem escadas"
        accessibilityHint="Recalcula usando apenas elevadores e rampas" accessibilityState={{ checked: nav.acessivel, disabled: busy }}
        disabled={busy} onPress={() => nav.setAcessivel(!nav.acessivel)} style={[styles.accessibleChip, nav.acessivel && styles.accessibleChipOn, busy && styles.disabled]}>
        <WayfindingIcon name="accessible" color={nav.acessivel ? colors.textOnPrimary : colors.accessible} size={22} strokeWidth={2} />
        {narrow ? nav.acessivel && <Text style={[styles.accessibleText, styles.accessibleTextOn]}>✓</Text>
          : <Text style={[styles.accessibleText, nav.acessivel && styles.accessibleTextOn]}>{nav.acessivel ? "Sem escadas ✓" : "Sem escadas"}</Text>}
      </TouchableOpacity>}
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Mais opções" accessibilityState={{ expanded: more }}
        onPress={() => setMore(!more)} style={[styles.roundButton, more && styles.roundButtonOn]}><Text style={styles.roundText}>•••</Text></TouchableOpacity>
    </View>

    {more && <View style={styles.moreActions}>
      {moving && !arrived && <TouchableOpacity accessibilityRole="button" disabled={busy} onPress={() => void nav.simulateDeviation()} style={styles.secondary}><Text style={styles.secondaryText}>Estou fora da rota</Text></TouchableOpacity>}
      {!arrived && <TouchableOpacity accessibilityRole="button" disabled={busy} onPress={() => void nav.recalculate()} style={styles.secondary}><Text style={styles.secondaryText}>Recalcular rota</Text></TouchableOpacity>}
      <TouchableOpacity accessibilityRole="button" onPress={onCorrectPosition} style={styles.secondary}><Text style={styles.secondaryText}>Corrigir posição</Text></TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" onPress={onHelp} style={styles.secondary}><Text style={styles.secondaryText}>Ajuda</Text></TouchableOpacity>
      {(nav.simulationStatus === "idle" || arrived) && nav.route && !nav.routeStale && <TouchableOpacity accessibilityRole="button" disabled={busy} onPress={() => void nav.completeNavigation()} style={styles.secondary}><Text style={styles.secondaryText}>Cheguei ao destino</Text></TouchableOpacity>}
      {moving && <TouchableOpacity accessibilityRole="button" onPress={() => void nav.stopSimulation()} style={styles.stop}><Text style={styles.stopText}>Encerrar</Text></TouchableOpacity>}
      <TouchableOpacity accessibilityRole="button" onPress={nav.clearRoute} style={styles.stop}><Text style={styles.stopText}>Cancelar rota</Text></TouchableOpacity>
    </View>}
  </View>;
}

const styles = StyleSheet.create({
  maneuver: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 84,
    borderRadius: 18,
    shadowColor: "#0b1f1b",
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  maneuverFailed: { backgroundColor: colors.dangerSoft, borderWidth: 1, borderColor: "#efc2bc" },
  maneuverArrived: { backgroundColor: colors.success },
  maneuverTile: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  maneuverTileFailed: { backgroundColor: colors.surface },
  maneuverEyebrow: {
    color: "#f3cf97",
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  maneuverEyebrowError: { color: colors.danger },
  maneuverInstruction: {
    color: colors.textOnPrimary,
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "700",
    marginTop: 2,
  },
  maneuverInstructionError: { color: "#7d2620" },
  maneuverNext: {
    color: "#c5d8d2",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },
  panel: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    gap: 12,
    borderRadius: 20,
    shadowColor: "#0b1f1b",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -2 },
    elevation: 6,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: "hidden",
  },
  panelBusy: { opacity: 0.92 },
  progressTrack: { position: "absolute", top: 0, left: 0, right: 0, height: 4, backgroundColor: colors.routeSoft },
  progressFill: { height: 4, backgroundColor: colors.route },
  tripLine: { flexDirection: "row", alignItems: "center", gap: 12 },
  tripDestination: { color: colors.text, fontSize: 18, lineHeight: 24, fontWeight: "700" },
  tripMeta: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  distanceBlock: { minWidth: 64, alignItems: "flex-end" },
  distance: { color: colors.primary, fontSize: 26, lineHeight: 30, fontWeight: "700", fontVariant: ["tabular-nums"] },
  unit: { color: colors.textMuted, fontSize: 12, fontWeight: "500" },
  actions: { flexDirection: "row", gap: 8, alignItems: "center" },
  primary: {
    flex: 1,
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  primaryText: { color: colors.textOnPrimary, fontSize: 16, fontWeight: "700" },
  accessibleChip: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.accessible,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  accessibleChipOn: { backgroundColor: colors.accessible },
  accessibleText: { color: colors.accessible, fontSize: 13, fontWeight: "700" },
  accessibleTextOn: { color: colors.textOnPrimary },
  roundButton: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  roundButtonOn: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  roundText: { color: colors.text, fontSize: 18, lineHeight: 20, fontWeight: "700" },
  moreActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 12,
  },
  secondary: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: { color: colors.text, fontSize: 14, fontWeight: "600" },
  stop: { minHeight: 48, borderRadius: 12, paddingHorizontal: 14, alignItems: "center", justifyContent: "center" },
  stopText: { color: colors.danger, fontSize: 14, fontWeight: "700" },
  busy: { flexDirection: "row", alignItems: "center", gap: 8 },
  busyText: { color: colors.textMuted, fontSize: 13 },
  error: {
    color: colors.danger,
    backgroundColor: colors.dangerSoft,
    padding: 10,
    borderRadius: 10,
    fontSize: 13,
    fontWeight: "600",
  },
  disabled: { opacity: 0.55 },
});
