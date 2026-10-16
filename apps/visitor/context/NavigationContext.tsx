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
  getRouteDistances,
} from "@/services/api";
import { AppState } from "react-native";
import { usePathname } from "expo-router";
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
import { currentPosition, initialPositionSession, positionSessionReducer, type PositionEvent } from "@/positioning/session";
import type { LocationSource, PositionEstimate, SimulationStatus } from "@/positioning/types";
import { buildSimulationTrack, type SimulationProgress } from "@/positioning/routeProgress";
import type { SimulationSpeed } from "@/positioning/simulation";
import { useSimulationClock } from "@/positioning/useSimulationClock";
import { requestSimulationRoute } from "@/positioning/rerouting";

export type { LocationSource } from "@/positioning/types";

type NavigationContextValue = {
  loading: boolean;
  error: string | null;
  shoppings: Shopping[];
  floors: Piso[];
  graph: GraphResponse | null;
  shopping: Shopping | null;
  floor: Piso | null;
  originNode: No | null;
  positionEstimate: PositionEstimate | null;
  simulationStatus: SimulationStatus;
  simulationProgress: SimulationProgress | null;
  simulationSpeed: SimulationSpeed;
  routeDisplayNodes: RotaResponse["nos"];
  simulationError: string | null;
  simulationNotice: string | null;
  simulateDeviation: (nodeId?: number) => Promise<void>;
  startSimulation: () => Promise<void>;
  resumeSimulation: () => Promise<void>;
  pauseSimulation: () => void;
  stopSimulation: () => Promise<void>;
  setSimulationSpeed: (speed: SimulationSpeed) => void;
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
  const [positionSession, setPositionSession] = useState(initialPositionSession);
  const simulationSessionRef = useRef(initialPositionSession);
  // Os comandos precisam capturar o último tick mesmo antes do próximo render.
  const dispatchPosition = useCallback((event: PositionEvent) => {
    const next = positionSessionReducer(simulationSessionRef.current, event);
    simulationSessionRef.current = next;
    setPositionSession(next);
  }, []);
  const originNode = positionSession.confirmed?.node ?? null;
  const positionEstimate = currentPosition(positionSession);
  const simulationStatus = positionSession.status;
  const originUpdate = useMemo(() => positionSession.confirmed ? {
    source: positionSession.confirmed.estimate.source,
    at: positionSession.confirmed.estimate.observedAt,
  } : null, [positionSession.confirmed]);
  const [destinationLoja, setDestinationLojaState] = useState<Loja | null>(
    null
  );
  const [route, setRoute] = useState<RotaResponse | null>(null);
  const [destinationNode, setDestinationNodeState] = useState<No | null>(null);
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
  const pathname = usePathname();
  const [simulationError, setSimulationError] = useState<string | null>(null);
  const [simulationNotice, setSimulationNotice] = useState<string | null>(null);
  const simulationRouteRef = useRef<RotaResponse | null>(null);
  const simulationProgress = positionSession.motion?.progress ?? null;
  const simulationSpeed = positionSession.motion?.speed ?? 1;
  const simulationTrack = positionSession.motion?.track;
  const routeDisplayNodes = useMemo(() => simulationTrack
    ? simulationTrack.segments.length
      ? [simulationTrack.segments[0].from, ...simulationTrack.segments.map((segment) => segment.to)]
      : [simulationTrack.destination]
    : route?.nos ?? [], [simulationTrack, route]);
  const simulationActive = pathname === "/" && !loading && !routeLoading && !arrivalLoading && !routeStale &&
    !!route && (!positionSession.simulated || simulationRouteRef.current === route);
  const { pause: pauseSimulation, stop: stopSimulationClock, setSpeed: setSimulationSpeed } =
    useSimulationClock(positionSession, dispatchPosition, simulationActive);

  const shopping = useMemo(
    () => shoppings.find((item) => item.id === shoppingId) ?? null,
    [shoppings, shoppingId]
  );

  const floor = useMemo(
    () => floors.find((item) => item.id === floorId) ?? null,
    [floors, floorId]
  );

  const activateSimulation = useCallback(async (resume: boolean) => {
    setSimulationError(null);
    if (!simulationActive || !shopping || !originNode || !route || AppState.currentState !== "active") return;
    const generation = positionSession.generation, request = routeRequest.current;
    if (positionSession.status !== (resume ? "paused" : "idle")) return;
    try {
      // A preparação informa erros do contrato antes de ligar o relógio.
      buildSimulationTrack(route, shopping.codigo);
      const current = await getNavigationState(shopping.id);
      if (request !== routeRequest.current || generation !== simulationSessionRef.current.generation) return;
      if (!current.ativo || current.revisao !== route.revisao) {
        throw new Error("O mapa mudou. Recalcule a rota antes de iniciar ou retomar a demonstração.");
      }
      simulationRouteRef.current = route;
      dispatchPosition(resume ? { type: "resume", revision: current.revisao }
        : { type: "start", route, revision: current.revisao, at: Date.now() });
    } catch (cause) {
      if (request === routeRequest.current && generation === simulationSessionRef.current.generation) {
        setSimulationError(errorMessage(cause, "Não foi possível iniciar a demonstração."));
      }
    }
  }, [simulationActive, shopping, originNode, route, positionSession.generation, positionSession.status]);
  const startSimulation = useCallback(() => activateSimulation(false), [activateSimulation]);
  const resumeSimulation = useCallback(() => activateSimulation(true), [activateSimulation]);

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
        routeRequest.current += 1;
        graphRequest.current += 1;
        dispatchPosition({ type: "reset" });
        setSimulationError(null); setSimulationNotice(null);
        setRoute(null);
        setRouteLoading(false);
        setArrivalLoading(false);
        setHasArrived(false);
        setDestinationLojaState(null);
        setDestinationNodeState(null);
        setEntryNode(null);
        setNavigationRevision(null);
        setShoppingId(null);
        setFloorId(null);
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
    async (origem: No, destinoNoId: number, preserve = false, allowUnavailable = confirmedUnavailable, deviation = false, deviationNodeId?: number) => {
      pauseSimulation();
      const simulated = simulationSessionRef.current.simulated !== null;
      if (simulated) dispatchPosition({ type: "reroute" });
      const session = simulationSessionRef.current;
      const request = ++routeRequest.current;
      setRouteLoading(true);
      if (!preserve && !simulated) setRoute(null);
      setRouteError(null);
      setSimulationError(null);
      setRouteStale(preserve || simulated);
      try {
        if (simulated) {
          if (!shopping) throw new Error("Escolha um shopping para a demonstração.");
          const isCurrent = () => request === routeRequest.current && session.generation === simulationSessionRef.current.generation;
          const result = await requestSimulationRoute({ session, shopping, destinationId: destinoNoId,
            accessible: acessivel, allowUnavailable, deviation, deviationNodeId, isCurrent, now: Date.now },
          { getNavigationState, getFloorGraph, listFloors, getRouteDistances, calculateRoute });
          if (!isCurrent()) return;
          simulationRouteRef.current = result.route;
          dispatchPosition({ type: "rerouted", generation: session.generation, motion: result.motion });
          setSimulationNotice(result.notice);
          setRoute(result.route);
          setRouteStale(false);
          setHasArrived(false);
          return;
        }
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
        const message = errorMessage(err, "Não foi possível calcular a rota.");
        setRouteError(message);
        if (simulated) {
          dispatchPosition({ type: "failed", generation: session.generation });
          setSimulationError(message);
        }
      } finally {
        if (request === routeRequest.current) setRouteLoading(false);
      }
    },
    [acessivel, confirmedUnavailable, shopping, pauseSimulation, dispatchPosition]
  );

  const simulateDeviation = useCallback(async (nodeId?: number) => {
    if (!originNode || !destinationNodeId || !simulationSessionRef.current.simulated || routeLoading || arrivalLoading) return;
    await computeRoute(originNode, destinationNodeId, true, confirmedUnavailable, true, nodeId);
  }, [originNode, destinationNodeId, routeLoading, arrivalLoading, computeRoute, confirmedUnavailable]);

  const stopSimulation = useCallback(async () => {
    routeRequest.current += 1;
    stopSimulationClock();
    setSimulationError(null); setSimulationNotice(null); setRouteLoading(false);
    setRoute(null); setRouteError(null); setRouteStale(false);
    if (originNode && destinationNodeId && originNode.id !== destinationNodeId) {
      await computeRoute(originNode, destinationNodeId);
    } else setHasArrived(!!originNode && originNode.id === destinationNodeId);
  }, [stopSimulationClock, originNode, destinationNodeId, computeRoute]);

  /**
   * Localiza o piso da origem entre os shoppings ativos. O endpoint de QR
   * retorna apenas o nó; esta etapa impede que o app mantenha o mapa no piso
   * anterior depois de uma leitura válida.
   */
  const resolveOriginNode = useCallback(
    async (node: No) => {
      let knownShoppings = shoppings;
      if (knownShoppings.length === 0) {
        knownShoppings = await listShoppings();
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
      }

      if (!matchedFloor) {
        throw new Error("O piso correspondente ao QR Code não está disponível.");
      }

      const matchedShoppingId = matchedFloor.shopping_id;
      const matchedShopping = knownShoppings.find((item) => item.id === matchedShoppingId);
      if (!matchedShopping) throw new Error("Este shopping não está mais disponível.");
      const data = await getFloorGraph(matchedFloor.id);
      const current = data.nos.find((item) => item.id === node.id);
      if (!current) throw new Error("Este ponto de partida não está mais disponível. Leia outro QR Code ou selecione um ponto ativo.");
      // O chamador só aplica o resultado depois de descartar respostas antigas.
      return { floor: matchedFloor, node: current, graph: data, floors: matchingFloors, shoppings: knownShoppings, shopping: matchedShopping };
    },
    [floors, shoppings]
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
      dispatchPosition({ type: "reset" });
      setSimulationError(null); setSimulationNotice(null);
      setRouteStale(false);
      graphRequest.current += 1;
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
      dispatchPosition({ type: "stop" });
      setSimulationError(null); setSimulationNotice(null);
      setRouteError(null);
      setRouteStale(!!node && !!route);
      setRouteLoading(false);
      setArrivalLoading(false);
      if (!node) {
        dispatchPosition({ type: "reset" });
        setRoute(null);
        setHasArrived(false);
        return;
      }

      setError(null);
      try {
        const active = await resolveOriginNode(node);
        const targetFloor = active.floor;
        node = active.node;
        if (request !== routeRequest.current) return;
        const shoppingChanged =
          shoppingId !== null && shoppingId !== targetFloor.shopping_id;

        graphRequest.current += 1;
        setShoppings(active.shoppings);
        setShoppingId(targetFloor.shopping_id);
        setFloors(active.floors);
        setFloorId(targetFloor.id);
        setGraph(active.graph);
        setMapError(null);
        setRouteStale(false);
        if (shoppingChanged) setNavigationRevision(null);
        dispatchPosition({ type: "confirm", node, source, shoppingCode: active.shopping.codigo,
          at: Date.now(), revision: shoppingChanged ? null : navigationRevision });
        if (node.tipo === "entrada") setEntryNode(node);
        if (shoppingChanged) {
          // Um destino de outro shopping viola RN04 e não deve ser reutilizado.
          setDestinationLojaState(null);
          setDestinationNodeState(null);
          if (node.tipo !== "entrada") setEntryNode(null);
          setError("Destino de outro shopping foi descartado. Escolha um novo destino no shopping atual.");
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
        if (route) setRouteError(message);
        throw new Error(message);
      }
    },
    [resolveOriginNode, computeRoute, destinationNodeId, shoppingId, navigationRevision, route]
  );

  const setDestinationLoja = useCallback(
    async (loja: Loja | null) => {
      pauseSimulation();
      const allowUnavailable = !!loja && getStatusOperacional(loja) !== "aberto";
      setConfirmedUnavailable(allowUnavailable);
      setError(null);
      const request = ++routeRequest.current;
      setRouteLoading(false);
      setArrivalLoading(false);
      if (!simulationSessionRef.current.simulated) setRoute(null);
      setHasArrived(false);
      setRouteError(null);
      setRouteStale(false);
      if (!loja) {
        dispatchPosition({ type: "stop" });
        setSimulationError(null); setSimulationNotice(null);
        setRoute(null);
      }
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

      if (originNode.id === loja.no_id && !simulationSessionRef.current.simulated) {
        setHasArrived(true);
        return;
      }
      await computeRoute(originNode, loja.no_id, false, allowUnavailable);
    },
    [computeRoute, originNode, shoppingId, shopping, remember, pauseSimulation]
  );

  const setDestinationNode = useCallback(async (candidate: No) => {
    pauseSimulation();
    const request = ++routeRequest.current;
    setRouteLoading(false);
    setArrivalLoading(false);
    if (!simulationSessionRef.current.simulated) setRoute(null);
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
      setHasArrived(!simulationSessionRef.current.simulated && originNode?.id === node.id);
      const poi = pois.find((item) => item.no_id === node.id);
      remember(shopping.codigo, poi ? `poi:${poi.codigo}` : `node:${node.codigo}`);
      if (originNode && (originNode.id !== node.id || simulationSessionRef.current.simulated)) await computeRoute(originNode, node.id, false, false);
    } catch (err) {
      if (request === routeRequest.current) setError(errorMessage(err, "Não foi possível verificar o destino."));
    }
  }, [originNode, shopping, remember, computeRoute, pauseSimulation]);

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
    dispatchPosition({ type: "stop" });
    setSimulationError(null); setSimulationNotice(null);
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
    if (!shopping || !destinationNodeId || !route || routeLoading || arrivalLoading || routeStale || positionSession.simulated) return;
    const endpoint = route.nos[route.nos.length - 1];
    if (!endpoint || endpoint.id !== destinationNodeId) return;

    const request = ++routeRequest.current;
    setArrivalLoading(true);
    setError(null);
    try {
      const state = await getNavigationState(shopping.id);
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
      dispatchPosition({ type: "confirm", node: destinationNode, source: "arrival",
        shoppingCode: shopping.codigo, at: Date.now(), revision: state.revisao });
      setRoute(null);
      setHasArrived(true);
    } catch (err) {
      if (request === routeRequest.current) setError(errorMessage(err, "Não foi possível confirmar a chegada. Tente novamente."));
    } finally {
      if (request === routeRequest.current) setArrivalLoading(false);
    }
  }, [shopping, destinationNodeId, route, routeLoading, arrivalLoading, graph, routeStale, positionSession.simulated]);

  const recalculate = useCallback(async () => {
    if (!originNode || !destinationNodeId || arrivalLoading) return;
    pauseSimulation();
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
      const message = errorMessage(err, "Falha ao atualizar a rota.");
      setRouteError(message);
      if (simulationSessionRef.current.simulated) {
        dispatchPosition({ type: "reroute" });
        dispatchPosition({ type: "failed", generation: simulationSessionRef.current.generation });
        setSimulationError(message);
      }
    }
  }, [originNode, destinationLoja, destinationNodeId, floorId, loadGraph, computeRoute, arrivalLoading, shoppingId, pauseSimulation]);

  const liveNavigation = useRef({ route, routeLoading, arrivalLoading, originNode, destinationNodeId, hasArrived, floorId, loading, recalculate, simulated: false });
  liveNavigation.current = { route, routeLoading, arrivalLoading, originNode, destinationNodeId, hasArrived, floorId, loading, recalculate, simulated: positionSession.simulated !== null };
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
          routeRequest.current += 1; graphRequest.current += 1;
          dispatchPosition({ type: "reset" }); setEntryNode(null); setHasArrived(false);
          setRouteLoading(false); setArrivalLoading(false);
          return;
        }
        pending = pending || changed || disconnected ||
          (!!current.route && current.route.revisao !== state.revisao && lastAutoRevision !== state.revisao);
        disconnected = false;
        if (pending && !current.routeLoading && !current.arrivalLoading) {
          pending = false; lastAutoRevision = state.revisao;
          if (current.originNode && current.destinationNodeId && !current.hasArrived) {
            if (current.simulated) dispatchPosition({ type: "pause" });
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
              dispatchPosition({ type: "reset" }); setHasArrived(false);
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
      (originNode.id === destinationNodeId && !simulationSessionRef.current.simulated)
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
      positionEstimate,
      simulationStatus,
      simulationProgress, simulationSpeed, routeDisplayNodes, simulationError, startSimulation, resumeSimulation, pauseSimulation, stopSimulation, setSimulationSpeed,
      simulationNotice, simulateDeviation,
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
      positionEstimate,
      simulationStatus,
      simulationProgress, simulationSpeed, routeDisplayNodes, simulationError, startSimulation, resumeSimulation, pauseSimulation, stopSimulation, setSimulationSpeed,
      simulationNotice, simulateDeviation,
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
