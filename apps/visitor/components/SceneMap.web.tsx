import React, { Component, lazy, Suspense, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "@/components/AppText";
import { ApiError, getScene, reportDiagnostic } from "../services/api";
import type { Scene } from "../types/scene";
import type { SceneMapProps } from "./SceneMap.types";
import { colors } from "../constants/colors";
import { WayfindingIcon } from "./WayfindingIcon";

const SceneCanvas = lazy(() => import("./SceneCanvas.web"));
type Mode = "auto" | "3d" | "2d";

class SceneBoundary extends Component<{ children: React.ReactNode; onError: (message: string) => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError("Não foi possível abrir o mapa 3D."); }
  render() { return this.state.failed ? null : this.props.children; }
}

export function SceneMap(props: SceneMapProps) {
  const [mode, setMode] = useState<Mode>(props.initialMode ?? "auto");
  const [hasUsed3d, setHasUsed3d] = useState(props.initialMode !== "2d");
  const [attempt, setAttempt] = useState(0);
  const [scene, setScene] = useState<Scene | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  useEffect(() => { if (props.previewStep) { setHasUsed3d(true); setMode("3d"); } }, [props.previewStep]);
  useEffect(() => { if (failure) reportDiagnostic("mapa_3d", failure.includes("20 segundos") ? "timeout" : "indisponivel"); }, [failure]);
  useEffect(() => {
    if (!props.shoppingId) return;
    let active = true;
    setScene(null); setFailure(null); setReady(false); setProgress(0);
    const probe = document.createElement("canvas");
    const context = probe.getContext("webgl2");
    if (!context) { setFailure("WebGL indisponível neste dispositivo."); return; }
    context.getExtension("WEBGL_lose_context")?.loseContext();
    getScene(props.shoppingId).then((value) => { if (active) setScene(value); })
      .catch((error) => { if (active) setFailure(error.message); });
    return () => { active = false; };
  }, [props.shoppingId, attempt]);
  useEffect(() => {
    if (!props.shoppingId || !props.navigationRevision || !scene) return;
    let active = true;
    void getScene(props.shoppingId).then((value) => {
      if (active) {
        setScene(value);
        setFailure((current) => current === "O modelo 3D não corresponde ao cadastro atual do mapa." ? null : current);
      }
    }).catch((error) => {
      if (active) setFailure(error instanceof ApiError && error.status === 409
        ? "O modelo 3D não corresponde ao cadastro atual do mapa."
        : "Não foi possível verificar a versão atual do mapa 3D.");
    });
    return () => { active = false; };
  }, [props.shoppingId, props.navigationRevision]);
  useEffect(() => {
    if (mode === "2d" || ready || failure) return;
    const timer = setTimeout(() => setFailure("O carregamento 3D excedeu 20 segundos."), 20_000);
    return () => clearTimeout(timer);
  }, [mode, ready, failure, attempt, props.shoppingId]);

  const show3d = mode !== "2d" && !failure;
  return <View style={{ gap: 8 }}>
    {/* Controle segmentado: um único trilho com o modo atual preenchido. */}
    <View style={[segment.track, props.compact ? { position: "absolute", top: props.controlsTop ?? 8, left: 10, zIndex: 3 } : { alignSelf: "flex-start" }]} accessibilityLabel="Modo do mapa">
      {([["auto", "Automático"], ["3d", "Mapa 3D"], ["2d", "Mapa 2D"]] as const).map(([value, label]) => {
        const selected = mode === value;
        return <TouchableOpacity key={value} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected }}
          style={[segment.item, selected && segment.itemSelected]}
          onPress={() => { setMode(value); if (value !== "2d") setHasUsed3d(true); if (value !== "2d" && failure) setAttempt((n) => n + 1); }}>
          <Text style={[segment.text, selected && segment.textSelected]}>{props.compact ? (value === "auto" ? "Auto" : value.toUpperCase()) : label}</Text>
        </TouchableOpacity>;
      })}
    </View>
    {failure && mode !== "2d" && <View accessibilityRole="alert" testID="scene-fallback" style={segment.notice}>
      <WayfindingIcon name="alert" color={colors.warning} size={20} strokeWidth={2} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={segment.noticeText}>{failure} O mapa 2D e as instruções continuam disponíveis.</Text>
        <TouchableOpacity accessibilityRole="button" style={{ minHeight: 44, justifyContent: "center", alignSelf: "flex-start" }} onPress={() => setAttempt((n) => n + 1)}><Text style={segment.noticeLink}>Tentar 3D novamente</Text></TouchableOpacity>
      </View>
    </View>}
    {show3d && !ready && <View accessibilityLiveRegion="polite" style={segment.loading}>
      <ActivityIndicator color={colors.primary} />
      <Text style={segment.loadingText}>Carregando mapa 3D… {progress}%</Text>
      <View style={segment.progressTrack}><View style={[segment.progressFill, { width: `${progress}%` }]} /></View>
    </View>}
    {hasUsed3d && scene && !failure && <View style={{ display: show3d ? "flex" : "none" }}><SceneBoundary key={`${props.shoppingId}-${attempt}`} onError={setFailure}>
      <Suspense fallback={null}><SceneCanvas {...props} scene={scene} onReady={() => setReady(true)} onProgress={setProgress} onError={setFailure} /></Suspense>
    </SceneBoundary></View>}
    <View style={{ display: !show3d || !ready ? "flex" : "none" }}>{props.fallback}</View>
  </View>;
}

const segment = StyleSheet.create({
  track: { flexDirection: "row", gap: 2, padding: 3, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight, shadowColor: "#0b1f1b", shadowOpacity: .14, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 4 },
  item: { minHeight: 44, minWidth: 48, paddingHorizontal: 12, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  itemSelected: { backgroundColor: colors.primary },
  text: { color: colors.textMuted, fontSize: 13, fontWeight: "600" },
  textSelected: { color: colors.textOnPrimary, fontWeight: "700" },
  notice: { flexDirection: "row", gap: 10, padding: 12, borderRadius: 12, backgroundColor: colors.warningSoft, borderWidth: 1, borderColor: "#f1dca4" },
  noticeText: { color: colors.text, fontSize: 14, lineHeight: 20 },
  noticeLink: { color: colors.primary, fontSize: 14, fontWeight: "700", textDecorationLine: "underline" },
  loading: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 10 },
  loadingText: { color: colors.textMuted, fontSize: 13, fontWeight: "500" },
  progressTrack: { flexBasis: "100%", height: 3, borderRadius: 2, backgroundColor: colors.borderLight, overflow: "hidden" },
  progressFill: { height: 3, backgroundColor: colors.primary },
});
