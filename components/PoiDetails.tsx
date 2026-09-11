import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getStatusOperacional, STATUS_OPERACIONAL_LABEL, type Loja } from "@/types";
import { colors } from "@/constants/colors";

export function PoiDetails({ poi, onClose, onNavigate }: {
  poi: Loja | null;
  onClose: () => void;
  onNavigate: (poi: Loja) => void;
}) {
  if (!poi) return null;
  const status = getStatusOperacional(poi);
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card} accessibilityViewIsModal>
          <ScrollView>
            <Text style={styles.title}>{poi.nome}</Text>
            <Text style={styles.text}>{poi.categoria_nome || "Serviço"}</Text>
            <Text style={[styles.status, { color: status === "aberto" ? colors.success : colors.danger }]}>
              {STATUS_OPERACIONAL_LABEL[status]}
            </Text>
            {status !== "aberto" && (
              <Text style={styles.warning} accessibilityRole="alert">
                Este local está {status === "fechado" ? "fechado" : "em manutenção"}. Você pode consultar o trajeto, mas o atendimento está indisponível.
              </Text>
            )}
            <Text style={styles.text}>{poi.descricao || "Descrição não informada."}</Text>
            <Text style={styles.text}>Horário: {poi.horario_funcionamento || "não informado"}</Text>
            {poi.telefone && <Text style={styles.text}>Telefone: {poi.telefone}</Text>}
            <TouchableOpacity accessibilityRole="button" style={styles.primary} onPress={() => onNavigate(poi)}>
              <Text style={styles.primaryText}>{status === "aberto" ? "Traçar rota" : "Ver trajeto mesmo assim"}</Text>
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" style={styles.close} onPress={onClose}>
              <Text style={styles.text}>Fechar detalhes</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "#0008", justifyContent: "flex-end", alignItems: "center" },
  card: { backgroundColor: colors.surface, padding: 24, width: "100%", maxWidth: 640, maxHeight: "85%", borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  title: { fontSize: 23, fontWeight: "700", color: colors.text },
  text: { color: colors.text, fontSize: 15, marginVertical: 6 },
  status: { fontWeight: "700", marginVertical: 10 },
  warning: { backgroundColor: "#fff3cd", color: "#704f00", padding: 12, borderRadius: 8, marginBottom: 12 },
  primary: { backgroundColor: colors.primary, padding: 14, borderRadius: 10, alignItems: "center", marginTop: 16 },
  primaryText: { color: "white", fontWeight: "700" },
  close: { alignItems: "center", padding: 10 },
});
