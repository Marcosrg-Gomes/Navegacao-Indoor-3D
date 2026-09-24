export type SceneFloor = {
  piso_id: number;
  codigo: string;
  origin: [number, number, number];
  axis_x: [number, number, number];
  axis_y: [number, number, number];
};
export type Scene = {
  shopping_id: number;
  scene_version: string;
  release: number;
  model_url: string;
  floors: SceneFloor[];
  pois: { loja_id: number; codigo: string; object_prefix: string; anchor_node_id: number }[];
  anchors: { node_id: number; codigo: string; piso_id: number; coord_x: number; coord_y: number; type: string; name: string }[];
};
