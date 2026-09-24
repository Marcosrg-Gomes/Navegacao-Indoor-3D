import type { SceneMapProps } from "./SceneMap.types";

// This platform entry must never import the web canvas or Three.js.
export function SceneMap({ fallback }: SceneMapProps) { return <>{fallback}</>; }
