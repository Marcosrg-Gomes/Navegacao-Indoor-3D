import { useEffect, useMemo, useState } from "react";
import { getFloorGraph, getRouteDistances, listPois } from "@/services/api";
import { useNavigation } from "@/context/NavigationContext";
import { TIPO_NO_LABEL, type GraphResponse, type Loja, type No } from "@/types";

export type Place = { key: string; node: No; poi?: Loja; name: string; category: string };
export const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");

export function useDirectory(active: boolean, accessibleOnly = false) {
  const { shopping, floors, originNode, acessivel, navigationRevision } = useNavigation();
  const [places, setPlaces] = useState<Place[]>([]);
  const [graphs, setGraphs] = useState<GraphResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [distances, setDistances] = useState<Record<string, number> | null>(null);
  const [distanceError, setDistanceError] = useState<string | null>(null);
  const [distanceLoading, setDistanceLoading] = useState(false);
  useEffect(() => { if (!active) return; const timer = setInterval(() => setRevision((value) => value + 1), 60_000); return () => clearInterval(timer); }, [active]);
  useEffect(() => { setPlaces([]); setGraphs([]); }, [shopping?.id]);
  useEffect(() => {
    if (!active || !shopping) { setLoading(false); return; }
    let live = true;
    setLoading(true); setError(null);
    void Promise.all([listPois({ shopping_id: shopping.id }), Promise.all(floors.map((floor) => getFloorGraph(floor.id)))])
      .then(([pois, graphs]) => {
        if (!live) return;
        setGraphs(graphs);
        const nodes = graphs.flatMap((graph) => graph.nos);
        const poiByNode = new Map(pois.map((poi) => [poi.no_id, poi]));
        setPlaces(nodes.filter((node) => poiByNode.has(node.id) || ["entrada", "saida", "elevador", "banheiro"].includes(node.tipo))
          .map((node) => {
            const poi = poiByNode.get(node.id);
            return { key: poi ? `poi:${poi.codigo}` : `node:${node.codigo}`, node, poi,
              name: poi?.nome || node.nome || TIPO_NO_LABEL[node.tipo], category: poi?.categoria_nome || TIPO_NO_LABEL[node.tipo] };
          }));
      }).catch((err) => { if (live) setError(err instanceof Error ? err.message : "Não foi possível carregar os locais."); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [active, shopping?.id, floors, revision, navigationRevision]);
  useEffect(() => {
    setDistances(null); setDistanceError(null);
    if (!active || !originNode) { setDistanceLoading(false); return; }
    let live = true;
    setDistanceLoading(true);
    void getRouteDistances(originNode.id, acessivel || accessibleOnly).then((data) => { if (live) setDistances(data); })
      .catch(() => { if (live) setDistanceError("Não foi possível consultar as distâncias. Você ainda pode explorar por nome e categoria."); })
      .finally(() => { if (live) setDistanceLoading(false); });
    return () => { live = false; };
  }, [active, originNode?.id, acessivel, accessibleOnly, revision, navigationRevision]);
  const categories = useMemo(() => [...new Set(places.map((place) => place.category))].sort((a, b) => a.localeCompare(b, "pt-BR")), [places]);
  return { places, graphs, loading, error, distances, distanceError, distanceLoading, categories, reload: () => setRevision((value) => value + 1) };
}
