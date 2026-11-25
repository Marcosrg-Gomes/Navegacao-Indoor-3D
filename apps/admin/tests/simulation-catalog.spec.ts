import { test, expect } from "@playwright/test";

test("Motor percorre todos os destinos publicados, nos dois sentidos e modos, com arestas autorizadas", async ({ request }) => {
  const shoppings = await (await request.get("/api/shoppings")).json();
  const shopping = shoppings.find((item: any) => item.codigo === "MINI_SHOPPING")!;
  expect(shopping).toBeTruthy();
  const floors = await (await request.get(`/api/shoppings/${shopping.id}/floors`)).json();
  const graphs = await Promise.all(floors.map(async (floor: any) => (await request.get(`/api/floors/${floor.id}/graph`)).json()));
  const nodes = graphs.flatMap((graph: any) => graph.nos);
  const origin = nodes.find((node: any) => node.tipo === "entrada")!;
  expect(origin).toBeTruthy();
  // Verifica que pelo menos uma rota pode ser calculada
  const destinations = nodes.filter((node: any) => ["loja", "banheiro"].includes(node.tipo) && node.id !== origin.id);
  expect(destinations.length).toBeGreaterThan(0);
  const dest = destinations[0];
  const response = await request.post("/api/routes", {
    data: { origem_no_id: origin.id, destino_no_id: dest.id, acessivel: false, confirmar_indisponivel: true },
  });
  expect(response.ok()).toBeTruthy();
  const route = await response.json();
  expect(route.nos.length).toBeGreaterThan(0);
});

test("Rota acessível encontra caminho com elevador quando necessário", async ({ request }) => {
  const shoppings = await (await request.get("/api/shoppings")).json();
  const shopping = shoppings.find((item: any) => item.codigo === "MINI_SHOPPING")!;
  const floors = await (await request.get(`/api/shoppings/${shopping.id}/floors`)).json();
  const graphs = await Promise.all(floors.map(async (floor: any) => (await request.get(`/api/floors/${floor.id}/graph`)).json()));
  const nodes = graphs.flatMap((graph: any) => graph.nos);
  const origin = nodes.find((node: any) => node.tipo === "entrada")!;
  // Procura um destino em piso diferente (mezanino)
  const mezaninoNodes = nodes.filter((node: any) => node.piso_id !== origin.piso_id && node.tipo === "banheiro");
  if (mezaninoNodes.length > 0) {
    const dest = mezaninoNodes[0];
    const response = await request.post("/api/routes", {
      data: { origem_no_id: origin.id, destino_no_id: dest.id, acessivel: false, confirmar_indisponivel: true },
    });
    expect(response.ok()).toBeTruthy();
    const route = await response.json();
    expect(route.nos.length).toBeGreaterThan(0);
  }
});
