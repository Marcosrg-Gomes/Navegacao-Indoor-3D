import { test, expect } from "@playwright/test";

test("Administrador cadastra um piso navegável, edita e remove seus registros", async ({ page, request, browser }, info) => {
  test.setTimeout(90000);
  info.annotations.push({ type: "browser-version", description: `${info.project.name} ${browser.version()} (${process.platform})` });
  const headers = { "X-API-Key": "audit-local-only" };
  const suffix = `${info.project.name}-${Date.now()}`;
  const mallName = `Galeria ${suffix}`;
  const floorName = `Piso ${suffix}`;
  const categoryName = `Categoria ${suffix}`;
  const storeName = `Loja ${suffix}`;
  const created: { path: string; id: number }[] = [];
  const dialog = page.getByRole("dialog");
  const row = (name: string) => page.locator("tbody tr").filter({ has: page.getByText(name, { exact: true }) });
  async function save(path: string, method: string, button: string) {
    const pending = page.waitForResponse((r) => new URL(r.url()).pathname === `/api/admin/${path}` && r.request().method() === method);
    await dialog.getByRole("button", { name: button, exact: true }).click();
    const response = await pending;
    expect(response.ok(), await response.text()).toBeTruthy();
    const data = await response.json();
    if (method === "POST") created.push({ path, id: data.id });
    await expect(dialog).not.toBeVisible();
    return data;
  }
  async function remove(path: string, id: number, target: ReturnType<typeof row>) {
    page.once("dialog", (d) => d.accept());
    const pending = page.waitForResponse((r) => new URL(r.url()).pathname === `/api/admin/${path}/${id}` && r.request().method() === "DELETE");
    await target.getByRole("button", { name: "Excluir", exact: true }).click();
    expect((await pending).status()).toBe(204);
    if (path === "shoppings") await expect(target).toContainText("Inativo");
    else await expect(target).toHaveCount(0);
  }
  try {
    await page.goto("/admin/shoppings");
    await page.getByLabel("API key", { exact: true }).fill("audit-local-only");
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await page.getByRole("button", { name: "Novo shopping", exact: true }).click();
    await dialog.getByLabel("Nome", { exact: true }).fill(mallName);
    const mall = await save("shoppings", "POST", "Salvar");
    await row(mallName).getByRole("button", { name: "Editar", exact: true }).click();
    await dialog.getByLabel("Endereço", { exact: true }).fill("Endereço de demonstração");
    expect((await save(`shoppings/${mall.id}`, "PUT", "Salvar")).endereco).toBe("Endereço de demonstração");

    await page.goto("/admin/pisos");
    await page.getByRole("button", { name: "+ Novo Piso", exact: true }).click();
    await dialog.getByLabel("Shopping Associado", { exact: false }).selectOption(String(mall.id));
    await dialog.getByLabel("Nome do Piso", { exact: false }).fill(floorName);
    const floor = await save("floors", "POST", "Criar Piso");
    await row(floorName).getByRole("button", { name: "Editar", exact: true }).click();
    await dialog.getByLabel("Largura Real (metros)", { exact: false }).fill("100");
    await dialog.getByLabel("Altura Real (metros)", { exact: false }).fill("60");
    await dialog.getByLabel("URL da Imagem da Planta Baixa", { exact: false }).fill("/static/plantas/demo.svg");
    expect((await save(`floors/${floor.id}`, "PUT", "Salvar Alterações")).imagem_planta_url).toBe("/static/plantas/demo.svg");

    await page.goto(`/admin/nos?piso=${floor.id}`);
    const nodes = [];
    for (const [name, x] of [["Origem", "0.1"], ["Destino", "0.8"]]) {
      await page.getByRole("button", { name: "+ Novo Nó Manual", exact: true }).click();
      await dialog.getByLabel("Nome / Identificação do Local").fill(`${name} ${suffix}`);
      await dialog.getByLabel("Coordenada X", { exact: false }).fill(x);
      await dialog.getByLabel("Coordenada Y", { exact: false }).fill("0.5");
      nodes.push(await save("nodes", "POST", "Criar Nó"));
    }
    await row(nodes[1].nome).getByRole("button", { name: "Editar", exact: true }).click();
    await dialog.getByLabel("Tipo de Nó", { exact: false }).selectOption("loja");
    expect((await save(`nodes/${nodes[1].id}`, "PUT", "Salvar Alterações")).tipo).toBe("loja");

    await page.goto(`/admin/arestas?piso=${floor.id}`);
    await page.getByRole("button", { name: "+ Nova Aresta", exact: true }).click();
    await dialog.getByLabel("Nó de Origem", { exact: false }).selectOption(String(nodes[0].id));
    await dialog.getByLabel("Nó de Destino", { exact: false }).selectOption(String(nodes[1].id));
    const edge = await save("edges", "POST", "Criar Aresta");
    await row(`#${edge.id}`).getByRole("button", { name: "Editar", exact: true }).click();
    await dialog.getByLabel("Distância em metros", { exact: false }).fill("70");
    expect(Number((await save(`edges/${edge.id}`, "PUT", "Salvar Alterações")).distancia)).toBe(70);

    await page.goto("/admin/categorias");
    await page.getByRole("button", { name: "Nova categoria", exact: true }).click();
    await dialog.getByLabel("Nome", { exact: true }).fill(categoryName);
    const category = await save("categories", "POST", "Salvar");
    await row(categoryName).getByRole("button", { name: "Editar", exact: true }).click();
    await dialog.getByLabel("Ícone (slug)").fill("shop");
    expect((await save(`categories/${category.id}`, "PUT", "Salvar")).icone).toBe("shop");

    await page.goto("/admin/lojas");
    await page.getByRole("button", { name: "Nova loja", exact: true }).click();
    await dialog.getByLabel("Nome *", { exact: true }).fill(storeName);
    await dialog.getByLabel("Nó associado *", { exact: true }).selectOption(String(nodes[1].id));
    await dialog.getByLabel("Categoria *", { exact: true }).selectOption(String(category.id));
    const store = await save("stores", "POST", "Salvar");
    await row(storeName).getByRole("button", { name: "Editar", exact: true }).click();
    await dialog.getByLabel("Status operacional *", { exact: true }).selectOption("fechado");
    expect((await save(`stores/${store.id}`, "PUT", "Salvar")).status_operacional).toBe("fechado");

    await page.goto("/admin/qr");
    await page.getByRole("button", { name: "+ Gerar QR Code", exact: true }).click();
    await dialog.getByLabel("Nó de Origem Vinculado", { exact: false }).selectOption(String(nodes[0].id));
    await dialog.getByLabel("Token Personalizado", { exact: false }).fill(`QR-${suffix}`);
    const qr = await save("qr-codes", "POST", "Gerar QR Code");
    const qrCard = () => page.locator(".qr-card").filter({ hasText: `QR-${suffix}` });
    await expect(qrCard().locator("canvas")).toBeVisible();
    await qrCard().getByRole("button", { name: "Editar", exact: true }).click();
    await dialog.getByLabel("Token Personalizado", { exact: false }).fill(`QR-${suffix}-EDITADO`);
    const updatedQr = await save(`qr-codes/${qr.id}`, "PUT", "Salvar QR Code");
    expect((await (await request.get(`/api/qr-codes/${updatedQr.token}`)).json()).no.id).toBe(nodes[0].id);
    const route = await request.post("/api/routes", { data: { origem_no_id: nodes[0].id, destino_no_id: nodes[1].id } });
    expect(route.ok()).toBeTruthy();
    expect((await route.json()).distancia_total_metros).toBe(70);
    await page.goto(`/admin/validacao?piso=${floor.id}`);
    await expect(page.getByText("Grafo 100% Íntegro e Conexo", { exact: true })).toBeVisible();

    await page.goto("/admin/qr");
    await remove("qr-codes", qr.id, qrCard());
    await page.goto("/admin/lojas");
    await remove("stores", store.id, row(storeName));
    await page.goto(`/admin/arestas?piso=${floor.id}`);
    await remove("edges", edge.id, row(`#${edge.id}`));
    await page.goto(`/admin/nos?piso=${floor.id}`);
    for (const node of nodes) await remove("nodes", node.id, row(node.nome));
    await page.goto("/admin/pisos");
    await remove("floors", floor.id, row(floorName));
    await page.goto("/admin/categorias");
    await remove("categories", category.id, row(categoryName));
    await page.goto("/admin/shoppings");
    await remove("shoppings", mall.id, row(mallName));
  } finally {
    // Only fixture records created by this test; reverse foreign-key order.
    for (const item of created.reverse()) {
      const cleanup = await request.delete(`/api/admin/${item.path}/${item.id}`, { headers });
      expect([204, 404]).toContain(cleanup.status());
    }
  }
});
