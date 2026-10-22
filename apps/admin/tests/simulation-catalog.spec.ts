import { expect, test } from "@playwright/test";
import type { GraphResponse, Piso, RotaResponse, Shopping } from "../../visitor/types";
import { loadVisitorModule } from "./visitorModules";

const { buildSimulationTrack, sampleSimulation } =
  loadVisitorModule<typeof import("../../visitor/positioning/routeProgress")>("../../visitor/positioning/routeProgress");

test("Motor percorre todos os destinos publicados, nos dois sentidos e modos, com arestas autorizadas", async ({ request }) => {
  test.setTimeout(120000);
  const shoppings: Shopping[] = await (await request.get("/api/shoppings")).json();
  const shopping = shoppings.find((item) => item.codigo === "MINI_SHOPPING")!;
  expect(shopping).toBeTruthy();
  const floors: Piso[] = await (await request.get(`/api/shoppings/${shopping.id}/floors`)).json();
  const graphs: GraphResponse[] = await Promise.all(floors.map(async (floor) => (await request.get(`/api/floors/${floor.id}/graph`)).json()));
  const nodes = graphs.flatMap((graph) => graph.nos);
  const origin = nodes.find((node) => node.tipo === "entrada")!;
  const destinations = nodes.filter((node) => ["loja", "banheiro", "saida", "entrada"].includes(node.tipo) && node.id !== origin.id);
  expect(destinations.length).toBeGreaterThanOrEqual(26);
  const visitedFloors = new Set<number>(), connectors = new Set<string>();
  for (const accessible of [false, true]) for (const destination of destinations) for (const backwards of [false, true]) {
    const from = backwards ? destination : origin, to = backwards ? origin : destination;
    const response = await request.post("/api/routes", { data: { origem_no_id: from.id, destino_no_id: to.id, acessivel: accessible, confirmar_indisponivel: true } });
    expect(response.ok(), `${from.codigo} → ${to.codigo}, sem escadas=${accessible}`).toBeTruthy();
    const route: RotaResponse = await response.json();
    const track = buildSimulationTrack(route, shopping.codigo);
    let remaining = track.totalMeters;
    for (const segment of track.segments) {
      const graph = graphs.find((item) => item.piso_id === segment.from.piso_id)!;
      if (segment.vertical) {
        expect(graph.conexoes_entre_pisos?.[segment.from.id]).toContain(segment.to.id);
        connectors.add(segment.from.tipo);
        if (accessible) expect(segment.from.tipo).toBe("elevador");
      } else {
        expect(graph.arestas.some((edge) => edge.ativa && (!accessible || edge.acessivel) &&
          ((edge.no_origem_id === segment.from.id && edge.no_destino_id === segment.to.id) ||
            (edge.bidirecional && edge.no_destino_id === segment.from.id && edge.no_origem_id === segment.to.id)))).toBe(true);
      }
      for (const meters of [segment.startMeters, segment.startMeters + segment.distanceMeters / 2, segment.endMeters]) {
        const sample = sampleSimulation(track, meters, 1000);
        expect(sample.remainingMeters).toBeLessThanOrEqual(remaining + 1e-9);
        remaining = sample.remainingMeters;
        visitedFloors.add(sample.position.floorId);
        expect(sample.position.x).toBeGreaterThanOrEqual(0); expect(sample.position.x).toBeLessThanOrEqual(1);
        expect(sample.position.y).toBeGreaterThanOrEqual(0); expect(sample.position.y).toBeLessThanOrEqual(1);
      }
    }
    const arrival = sampleSimulation(track, track.totalMeters, 1000);
    expect(arrival.position).toMatchObject({ fromNodeId: to.id, floorId: to.piso_id, x: to.coord_x, y: to.coord_y });
    expect(arrival.arrived).toBe(true);
    expect(arrival.remainingMeters).toBe(0);
  }
  expect([...visitedFloors].sort()).toEqual(floors.map((floor) => floor.id).sort());
  expect(connectors.has("elevador")).toBe(true);
});
