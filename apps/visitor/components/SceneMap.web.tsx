import React, { Component, lazy, Suspense, useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { getScene } from "../services/api";
import type { Scene } from "../types/scene";
import type { SceneMapProps } from "./SceneMap.types";

const SceneCanvas = lazy(() => import("./SceneCanvas.web"));
type Mode = "auto" | "3d" | "2d";

class SceneBoundary extends Component<{ children: React.ReactNode; onError: (message: string) => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError("Não foi possível abrir o mapa 3D."); }
  render() { return this.state.failed ? null : this.props.children; }
}

export function SceneMap(props: SceneMapProps) {
  const [mode, setMode] = useState<Mode>("auto");
  const [attempt, setAttempt] = useState(0);
  const [scene, setScene] = useState<Scene | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (mode === "2d" || !props.shoppingId) return;
    let active = true;
    setScene(null); setFailure(null); setReady(false); setProgress(0);
    const probe = document.createElement("canvas");
    const context = probe.getContext("webgl2");
    if (!context) { setFailure("WebGL indisponível neste dispositivo."); return; }
    context.getExtension("WEBGL_lose_context")?.loseContext();
    getScene(props.shoppingId).then((value) => { if (active) setScene(value); })
      .catch((error) => { if (active) setFailure(error.message); });
    return () => { active = false; };
  }, [props.shoppingId, mode, attempt]);
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
          style={{ padding: 10, borderRadius: 8, backgroundColor: mode === value ? "#dbeafe" : "#f1f5f9" }}
          onPress={() => { setMode(value); if (value !== "2d") setAttempt((n) => n + 1); }}><Text>{label}</Text></TouchableOpacity>)}
    </View>
    {failure && mode !== "2d" && <View accessibilityRole="alert" testID="scene-fallback" style={{ padding: 12, backgroundColor: "#fef3c7" }}>
      <Text>{failure} O mapa 2D e as instruções continuam disponíveis.</Text>
      <TouchableOpacity accessibilityRole="button" onPress={() => setAttempt((n) => n + 1)}><Text style={{ paddingTop: 8, color: "#1d4ed8" }}>Tentar 3D novamente</Text></TouchableOpacity>
    </View>}
    {show3d && !ready && <View accessibilityLiveRegion="polite" style={{ flexDirection: "row", gap: 8 }}><ActivityIndicator /><Text>Carregando mapa 3D… {progress}%</Text></View>}
    {show3d && scene && <SceneBoundary key={`${props.shoppingId}-${attempt}`} onError={setFailure}>
      <Suspense fallback={null}><SceneCanvas {...props} scene={scene} onReady={() => setReady(true)} onProgress={setProgress} onError={setFailure} /></Suspense>
    </SceneBoundary>}
    <View style={{ display: !show3d || !ready ? "flex" : "none" }}>{props.fallback}</View>
  </View>;
}
