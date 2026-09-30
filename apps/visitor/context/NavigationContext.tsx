import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  calculateRoute,
  getFloorGraph,
  listFloors,
  listShoppings,
  listPois,
  getPoi,
  getNavigationState,
} from "@/services/api";
import { AppState } from "react-native";
import { getStatusOperacional } from "@/types";
import type {
  GraphResponse,
  Loja,
  No,
  Piso,
  RotaResponse,
  Shopping,
} from "@/types";
import { useVisitorPreferences } from "./VisitorPreferences";

export type LocationSource = "qr" | "manual" | "arrival";

type NavigationContextValue = {
  loading: boolean;
  error: string | null;
  shoppings: Shopping[];
  floors: Piso[];
  graph: GraphResponse | null;
  shopping: Shopping | null;
  floor: Piso | null;
  originNode: No | null;
  destinationLoja: Loja | null;
  destinationNode: No | null;
  destinationNodeId: number | undefined;
  destinationName: string | undefined;
  originUpdate: { source: LocationSource; at: number } | null;
  routeError: string | null;
  routeStale: boolean;
  mapError: string | null;
  navigationRevision: string | null;
  route: RotaResponse | null;
  routeLoading: boolean;
  arrivalLoading: boolean;
  acessivel: boolean;
  hasArrived: boolean;
  setAcessivel: (value: boolean) => void;
  selectShopping: (id: number) => Promise<void>;
  selectFloor: (id: number) => Promise<void>;
  /** Ajusta automaticamente shopping, piso e grafo para a origem lida/selecionada. */
  setOriginNode: (node: No | null, source?: LocationSource) => Promise<void>;
  setDestinationLoja: (loja: Loja | null) => Promise<void>;
  setDestinationNode: (node: No) => Promise<void>;
  returnToEntry: () => Promise<void>;
  completeNavigation: () => Promise<void>;
  clearRoute: () => void;
  clearError: () => void;
  refresh: () => Promise<void>;
  recalculate: () => Promise<void>;
};

