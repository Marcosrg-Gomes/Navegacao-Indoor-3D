import React, { Component, lazy, Suspense, useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { ApiError, getScene, reportDiagnostic } from "../services/api";
import type { Scene } from "../types/scene";
import type { SceneMapProps } from "./SceneMap.types";
import { colors } from "../constants/colors";

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
      if (active) { setScene(value); setFailure(null); }
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
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }} accessibilityLabel="Modo do mapa">
      {([["auto", "Automático"], ["3d", "Mapa 3D"], ["2d", "Mapa 2D"]] as const).map(([value, label]) =>
        <TouchableOpacity key={value} accessibilityRole="button" accessibilityState={{ selected: mode === value }}
          style={{ padding: 12, minHeight: 44, justifyContent: "center", borderRadius: 6, borderWidth: 1,
            borderColor: mode === value ? colors.primary : colors.border, backgroundColor: mode === value ? colors.primarySoft : colors.surface }}
          onPress={() => { setMode(value); if (value !== "2d") setHasUsed3d(true); if (value !== "2d" && failure) setAttempt((n) => n + 1); }}><Text style={{ color: colors.text, fontWeight: mode === value ? "600" : "400" }}>{label}</Text></TouchableOpacity>)}
    </View>
    {failure && mode !== "2d" && <View accessibilityRole="alert" testID="scene-fallback" style={{ padding: 12, backgroundColor: "#fef3c7" }}>
      <Text>{failure} O mapa 2D e as instruções continuam disponíveis.</Text>
      <TouchableOpacity accessibilityRole="button" style={{ minHeight: 44, justifyContent: "center" }} onPress={() => setAttempt((n) => n + 1)}><Text style={{ color: colors.primary }}>Tentar 3D novamente</Text></TouchableOpacity>
    </View>}
    {show3d && !ready && <View accessibilityLiveRegion="polite" style={{ flexDirection: "row", gap: 8 }}><ActivityIndicator /><Text>Carregando mapa 3D… {progress}%</Text></View>}
    {hasUsed3d && scene && !failure && <View style={{ display: show3d ? "flex" : "none" }}><SceneBoundary key={`${props.shoppingId}-${attempt}`} onError={setFailure}>
      <Suspense fallback={null}><SceneCanvas {...props} scene={scene} onReady={() => setReady(true)} onProgress={setProgress} onError={setFailure} /></Suspense>
    </SceneBoundary></View>}
    <View style={{ display: !show3d || !ready ? "flex" : "none" }}>{props.fallback}</View>
  </View>;
}
