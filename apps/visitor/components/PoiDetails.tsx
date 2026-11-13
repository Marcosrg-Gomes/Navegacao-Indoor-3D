import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getStatusOperacional, type Loja } from "@/types";
import { colors } from "@/constants/colors";
import { PoiStatus } from "@/components/PoiStatus";
import { useVisitorPreferences } from "@/context/VisitorPreferences";
import { useNavigation } from "@/context/NavigationContext";
import { AccessibleSheet } from "./AccessibleSheet";
import { PlaceIdentity } from "./PlaceIdentity";
import { DsButton } from "@/components/DesignSystem";

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
    footer={<><DsButton variant="primary" onPress={() => poi && onNavigate(poi)}>
      {status === "aberto" ? "Traçar rota" : "Ver trajeto mesmo assim"}
    </DsButton><DsButton variant="outline" onPress={onClose}>
      Fechar detalhes
    </DsButton></>}>
    {poi && <>
      <View style={styles.identity}><PlaceIdentity name={poi.nome} code={poi.codigo} logo={poi.logo_url} size={64} /><View style={{ flex: 1, gap: 8 }}>
        <Text style={styles.text}>{poi.categoria_nome || "Serviço"}{floor ? ` · ${floor.nome}` : ""}</Text><PoiStatus status={status} />
      </View></View>
      {originNode?.id === poi.no_id && <Text style={styles.text}>Você está aqui</Text>}
      {status !== "aberto" && <Text style={styles.warning} accessibilityRole="alert">Este local está {status === "fechado" ? "fechado" : "em manutenção"}. Você pode consultar o trajeto, mas o atendimento está indisponível.</Text>}
      {status !== "aberto" && poi.categoria_nome && <DsButton variant="outline" onPress={() => { onClose(); router.push({ pathname: "/explore", params: { category: poi.categoria_nome!, status: "aberto" } }); }}>
        Ver alternativas abertas em {poi.categoria_nome}
      </DsButton>}
      {poi.descricao && <Text style={styles.text}>{poi.descricao}</Text>}
      {poi.horario_resumo && <Text style={styles.text}>{poi.horario_resumo}</Text>}
      {poi.horario_funcionamento && <Text style={styles.text}>Horário cadastrado: {poi.horario_funcionamento}</Text>}
      {poi.telefone && <Text style={styles.text}>Telefone: {poi.telefone}</Text>}
      {shopping && <DsButton variant={favorite ? "outline" : "ghost"} disabled={!saved.ready} onPress={() => saved.toggleFavorite(shopping.codigo, `poi:${poi.codigo}`)}>
        {favorite ? "Remover dos favoritos" : "Salvar nos favoritos"}
      </DsButton>}
    </>}
  </AccessibleSheet>;
}
const styles = StyleSheet.create({
  identity: { flexDirection: "row", gap: 16, alignItems: "center" },
  text: { color: colors.text, fontSize: 16, lineHeight: 25 },
  warning: { backgroundColor: colors.warningSoft, color: colors.warning, padding: 14, fontSize: 16, lineHeight: 24 },
});