const NavigationContext = createContext<NavigationContextValue | null>(null);

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const { remember } = useVisitorPreferences();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shoppings, setShoppings] = useState<Shopping[]>([]);
  const [floors, setFloors] = useState<Piso[]>([]);
  const [graph, setGraph] = useState<GraphResponse | null>(null);
  const [shoppingId, setShoppingId] = useState<number | null>(null);
  const [floorId, setFloorId] = useState<number | null>(null);
  const [originNode, setOriginNodeState] = useState<No | null>(null);
  const [destinationLoja, setDestinationLojaState] = useState<Loja | null>(
    null
  );
  const [route, setRoute] = useState<RotaResponse | null>(null);
  const [destinationNode, setDestinationNodeState] = useState<No | null>(null);
  const [originUpdate, setOriginUpdate] = useState<{ source: LocationSource; at: number } | null>(null);
  const [entryNode, setEntryNode] = useState<No | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [routeStale, setRouteStale] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [navigationRevision, setNavigationRevision] = useState<string | null>(null);
  const [confirmedUnavailable, setConfirmedUnavailable] = useState(false);
  const destinationNodeId = destinationLoja?.no_id ?? destinationNode?.id;
  const destinationName = destinationLoja?.nome ?? destinationNode?.nome ?? undefined;
  const [routeLoading, setRouteLoading] = useState(false);
  const [arrivalLoading, setArrivalLoading] = useState(false);
  const [acessivel, setAcessivel] = useState(false);
  const [hasArrived, setHasArrived] = useState(false);
  const routeRequest = useRef(0);
  const graphRequest = useRef(0);

  const shopping = useMemo(
    () => shoppings.find((item) => item.id === shoppingId) ?? null,
    [shoppings, shoppingId]
  );

  const floor = useMemo(
    () => floors.find((item) => item.id === floorId) ?? null,
    [floors, floorId]
  );

  const loadGraph = useCallback(async (id: number) => {
    const request = ++graphRequest.current;
    const data = await getFloorGraph(id);
    if (request === graphRequest.current) setGraph(data);
    return data;
  }, []);

  const loadFloors = useCallback(
    async (id: number, preferredFloorId?: number | null) => {
      const data = await listFloors(id);
      setFloors(data);
      if (data.length === 0) {
        setFloorId(null);
        setGraph(null);
        return data;
      }

      const requestedFloorId =
        preferredFloorId === undefined ? floorId : preferredFloorId;
      const nextFloor =
        data.find((item) => item.id === requestedFloorId) ?? data[0];
      setFloorId(nextFloor.id);
      await loadGraph(nextFloor.id);
      return data;
    },
    [floorId, loadGraph]
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const lista = await listShoppings();
      setShoppings(lista);
      if (lista.length === 0) {
        setShoppingId(null);
        setFloors([]);
        setGraph(null);
        return;
      }

      const nextShopping =
        lista.find((item) => item.id === shoppingId) ?? lista[0];
      setShoppingId(nextShopping.id);
      await loadFloors(nextShopping.id);
    } catch (err) {
      setError(errorMessage(err, "Falha ao carregar dados do shopping."));
    } finally {
      setLoading(false);
    }
  }, [loadFloors, shoppingId]);

  useEffect(() => {
    void refresh();
    // O carregamento inicial é único; as mudanças de piso não devem reiniciar o app.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const computeRoute = useCallback(
    async (origem: No, destinoNoId: number, preserve = false, allowUnavailable = confirmedUnavailable) => {
      const request = ++routeRequest.current;
      setRouteLoading(true);
      if (!preserve) setRoute(null);
      setRouteError(null);
      setRouteStale(preserve);
      try {
        const result = await calculateRoute(origem.id, destinoNoId, acessivel, allowUnavailable);
        if (request !== routeRequest.current) return;
        if (!result.sucesso) {
          setRouteError("Não foi possível encontrar uma rota para este destino.");
          setRouteStale(true);
          return;
        }
        setRoute(result);
        setRouteStale(false);
      } catch (err) {
        if (request !== routeRequest.current) return;
        setRouteStale(true);
        setRouteError(errorMessage(err, "Não foi possível calcular a rota."));
      } finally {
        if (request === routeRequest.current) setRouteLoading(false);
      }
    },
    [acessivel, confirmedUnavailable]
  );

  /**
   * Localiza o piso da origem entre os shoppings ativos. O endpoint de QR
   * retorna apenas o nó; esta etapa impede que o app mantenha o mapa no piso
   * anterior depois de uma leitura válida.
   */
  const activateFloorForNode = useCallback(
    async (node: No): Promise<{ floor: Piso; node: No }> => {
      let knownShoppings = shoppings;
      if (knownShoppings.length === 0) {
        knownShoppings = await listShoppings();
        setShoppings(knownShoppings);
      }

      let matchingFloors = floors;
      let matchedFloor = matchingFloors.find((item) => item.id === node.piso_id);

      if (!matchedFloor) {
        const candidates = await Promise.all(
          knownShoppings.map(async (candidateShopping) => ({
            shopping: candidateShopping,
            floors: await listFloors(candidateShopping.id),
          }))
        );
        const match = candidates.find((candidate) =>
          candidate.floors.some((item) => item.id === node.piso_id)
        );
        if (!match) {
          throw new Error("O piso correspondente ao QR Code não está disponível.");
        }
        matchingFloors = match.floors;
        matchedFloor = matchingFloors.find((item) => item.id === node.piso_id);
        setShoppingId(match.shopping.id);
        setFloors(matchingFloors);
      } else {
        setShoppingId(matchedFloor.shopping_id);
      }

      if (!matchedFloor) {
        throw new Error("O piso correspondente ao QR Code não está disponível.");
      }

      setFloorId(matchedFloor.id);
      const data = await loadGraph(matchedFloor.id);
      const current = data.nos.find((item) => item.id === node.id);
      if (!current) throw new Error("Este ponto de partida não está mais disponível. Leia outro QR Code ou selecione um ponto ativo.");
      return { floor: matchedFloor, node: current };
    },
    [floors, loadGraph, shoppings]
  );

  const selectShopping = useCallback(
    async (id: number) => {
      setLoading(true);
      routeRequest.current += 1;
      setRouteLoading(false);
      setArrivalLoading(false);
      setError(null);
      setShoppingId(id);
      setNavigationRevision(null);
      setOriginNodeState(null);
      setOriginUpdate(null);
      setEntryNode(null);
      setDestinationLojaState(null);
      setDestinationNodeState(null);
      setRouteError(null);
      setMapError(null);
      setRoute(null);
      setHasArrived(false);
      try {
        await loadFloors(id, null);
      } catch (err) {
        setError(errorMessage(err, "Não foi possível carregar os pisos."));
      } finally {
        setLoading(false);
      }
    },
    [loadFloors]
  );

  const selectFloor = useCallback(
    async (id: number) => {
      setMapError(null);
      setFloorId(id);
      setGraph(null);
      try {
        await loadGraph(id);
      } catch (err) {
        setMapError(errorMessage(err, "Não foi possível carregar o mapa deste piso."));
      }
    },
    [loadGraph]
  );

  const setOriginNode = useCallback(
    async (node: No | null, source: LocationSource = "manual") => {
      const request = ++routeRequest.current;
      setRouteError(null);
      setRouteStale(false);
      setRouteLoading(false);
      setArrivalLoading(false);
      if (!node) {
        setOriginNodeState(null);
        setOriginUpdate(null);
        setRoute(null);
        setHasArrived(false);
        return;
      }

      setError(null);
      try {
        const active = await activateFloorForNode(node);
        const targetFloor = active.floor;
        node = active.node;
        if (request !== routeRequest.current) return;
        const shoppingChanged =
          shoppingId !== null && shoppingId !== targetFloor.shopping_id;

        setOriginNodeState(node);
        setOriginUpdate({ source, at: Date.now() });
        if (node.tipo === "entrada") setEntryNode(node);
        if (shoppingChanged) {
          // Um destino de outro shopping viola RN04 e não deve ser reutilizado.
          setDestinationLojaState(null);
          setDestinationNodeState(null);
          if (node.tipo !== "entrada") setEntryNode(null);
          setRoute(null);
          setHasArrived(false);
          return;
        }

        if (destinationNodeId === node.id) {
          setRoute(null);
          setHasArrived(true);
          return;
        }

        setHasArrived(false);
        if (destinationNodeId) {
          await computeRoute(node, destinationNodeId);
        } else {
          setRoute(null);
        }
      } catch (err) {
        if (request !== routeRequest.current) return;
        const message = errorMessage(err, "Não foi possível definir a origem.");
        setError(message);
        throw new Error(message);
      }
    },
    [activateFloorForNode, computeRoute, destinationNodeId, shoppingId]
  );

  const setDestinationLoja = useCallback(
    async (loja: Loja | null) => {
      const allowUnavailable = !!loja && getStatusOperacional(loja) !== "aberto";
      setConfirmedUnavailable(allowUnavailable);
      setError(null);
      const request = ++routeRequest.current;
      setRouteLoading(false);
      setArrivalLoading(false);
      setRoute(null);
      setHasArrived(false);
      setRouteError(null);
      setRouteStale(false);
      if (loja && shoppingId !== null) {
        try {
          const destinationId = loja.id;
          const registered = await listPois({ shopping_id: shoppingId });
          if (request !== routeRequest.current) return;
          const current = registered.find((item) => item.id === destinationId);
          if (!current) throw new Error("Este destino não está disponível no shopping da sua origem.");
          loja = current;
        } catch (err) {
          if (request !== routeRequest.current) return;
          setError(errorMessage(err, "Falha ao verificar o destino."));
          return;
        }
      }
      setDestinationLojaState(loja);
      setDestinationNodeState(null);
      if (loja && shopping) remember(shopping.codigo, `poi:${loja.codigo}`);
      if (!loja || !originNode) return;

      if (originNode.id === loja.no_id) {
        setHasArrived(true);
        return;
      }
      await computeRoute(originNode, loja.no_id, false, allowUnavailable);
    },
    [computeRoute, originNode, shoppingId, shopping, remember]
  );

  const setDestinationNode = useCallback(async (candidate: No) => {
    const request = ++routeRequest.current;
    setRouteLoading(false);
    setArrivalLoading(false);
    setRoute(null);
    setRouteError(null);
    setRouteStale(false);
    setError(null);
    setConfirmedUnavailable(false);
    try {
      if (!shopping) throw new Error("Escolha um shopping.");
      const activeFloors = await listFloors(shopping.id);
      if (!activeFloors.some((item) => item.id === candidate.piso_id)) throw new Error("Este ponto não pertence ao shopping selecionado.");
      const [data, pois] = await Promise.all([getFloorGraph(candidate.piso_id), listPois({ shopping_id: shopping.id })]);
      if (request !== routeRequest.current) return;
      const node = data.nos.find((item) => item.id === candidate.id);
      if (!node) throw new Error("Este ponto não está mais disponível.");
      setDestinationLojaState(null);
      setDestinationNodeState(node);
      setHasArrived(originNode?.id === node.id);
      const poi = pois.find((item) => item.no_id === node.id);
      remember(shopping.codigo, poi ? `poi:${poi.codigo}` : `node:${node.codigo}`);
      if (originNode && originNode.id !== node.id) await computeRoute(originNode, node.id, false, false);
    } catch (err) {
      if (request === routeRequest.current) setError(errorMessage(err, "Não foi possível verificar o destino."));
    }
  }, [originNode, shopping, remember, computeRoute]);

  const returnToEntry = useCallback(async () => {
    const request = routeRequest.current;
    try {
      if (!shoppingId) throw new Error("Escolha um shopping para consultar as entradas.");
      const activeFloors = await listFloors(shoppingId);
      const graphs = await Promise.all(activeFloors.map((item) => getFloorGraph(item.id)));
      if (request !== routeRequest.current) return;
      const entries = graphs.flatMap((item) => item.nos.filter((node) => node.tipo === "entrada").sort((a, b) => a.id - b.id));
      const entry = entries.find((node) => node.id === entryNode?.id) || entries[0];
      if (!entry) throw new Error("Nenhuma entrada ativa foi cadastrada neste shopping.");
      await setDestinationNode(entry);
    } catch (err) { if (request === routeRequest.current) setError(errorMessage(err, "Não foi possível consultar a entrada.")); }
  }, [entryNode, shoppingId, setDestinationNode]);

  const clearRoute = useCallback(() => {
    routeRequest.current += 1;
    setRouteLoading(false);
    setArrivalLoading(false);
    setDestinationLojaState(null);
    setDestinationNodeState(null);
    setRoute(null);
    setRouteError(null);
    setRouteStale(false);
    setHasArrived(false);
    setError(null);
  }, []);

  const completeNavigation = useCallback(async () => {
    if (!shoppingId || !destinationNodeId || !route || routeLoading || arrivalLoading || routeStale) return;
    const endpoint = route.nos[route.nos.length - 1];
    if (!endpoint || endpoint.id !== destinationNodeId) return;

    const request = ++routeRequest.current;
    setArrivalLoading(true);
    setError(null);
    try {
      const state = await getNavigationState(shoppingId);
      if (request !== routeRequest.current) return;
      if (!state.ativo || state.revisao !== route.revisao) {
        setRouteStale(true);
        setRouteError("O mapa mudou. Recalcule o trajeto antes de confirmar a chegada.");
        return;
      }
      // Use o nó cadastrado pela API, inclusive quando o destino está em outro piso.
      const destinationGraph = graph?.piso_id === endpoint.piso_id
        ? graph : await getFloorGraph(endpoint.piso_id);
      if (request !== routeRequest.current) return;
      const destinationNode = destinationGraph.nos.find((node) => node.id === endpoint.id);
      if (!destinationNode) throw new Error("O destino não está disponível no mapa. Leia um QR Code para atualizar sua posição.");
      graphRequest.current += 1;
      setGraph(destinationGraph);
      setFloorId(destinationNode.piso_id);
      setOriginNodeState(destinationNode);
      setOriginUpdate({ source: "arrival", at: Date.now() });
      setRoute(null);
      setHasArrived(true);
    } catch (err) {
      if (request === routeRequest.current) setError(errorMessage(err, "Não foi possível confirmar a chegada. Tente novamente."));
    } finally {
      if (request === routeRequest.current) setArrivalLoading(false);
    }
  }, [shoppingId, destinationNodeId, route, routeLoading, arrivalLoading, graph, routeStale]);

  const recalculate = useCallback(async () => {
    if (!originNode || !destinationNodeId || arrivalLoading) return;
    const request = ++routeRequest.current;
    setRouteLoading(true);
    setRouteError(null);
    setRouteStale(true);
    setHasArrived(false);
    try {
      const [current, activeFloors] = await Promise.all([
        destinationLoja ? getPoi(destinationLoja.id) : Promise.resolve(null),
        shoppingId ? listFloors(shoppingId) : Promise.resolve([]),
      ]);
      if (request !== routeRequest.current) return;
      setDestinationLojaState(current);
      setFloors(activeFloors);
      const currentFloor = activeFloors.find((item) => item.id === floorId) || activeFloors[0];
      setFloorId(currentFloor?.id ?? null);
      if (currentFloor) {
        try { await loadGraph(currentFloor.id); setMapError(null); }
        catch (err) { setMapError(errorMessage(err, "Não foi possível atualizar o mapa.")); }
      }
      if (request !== routeRequest.current) return;
      await computeRoute(originNode, current?.no_id ?? destinationNodeId, true);
    } catch (err) {
      if (request !== routeRequest.current) return;
      setRouteLoading(false);
      setRouteError(errorMessage(err, "Falha ao atualizar a rota."));
    }
  }, [originNode, destinationLoja, destinationNodeId, floorId, loadGraph, computeRoute, arrivalLoading, shoppingId]);

  const liveNavigation = useRef({ route, routeLoading, arrivalLoading, originNode, destinationNodeId, hasArrived, floorId, loading, recalculate });
  liveNavigation.current = { route, routeLoading, arrivalLoading, originNode, destinationNodeId, hasArrived, floorId, loading, recalculate };
  useEffect(() => {
    if (!shoppingId) return;
    let live = true, inFlight = false, pending = false, disconnected = false;
    let revision: string | undefined, lastAutoRevision: string | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function check() {
      if (!live || inFlight) return;
      clearTimeout(timer);
      if (AppState.currentState !== "active" || liveNavigation.current.loading) {
        timer = setTimeout(check, 2000); return;
      }
      inFlight = true;
      try {
        const state = await getNavigationState(shoppingId!);
        if (!live) return;
        const changed = revision !== undefined && revision !== state.revisao;
        revision = state.revisao;
        setNavigationRevision(state.revisao);
        const current = liveNavigation.current;
        if (!state.ativo) {
          setRouteStale(true);
          setRouteError("Este shopping está indisponível. Leia um QR Code de um shopping ativo para continuar.");
          setRoute(null); setGraph(null); setFloorId(null); setFloors([]);
          setOriginNodeState(null); setOriginUpdate(null); setEntryNode(null); setHasArrived(false);
          return;
        }
        pending = pending || changed || disconnected ||
          (!!current.route && current.route.revisao !== state.revisao && lastAutoRevision !== state.revisao);
        disconnected = false;
        if (pending && !current.routeLoading && !current.arrivalLoading) {
          pending = false; lastAutoRevision = state.revisao;
          if (current.originNode && current.destinationNodeId && !current.hasArrived) {
            setRouteStale(true);
            await current.recalculate();
          } else {
            const graphVersion = ++graphRequest.current;
            const activeFloors = await listFloors(shoppingId!);
            const selected = activeFloors.find((item) => item.id === current.floorId) || activeFloors[0];
            const data = selected ? await getFloorGraph(selected.id) : null;
            const originGraph = current.originNode && current.originNode.piso_id !== selected?.id && activeFloors.some((item) => item.id === current.originNode!.piso_id)
              ? await getFloorGraph(current.originNode.piso_id) : data;
            if (!live || graphVersion !== graphRequest.current) return;
            setFloors(activeFloors); setFloorId(selected?.id ?? null); setGraph(data);
            if (current.originNode && (!activeFloors.some((item) => item.id === current.originNode!.piso_id) ||
                (originGraph?.piso_id === current.originNode.piso_id && !originGraph.nos.some((item) => item.id === current.originNode!.id)))) {
              setOriginNodeState(null); setOriginUpdate(null); setHasArrived(false);
              setError("Seu ponto de partida está indisponível. Leia outro QR Code ou selecione uma origem ativa.");
            }
          }
        }
      } catch {
        if (live) {
          disconnected = true;
          if (liveNavigation.current.route && !liveNavigation.current.arrivalLoading) {
            setRouteStale(true);
            setRouteError("Não foi possível verificar mudanças no mapa. Aguardando conexão para atualizar a rota.");
          }
        }
      } finally {
        inFlight = false;
        if (live) timer = setTimeout(check, 2000);
      }
    }
    void check();
    const subscription = AppState.addEventListener("change", (state) => { if (state === "active") void check(); });
    return () => { live = false; clearTimeout(timer); subscription.remove(); };
  }, [shoppingId]);

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    if (
      !originNode ||
      !destinationNodeId ||
      hasArrived ||
      originNode.id === destinationNodeId
    ) {
      return;
    }
    void computeRoute(originNode, destinationNodeId, true);
  }, [acessivel]);

  const value = useMemo<NavigationContextValue>(
    () => ({
      loading,
      error,
      shoppings,
      floors,
      graph,
      shopping,
      floor,
      originNode,
      destinationLoja,
      destinationNode, destinationNodeId, destinationName, originUpdate, routeError, routeStale, mapError, navigationRevision,
      setDestinationNode, returnToEntry,
      route,
      routeLoading,
      arrivalLoading,
      acessivel,
      hasArrived,
      setAcessivel,
      selectShopping,
      selectFloor,
      setOriginNode,
      setDestinationLoja,
      completeNavigation,
      clearRoute,
      clearError,
      refresh,
      recalculate,
    }),
    [
      acessivel,
      arrivalLoading,
      clearError,
      clearRoute,
      completeNavigation,
      destinationLoja,
      destinationNode, destinationNodeId, destinationName, originUpdate, routeError, routeStale, mapError, navigationRevision,
      setDestinationNode, returnToEntry,
      error,
      floor,
      floors,
      graph,
      hasArrived,
      loading,
      originNode,
      refresh,
      recalculate,
      route,
      routeLoading,
      selectFloor,
      selectShopping,
      setDestinationLoja,
      setOriginNode,
      shopping,
      shoppings,
    ]
  );

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx) {
    throw new Error("useNavigation deve ser usado dentro de NavigationProvider");
  }
  return ctx;
}
