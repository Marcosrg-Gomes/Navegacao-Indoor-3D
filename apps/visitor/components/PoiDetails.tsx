import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getStatusOperacional, type Loja } from "@/types";
import { colors } from "@/constants/colors";
import { PoiStatus } from "@/components/PoiStatus";
import { useVisitorPreferences } from "@/context/VisitorPreferences";
import { useNavigation } from "@/context/NavigationContext";
import { AccessibleSheet } from "./AccessibleSheet";
import { PlaceIdentity } from "./PlaceIdentity";

export function PoiDetails({ poi, onClose, onNavigate }: {
  poi: Loja | null; onClose: () => void; onNavigate: (poi: Loja) => void;
}) {
  const { shopping, originNode, graph, floors, route } = useNavigation();
  const router = useRouter();
  const saved = useVisitorPreferences();
  const status = poi ? getStatusOperacional(poi) : "aberto";
  const favorite = !!poi && !!shopping && (saved.data.favorites[shopping.codigo] || []).includes(`poi:${poi.codigo}`);
  const node = graph?.nos.find((item) => item.id === poi?.no_id) || route?.nos.find((item) => item.id === poi?.no_id);
  const floor = floors.find((item) => item.id === node?.piso_id);
  return <AccessibleSheet visible={!!poi} title={poi?.nome || "Detalhes do local"} onClose={onClose}
    footer={<><TouchableOpacity accessibilityRole="button" style={styles.primary} onPress={() => poi && onNavigate(poi)}>
      <Text style={styles.primaryText}>{status === "aberto" ? "Traçar rota" : "Ver trajeto mesmo assim"}</Text>
    </TouchableOpacity><TouchableOpacity accessibilityRole="button" style={styles.close} onPress={onClose}><Text style={styles.link}>Fechar detalhes</Text></TouchableOpacity></>}>
    {poi && <>
      <View style={styles.identity}><PlaceIdentity name={poi.nome} code={poi.codigo} logo={poi.logo_url} size={64} /><View style={{ flex: 1, gap: 8 }}>
        <Text style={styles.text}>{poi.categoria_nome || "Serviço"}{floor ? ` · ${floor.nome}` : ""}</Text><PoiStatus status={status} />
      </View></View>
      {originNode?.id === poi.no_id && <Text style={styles.text}>Você está aqui</Text>}
      {status !== "aberto" && <Text style={styles.warning} accessibilityRole="alert">Este local está {status === "fechado" ? "fechado" : "em manutenção"}. Você pode consultar o trajeto, mas o atendimento está indisponível.</Text>}
      {status !== "aberto" && poi.categoria_nome && <TouchableOpacity accessibilityRole="button" style={styles.close} onPress={() => { onClose(); router.push({ pathname: "/explore", params: { category: poi.categoria_nome!, status: "aberto" } }); }}><Text style={styles.link}>Ver alternativas abertas em {poi.categoria_nome}</Text></TouchableOpacity>}
      {poi.descricao && <Text style={styles.text}>{poi.descricao}</Text>}
      {poi.horario_resumo && <Text style={styles.text}>{poi.horario_resumo}</Text>}
      {poi.horario_funcionamento && <Text style={styles.text}>Horário cadastrado: {poi.horario_funcionamento}</Text>}
      {poi.telefone && <Text style={styles.text}>Telefone: {poi.telefone}</Text>}
      {shopping && <TouchableOpacity accessibilityRole="button" accessibilityState={{ selected: favorite, disabled: !saved.ready }} disabled={!saved.ready} style={styles.close}
        onPress={() => saved.toggleFavorite(shopping.codigo, `poi:${poi.codigo}`)}><Text style={styles.link}>{favorite ? "Remover dos favoritos" : "Salvar nos favoritos"}</Text></TouchableOpacity>}
    </>}
  </AccessibleSheet>;
}
const styles = StyleSheet.create({
  identity: { flexDirection: "row", gap: 16, alignItems: "center" },
  text: { color: colors.text, fontSize: 16, lineHeight: 25 },
  warning: { backgroundColor: colors.warningSoft, color: colors.warning, padding: 14, fontSize: 16, lineHeight: 24 },
  primary: { backgroundColor: colors.primary, padding: 14, minHeight: 48, alignItems: "center" },
  primaryText: { color: "white", fontWeight: "600", fontSize: 16 },
  close: { alignItems: "center", justifyContent: "center", padding: 10, minHeight: 44 },
  link: { color: colors.primary, fontSize: 15, fontWeight: "600" },
});
