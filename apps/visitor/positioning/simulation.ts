import { sampleSimulation, type SimulationProgress, type SimulationTrack } from "./routeProgress";

export const SIMULATION_SPEEDS = [1, 2, 4] as const;
export type SimulationSpeed = (typeof SIMULATION_SPEEDS)[number];
export const WALKING_METERS_PER_SECOND = 1;

export type SimulationMotion = {
  track: SimulationTrack;
  progress: SimulationProgress;
  speed: SimulationSpeed;
};

export function createSimulationMotion(track: SimulationTrack, at: number): SimulationMotion {
  return { track, progress: sampleSimulation(track, 0, at), speed: 1 };
}

export function advanceSimulation(motion: SimulationMotion, elapsedMs: number, observedAt: number): SimulationMotion {
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0 || !Number.isFinite(observedAt) || observedAt < motion.progress.position.observedAt || motion.progress.arrived) return motion;
  const distance = motion.progress.traveledMeters + elapsedMs / 1000 * WALKING_METERS_PER_SECOND * motion.speed;
  // Um intervalo muito grande só pode levar até o fim do trajeto.
  return { ...motion, progress: sampleSimulation(motion.track, Math.min(distance, motion.track.totalMeters), observedAt) };
}
