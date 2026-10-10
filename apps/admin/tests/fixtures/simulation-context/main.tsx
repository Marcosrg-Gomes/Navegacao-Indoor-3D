import { createRoot } from "react-dom/client";
import { NavigationProvider, useNavigation } from "../../../../visitor/context/NavigationContext";
import { listPois, resolveQrCode } from "../../../../visitor/services/api";
import { setAppState, setPath } from "./platform";

function Harness() {
  const nav = useNavigation();
  async function destination(name: string) {
    const stores = await listPois({ shopping_id: nav.shopping!.id });
    await nav.setDestinationLoja(stores.find((store) => store.nome === name)!);
  }
  return <>
    <button disabled={nav.loading} onClick={async () => nav.setOriginNode((await resolveQrCode("MINI-ENTRADA-PRINCIPAL")).no, "qr")}>Entrada QR</button>
    <button onClick={() => destination("NATURA")}>Natura</button>
    <button onClick={() => destination("ANACAPRI")}>Anacapri</button>
    <button onClick={() => nav.startSimulation()}>Iniciar</button>
    <button onClick={() => nav.pauseSimulation()}>Pausar</button>
    <button onClick={() => nav.resumeSimulation()}>Retomar</button>
    <button onClick={() => nav.setSimulationSpeed(4)}>4x</button>
    <button onClick={() => nav.setAcessivel(!nav.acessivel)}>Sem escadas</button>
    <button onClick={() => nav.simulateDeviation()}>Desvio</button>
    <button onClick={() => nav.recalculate()}>Recalcular</button>
    <button onClick={() => nav.stopSimulation()}>Encerrar</button>
    <button onClick={() => nav.clearRoute()}>Cancelar</button>
    <button onClick={() => setPath("/explore")}>Outra aba</button>
    <button onClick={() => setPath("/")}>Início</button>
    <button onClick={() => setAppState("background")}>Segundo plano</button>
    <button onClick={() => setAppState("active")}>Ativo</button>
    <output data-testid="state">{JSON.stringify({ loading: nav.loading, origin: nav.originNode?.id,
      source: nav.originUpdate?.source, status: nav.simulationStatus, position: nav.positionEstimate,
      progress: nav.simulationProgress, destination: nav.destinationNodeId, route: nav.route,
      busy: nav.routeLoading, stale: nav.routeStale, error: nav.simulationError || nav.routeError,
      notice: nav.simulationNotice, arrived: nav.hasArrived })}</output>
  </>;
}
createRoot(document.getElementById("root")!).render(<NavigationProvider><Harness /></NavigationProvider>);
