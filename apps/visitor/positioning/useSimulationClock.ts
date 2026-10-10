import { useCallback, useEffect, useRef, type Dispatch } from "react";
import { AccessibilityInfo, AppState, Platform } from "react-native";
import { SimulationClock } from "./providers/Simulation";
import type { PositionEvent } from "./session";
import type { PositionSession } from "./types";
import type { SimulationSpeed } from "./simulation";

export function useSimulationClock(session: PositionSession, dispatch: Dispatch<PositionEvent>, active: boolean) {
  const clock = useRef<SimulationClock | null>(null);
  if (!clock.current) clock.current = new SimulationClock();

  useEffect(() => {
    const setReduced = (enabled: boolean) => clock.current?.setMinTickMs(enabled ? 1000 : 33);
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
      const update = () => setReduced(preference.matches);
      update();
      preference.addEventListener("change", update);
      return () => preference.removeEventListener("change", update);
    }
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => { if (mounted) setReduced(enabled); }).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced);
    return () => { mounted = false; subscription.remove(); };
  }, []);

  const pause = useCallback(() => {
    clock.current!.flush();
    clock.current!.stop();
    dispatch({ type: "pause" });
  }, [dispatch]);

  const stop = useCallback(() => {
    clock.current!.stop();
    dispatch({ type: "stop" });
  }, [dispatch]);

  const setSpeed = useCallback((speed: SimulationSpeed) => {
    clock.current!.flush();
    dispatch({ type: "speed", speed });
  }, [dispatch]);

  useEffect(() => {
    if (session.status !== "running") return;
    if (!active || AppState.currentState !== "active") {
      dispatch({ type: "pause" });
      return;
    }
    clock.current!.start(session.generation, dispatch);
    return () => clock.current!.stop();
  }, [session.status, session.generation, active, dispatch]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") pause();
    });
    return () => { subscription.remove(); clock.current!.stop(); };
  }, [pause]);

  return { pause, stop, setSpeed };
}
