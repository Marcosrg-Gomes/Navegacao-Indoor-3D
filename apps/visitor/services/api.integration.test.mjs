// Teste integrado da lógica de `request()` de services/api.ts.
// Executa em Node puro (sem Jest/Vitest), mockando globalThis.fetch.
// Re-implementa a função `request` com as mesmas dependências injetáveis
// para testar o comportamento de retry, timeout, backoff e limpeza de temporizadores.

class ApiErrorImpl extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

function isTransientNetworkErrorImpl(error, signalAborted) {
  if (signalAborted) return true;
  if (error instanceof TypeError) {
    const message = (error.message ?? "").toLowerCase();
    return (
      message.includes("failed to fetch") ||
      message.includes("network") ||
      message.includes("net::") ||
      message.includes("connection")
    );
  }
  return false;
}

async function request({ path, init, fetchImpl }) {
  const headers = new Headers(init?.headers);
  const isGet = !init?.method || init.method === "GET";
  const maxRetries = isGet ? 2 : 0;
  const retryDelays = [1000, 2000];
  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, retryDelays[attempt - 1]));
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    try {
      const res = await fetchImpl(`http://localhost:8000/api${path}`, {
        ...init,
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const text = await res.text();
      const data = text ? JSON.parse(text) : null;
      if (!res.ok) {
        throw new ApiErrorImpl(`Erro na API (${res.status})`, res.status, res.headers.get("X-Error-Code") || undefined);
      }
      return data;
    } catch (error) {
      clearTimeout(timeout);
      lastError = error;
      const signalAborted = controller.signal.aborted;
      const isTransient = isTransientNetworkErrorImpl(error, signalAborted);
      console.log(`  DEBUG attempt=${attempt}: error instanceof TypeError=${error instanceof TypeError}, message="${error.message}", isTransient=${isTransient}, signalAborted=${signalAborted}`);

      if (attempt < maxRetries && isGet && isTransient) {
        continue;
      }

      if (!(error instanceof ApiErrorImpl) && isTransient) {
        // onDiagnostic seria chamado aqui
      }
      if (error instanceof ApiErrorImpl) throw error;
      if (signalAborted) {
        throw new ApiErrorImpl("A conexão demorou demais. Verifique a rede e tente novamente.");
      }
      throw new ApiErrorImpl("Não foi possível conectar ao servidor. Verifique a rede e tente novamente.");
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError;
}

// ============================================================================
// Utilitários de teste
// ============================================================================

let passed = 0;
let failed = 0;

function test(name, fn) {
  return fn()
    .then(() => {
      console.log(`PASS: ${name}`);
      passed++;
    })
    .catch((e) => {
      console.log(`FAIL: ${name} - ${e.message}`);
      failed++;
    });
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg);
}

function createFetchMock(responses) {
  let callIndex = 0;
  let callCount = 0;
  console.log(`  createFetchMock: responses array length=${responses.length}, type[0]=${typeof responses[0]}, isError[0]=${responses[0] instanceof Error}`);
  return {
    fetch: async (url, init) => {
      callIndex++;
      callCount++;
      const idx = callIndex - 1;
      const response = responses[idx];
      console.log(`    fetch mock #${callCount}: idx=${idx}, response type=${typeof response}, isError=${response instanceof Error}, isResponse=${response instanceof Response}`);
      if (response instanceof Error) {
        console.log(`    fetch mock #${callCount}: lançando erro: ${response.message}`);
        throw response;
      }
      console.log(`    fetch mock #${callCount}: retornando Response status=${response.status}`);
      return response;
    },
    getCallCount: () => callCount,
  };
}

async function runTests() {
  // T1: GET: falha de rede seguida de sucesso (2 tentativas)
  await test("GET: falha de rede seguida de sucesso faz 2 chamadas ao fetch", async () => {
    const fm = createFetchMock([
      new TypeError("Failed to fetch"),
      new Response(JSON.stringify({ sucesso: true }), { status: 200 }),
    ]);

    const result = await request({
      path: "/shoppings/1/navigation-state",
      init: {},
      fetchImpl: fm.fetch,
    });

    assert(fm.getCallCount() === 2, `Esperava 2 chamadas, obteve ${fm.getCallCount()}`);
    assert(result.sucesso === true, "Esperava sucesso na segunda tentativa");
  });

  // T2: GET: erro HTTP 404 sem retentativas
  await test("GET: erro HTTP 404 não faz retentativa", async () => {
    const fm = createFetchMock([
      new Response(JSON.stringify({ detail: "Not found" }), {
        status: 404,
        headers: { "X-Error-Code": "NOT_FOUND", "Content-Type": "application/json" },
      }),
    ]);

    let threwApiError = false;
    let errorStatus = undefined;
    try {
      await request({
        path: "/shoppings/999/navigation-state",
        init: {},
        fetchImpl: fm.fetch,
      });
    } catch (e) {
      threwApiError = e instanceof ApiErrorImpl;
      errorStatus = e.status;
    }

    assert(threwApiError, "Esperava ApiError");
    assert(errorStatus === 404, `Esperava status 404, obteve ${errorStatus}`);
    assert(fm.getCallCount() === 1, `Esperava 1 chamada, obteve ${fm.getCallCount()}`);
  });

  // T3: GET: erro HTTP 500 sem retentativas
  await test("GET: erro HTTP 500 não faz retentativa", async () => {
    const fm = createFetchMock([
      new Response(JSON.stringify({ detail: "Internal error" }), {
        status: 500,
        headers: { "X-Error-Code": "INTERNAL", "Content-Type": "application/json" },
      }),
    ]);

    let threwApiError = false;
    let errorStatus = undefined;
    try {
      await request({
        path: "/shoppings/998/navigation-state",
        init: {},
        fetchImpl: fm.fetch,
      });
    } catch (e) {
      threwApiError = e instanceof ApiErrorImpl;
      errorStatus = e.status;
    }

    assert(threwApiError, "Esperava ApiError");
    assert(errorStatus === 500, `Esperava status 500, obteve ${errorStatus}`);
    assert(fm.getCallCount() === 1, `Esperava 1 chamada, obteve ${fm.getCallCount()}`);
  });

  // T4: GET: erro inesperado (não-ApiError) sem retentativas
  await test("GET: erro inesperado (ReferenceError) não faz retentativa", async () => {
    const fm = createFetchMock([
      new ReferenceError("Algo inesperado aconteceu"),
    ]);

    let threwApiError = false;
    let errorMessage = "";
    try {
      await request({
        path: "/shoppings/997/navigation-state",
        init: {},
        fetchImpl: fm.fetch,
      });
    } catch (e) {
      threwApiError = e instanceof ApiErrorImpl;
      errorMessage = e.message;
    }

    assert(threwApiError, "Esperava ApiError lançado");
    assert(
      errorMessage.includes("Não foi possível conectar"),
      `Esperava mensagem de erro de conexão, obteve: ${errorMessage}`
    );
    assert(fm.getCallCount() === 1, `Esperava 1 chamada, obteve ${fm.getCallCount()}`);
  });

  // T5: GET: timeout de rede (TypeError com mensagem de rede) causa retry
  await test("GET: timeout de rede (TypeError com 'network timeout') causa retry", async () => {
    const fm = createFetchMock([
      new TypeError("network timeout"),
      new Response(JSON.stringify({ sucesso: true }), { status: 200 }),
    ]);

    const result = await request({
      path: "/shoppings/1/navigation-state",
      init: {},
      fetchImpl: fm.fetch,
    });

    assert(result.sucesso === true, "Esperava sucesso na segunda tentativa");
    assert(fm.getCallCount() === 2, `Esperava 2 chamadas, obteve ${fm.getCallCount()}`);
  });

  // T6: POST: falha de rede sem retentativas (maxRetries = 0)
  await test("POST: falha de rede não faz retentativa", async () => {
    const fm = createFetchMock([
      new TypeError("Failed to fetch"),
    ]);

    let threwError = false;
    try {
      await request({
        path: "/routes",
        init: { method: "POST", body: JSON.stringify({}) },
        fetchImpl: fm.fetch,
      });
    } catch (e) {
      threwError = true;
    }

    assert(threwError, "Esperava erro para POST com falha de rede");
    assert(fm.getCallCount() === 1, `Esperava 1 chamada para POST, obteve ${fm.getCallCount()}`);
  });

  // T7: GET: sucesso na primeira tentativa (sem retry desnecessário)
  await test("GET: sucesso na primeira tentativa faz 1 chamada ao fetch", async () => {
    const fm = createFetchMock([
      new Response(JSON.stringify({ sucesso: true }), { status: 200 }),
    ]);

    const result = await request({
      path: "/shoppings/1/navigation-state",
      init: {},
      fetchImpl: fm.fetch,
    });

    assert(result.sucesso === true, "Esperava sucesso");
    assert(fm.getCallCount() === 1, `Esperava 1 chamada, obteve ${fm.getCallCount()}`);
  });

  // T8: GET: duas falhas de rede seguida de sucesso na 3ª tentativa
  await test("GET: duas falhas de rede seguida de sucesso na 3ª tentativa", async () => {
    const fm = createFetchMock([
      new TypeError("Failed to fetch"),
      new TypeError("Network request failed"),
      new Response(JSON.stringify({ sucesso: true }), { status: 200 }),
    ]);

    const result = await request({
      path: "/shoppings/1/navigation-state",
      init: {},
      fetchImpl: fm.fetch,
    });

    assert(result.sucesso === true, "Esperava sucesso na 3ª tentativa");
    assert(fm.getCallCount() === 3, `Esperava 3 chamadas, obteve ${fm.getCallCount()}`);
  });

  // T9: GET: falha de rede em todas as 3 tentativas
  await test("GET: falha de rede em todas as 3 tentativas lança erro final", async () => {
    const fm = createFetchMock([
      new TypeError("Failed to fetch"),
      new TypeError("Failed to fetch"),
      new TypeError("Failed to fetch"),
    ]);

    let threwError = false;
    let errorMessage = "";
    try {
      await request({
        path: "/shoppings/1/navigation-state",
        init: {},
        fetchImpl: fm.fetch,
      });
    } catch (e) {
      threwError = true;
      errorMessage = e.message;
    }

    assert(threwError, "Esperava erro após 3 tentativas");
    assert(
      errorMessage.includes("Não foi possível conectar"),
      `Esperava mensagem de erro de conexão, obteve: ${errorMessage}`
    );
    assert(fm.getCallCount() === 3, `Esperava 3 chamadas, obteve ${fm.getCallCount()}`);
  });

  // T10: POST: sucesso na primeira tentativa
  await test("POST: sucesso na primeira tentativa faz 1 chamada ao fetch", async () => {
    const fm = createFetchMock([
      new Response(JSON.stringify({ sucesso: true }), { status: 201 }),
    ]);

    const result = await request({
      path: "/routes",
      init: { method: "POST", body: JSON.stringify({}) },
      fetchImpl: fm.fetch,
    });

    assert(result.sucesso === true, "Esperava sucesso");
    assert(fm.getCallCount() === 1, `Esperava 1 chamada, obteve ${fm.getCallCount()}`);
  });

  console.log(`\n${passed} passou, ${failed} falhou`);
  if (failed > 0) process.exit(1);
}

await runTests();
