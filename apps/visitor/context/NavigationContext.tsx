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
} from "@/services/api";
import type {
  GraphResponse,
  Loja,
  No,
  Piso,
  RotaResponse,
  Shopping,
} from "@/types";

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
  route: RotaResponse | null;
  routeLoading: boolean;
  acessivel: boolean;
  hasArrived: boolean;
  setAcessivel: (value: boolean) => void;
  selectShopping: (id: number) => Promise<void>;
  selectFloor: (id: number) => Promise<void>;
  /** Ajusta automaticamente shopping, piso e grafo para a origem lida/selecionada. */
  setOriginNode: (node: No | null) => Promise<void>;
  setDestinationLoja: (loja: Loja | null) => Promise<void>;
  completeNavigation: () => void;
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
  const [routeLoading, setRouteLoading] = useState(false);
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
    async (origem: No, destinoNoId: number) => {
      const request = ++routeRequest.current;
      setRouteLoading(true);
      setRoute(null);
      setError(null);
      try {
        const result = await calculateRoute(origem.id, destinoNoId, acessivel);
        if (request !== routeRequest.current) return;
        if (!result.sucesso) {
          setRoute(null);
          setError("Não foi possível encontrar uma rota para este destino.");
          return;
        }
        setRoute(result);
      } catch (err) {
        if (request !== routeRequest.current) return;
        setRoute(null);
        setError(errorMessage(err, "Não foi possível calcular a rota."));
      } finally {
        if (request === routeRequest.current) setRouteLoading(false);
      }
    },
    [acessivel]
  );

  /**
   * Localiza o piso da origem entre os shoppings ativos. O endpoint de QR
   * retorna apenas o nó; esta etapa impede que o app mantenha o mapa no piso
   * anterior depois de uma leitura válida.
   */
  const activateFloorForNode = useCallback(
    async (node: No): Promise<Piso> => {
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
      await loadGraph(matchedFloor.id);
      return matchedFloor;
    },
    [floors, loadGraph, shoppings]
  );

  const selectShopping = useCallback(
    async (id: number) => {
      setLoading(true);
      routeRequest.current += 1;
      setRouteLoading(false);
      setError(null);
      setShoppingId(id);
      setOriginNodeState(null);
      setDestinationLojaState(null);
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
      setError(null);
      setFloorId(id);
      setGraph(null);
      try {
        await loadGraph(id);
      } catch (err) {
        setError(errorMessage(err, "Não foi possível carregar o mapa deste piso."));
      }
    },
    [loadGraph]
  );

  const setOriginNode = useCallback(
    async (node: No | null) => {
      routeRequest.current += 1;
      setRouteLoading(false);
      if (!node) {
        setOriginNodeState(null);
        setRoute(null);
        setHasArrived(false);
        return;
      }

      setError(null);
      try {
        const targetFloor = await activateFloorForNode(node);
        const shoppingChanged =
          shoppingId !== null && shoppingId !== targetFloor.shopping_id;

        setOriginNodeState(node);
        if (shoppingChanged) {
          // Um destino de outro shopping viola RN04 e não deve ser reutilizado.
          setDestinationLojaState(null);
          setRoute(null);
          setHasArrived(false);
          return;
        }

        if (destinationLoja?.no_id === node.id) {
          setHasArrived(true);
          return;
        }

        setHasArrived(false);
        if (destinationLoja) {
          await computeRoute(node, destinationLoja.no_id);
        } else {
          setRoute(null);
        }
      } catch (err) {
        const message = errorMessage(err, "Não foi possível definir a origem.");
        setError(message);
        throw new Error(message);
      }
    },
    [activateFloorForNode, computeRoute, destinationLoja, shoppingId]
  );

  const setDestinationLoja = useCallback(
    async (loja: Loja | null) => {
      setError(null);
      routeRequest.current += 1;
      setRouteLoading(false);
      setRoute(null);
      setHasArrived(false);
      if (loja && shoppingId !== null) {
        try {
          const destinationId = loja.id;
          const registered = await listPois({ shopping_id: shoppingId });
          const current = registered.find((item) => item.id === destinationId);
          if (!current) throw new Error("Este destino não está disponível no shopping da sua origem.");
          loja = current;
        } catch (err) {
          setError(errorMessage(err, "Falha ao verificar o destino."));
          return;
        }
      }
      setDestinationLojaState(loja);
      if (!loja || !originNode) return;

      if (originNode.id === loja.no_id) {
        setHasArrived(true);
        return;
      }
      await computeRoute(originNode, loja.no_id);
    },
    [computeRoute, originNode, shoppingId]
  );

  const clearRoute = useCallback(() => {
    routeRequest.current += 1;
    setRouteLoading(false);
    setDestinationLojaState(null);
    setRoute(null);
    setHasArrived(false);
    setError(null);
  }, []);

  const completeNavigation = useCallback(() => {
    if (destinationLoja && route && !routeLoading) {
      setHasArrived(true);
      setError(null);
    }
  }, [destinationLoja, route, routeLoading]);

  const recalculate = useCallback(async () => {
    if (!originNode || !destinationLoja) return;
    setHasArrived(false);
    try {
      const current = await getPoi(destinationLoja.id);
      setDestinationLojaState(current);
      if (floorId) await loadGraph(floorId);
      await computeRoute(originNode, current.no_id);
    } catch (err) {
      setRoute(null);
      setError(errorMessage(err, "Falha ao atualizar a rota."));
    }
  }, [originNode, destinationLoja, floorId, loadGraph, computeRoute]);

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    if (
      !originNode ||
      !destinationLoja ||
      hasArrived ||
      originNode.id === destinationLoja.no_id
    ) {
      return;
    }
    void computeRoute(originNode, destinationLoja.no_id);
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
      route,
      routeLoading,
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
      clearError,
      clearRoute,
      completeNavigation,
      destinationLoja,
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
