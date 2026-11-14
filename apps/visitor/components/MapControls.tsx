import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "@/components/AppText";
import { colors } from "@/constants/colors";
import { WayfindingIcon } from "./WayfindingIcon";

/**
 * Controles flutuantes do mapa compacto, iguais no 2D e no 3D:
 * "Piso inteiro" à esquerda; zoom agrupado e "Minha posição" à direita.
 */
export function MapControls({ onOverview, onZoomIn, onZoomOut, onLocate, locateHint = "Volta a acompanhar sua posição no percurso" }: {
  onOverview: () => void; onZoomIn: () => void; onZoomOut: () => void; onLocate: () => void; locateHint?: string;
}) {
  return <>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Ver piso inteiro" onPress={onOverview} style={[styles.card, styles.overview]}>
      <WayfindingIcon name="overview" color={colors.primary} size={18} strokeWidth={2} />
      <Text style={styles.overviewText}>Piso inteiro</Text>
    </TouchableOpacity>
    <View style={styles.right}>
      <View style={[styles.card, styles.zoom]}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Aumentar zoom" onPress={onZoomIn} style={styles.zoomButton}>
          <WayfindingIcon name="plus" color={colors.primary} size={20} strokeWidth={2.2} />
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Diminuir zoom" onPress={onZoomOut} style={styles.zoomButton}>
          <WayfindingIcon name="minus" color={colors.primary} size={20} strokeWidth={2.2} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Minha posição" accessibilityHint={locateHint} onPress={onLocate} style={[styles.card, styles.locate]}>
        <WayfindingIcon name="locate" color={colors.primary} size={22} strokeWidth={2} />
      </TouchableOpacity>
    </View>
  </>;
}

/** Aviso para voltar a acompanhar a rota depois de explorar o mapa. */
export function FollowRouteButton({ onPress, label = "Acompanhar rota" }: { onPress: () => void; label?: string }) {
  return <TouchableOpacity accessibilityRole="button" accessibilityLabel="Voltar a acompanhar a rota" onPress={onPress} style={[styles.card, styles.follow]}>
    <WayfindingIcon name="locate" color={colors.textOnPrimary} size={18} strokeWidth={2} />
    <Text style={styles.followText}>{label}</Text>
  </TouchableOpacity>;
}

const shadow = { shadowColor: "#0b1f1b", shadowOpacity: .16, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 4 };
const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.borderLight, ...shadow },
  overview: { position: "absolute", left: 12, bottom: 12, minHeight: 44, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 8 },
  overviewText: { color: colors.primary, fontSize: 13, fontWeight: "700" },
  right: { position: "absolute", right: 12, bottom: 12, alignItems: "center", gap: 10 },
  zoom: { overflow: "hidden" },
  zoomButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  divider: { height: 1, marginHorizontal: 10, backgroundColor: colors.borderLight },
  locate: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center", borderColor: colors.accent, borderWidth: 2 },
  follow: { position: "absolute", bottom: 68, alignSelf: "center", minHeight: 44, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 22, backgroundColor: colors.primary, borderColor: colors.primary },
  followText: { color: colors.textOnPrimary, fontSize: 13, fontWeight: "700" },
});
