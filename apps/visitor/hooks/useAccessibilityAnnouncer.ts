import { useEffect, useRef } from "react";
import { AccessibilityInfo, Platform } from "react-native";
import { useNavigation } from "@/context/NavigationContext";
import {
  AnnouncementTracker,
  arrivalAnnouncement,
  errorAnnouncement,
  floorAnnouncement,
  originAnnouncement,
  routeAnnouncement,
} from "@/services/accessibilityAnnouncements";

/**
 * Anuncia eventos de navegação para leitores de tela (VoiceOver no iOS e
 * TalkBack no Android). Avisos: rota calculada/atualizada, chegada ao destino,
 * mudança de piso relevante à rota, definição de origem, erro de rota e
 * próxima manobra/progressão da rota.
 *
 * Cada anúncio é disparado exatamente uma vez por transição de estado (rastreador
 * de dedução), nunca a cada render ou tick de animação. No Android a mudança da
 * instrução é lida via `accessibilityLiveRegion` nos banners; no iOS o anuncio é
 * feito explicitamente aqui para não depender de regiões dinâmicas.
 */
export function useAccessibilityAnnouncer() {
  const nav = useNavigation();
  const tracker = useRef(new AnnouncementTracker());

  useEffect(() => {
    // Anúncios sonoros só fazem sentido em dispositivos nativos.
    if (Platform.OS === "web") return;

    const {
      route,
      hasArrived,
      floor,
      originNode,
      destinationName,
      floors,
      acessivel,
      routeError,
      simulationProgress,
    } = nav;

    // Rota calculada ou recalculada.
    const routeRev = route?.revisao ?? null;
    if (route && tracker.current.shouldAnnounce("route", routeRev ?? null)) {
      const steps = (route.etapas ?? []).filter((etapa) => etapa.tipo !== "inicio").length;
      const distancia = (route.distancia_total_metros ?? 0).toFixed(0);
      const dest = destinationName || "destino";
      AccessibilityInfo.announceForAccessibility(
        routeAnnouncement({ destination: dest, distanceMeters: Number(distancia), steps, accessible: !!acessivel }),
      );
    }

    // Chegada ao destino.
    if (tracker.current.shouldAnnounce("arrival", hasArrived ? destinationName ?? null : null)) {
      const dest = destinationName || "destino";
      AccessibilityInfo.announceForAccessibility(arrivalAnnouncement(dest));
    }

    // Mudança de piso durante a navegação (só quando relevante à rota ativa).
    const floorId = floor?.id ?? null;
    if (floor && floorId && tracker.current.shouldAnnounce("floor", floorId)) {
      AccessibilityInfo.announceForAccessibility(floorAnnouncement(floor.nome));
    }

    // Origem definida (QR, manual ou chegada).
    if (originNode && tracker.current.shouldAnnounce("origin", originNode.id)) {
      const floorNome = floors.find((f) => f.id === originNode.piso_id)?.nome;
      AccessibilityInfo.announceForAccessibility(
        originAnnouncement({ nodeName: originNode.nome || "local", floorName: floorNome }),
      );
    }

    // Erro de rota (anunciado uma vez por mensagem distinta).
    if (routeError && tracker.current.shouldAnnounce("error", routeError)) {
      AccessibilityInfo.announceForAccessibility(errorAnnouncement(routeError));
    }

    // Próxima manobra / progressão da rota. No iOS anuncia-se explicitamente;
    // no Android a mudança de texto já é lida via accessibilityLiveRegion dos
    // banners, então não se duplica aqui.
    if (Platform.OS === "ios") {
      const instruction = simulationProgress?.instruction?.texto ?? null;
      if (instruction && tracker.current.shouldAnnounce("instruction", instruction)) {
        AccessibilityInfo.announceForAccessibility(instruction);
      }
    }
  }, [
    nav.route,
    nav.hasArrived,
    nav.destinationName,
    nav.floor,
    nav.originNode,
    nav.floors,
    nav.acessivel,
    nav.routeError,
    nav.simulationProgress,
    Platform.OS,
  ]);
}
