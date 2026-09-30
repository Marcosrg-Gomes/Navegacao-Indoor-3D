import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AccessibleSheet } from "./AccessibleSheet";
import { colors } from "@/constants/colors";
import { useVisitorPreferences } from "@/context/VisitorPreferences";

export function FirstVisitHelp({ onOpen }: { onOpen: () => void }) {
  const { data, ready, dismissHelp } = useVisitorPreferences();
  if (!ready || data.helpSeen) return null;
  return <View style={styles.intro}>
    <Text style={styles.title}>Primeira vez por aqui?</Text>
    <Text style={styles.text}>Defina sua posição e escolha um destino. Abra a ajuda para conhecer os controles do mapa.</Text>
    <View style={styles.row}>
      <TouchableOpacity accessibilityRole="button" style={styles.button} onPress={onOpen}><Text style={styles.link}>Como usar o mapa</Text></TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" style={styles.button} onPress={dismissHelp}><Text style={styles.link}>Entendi</Text></TouchableOpacity>
    </View>
  </View>;
}

export function MapHelp({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return <AccessibleSheet visible={visible} title="Ajuda para se localizar" onClose={onClose}
    footer={<TouchableOpacity accessibilityRole="button" style={styles.close} onPress={onClose}><Text style={{ color: "white", fontWeight: "600" }}>Fechar ajuda</Text></TouchableOpacity>}>
        {[
          ["1. Defina sua posição", "Leia um QR Code do shopping ou selecione o ponto onde você está. A tela mostra o piso e o horário da última confirmação."],
          ["2. Explore o mapa", "Arraste com um dedo ou o botão esquerdo. Aproxime com pinça, roda do mouse ou + e −. Minha posição volta ao ponto registrado; Ver piso inteiro restaura a vista. Com o mapa em foco, use as setas do teclado."],
          ["3. Escolha a visualização", Platform.OS === "web" ? "Use Mapa 2D para ver a planta ou Mapa 3D para ver os volumes. No 3D, abra Mais controles para usar a vista superior e girar. Se o 3D falhar, continue no 2D." : "No aplicativo móvel, a planta 2D permite explorar os espaços com arraste e zoom."],
          ["4. Siga o trajeto", "O próximo passo aparece em destaque. Avance as instruções conforme caminhar; isso apenas muda a instrução exibida. Para atualizar sua localização, leia um QR ou confirme a chegada ao destino."],
          ["5. Mudança de piso", "A instrução indica o elevador ou a escada e o piso de destino. Você pode abrir o trecho desse piso. Confirmar a chegada também atualiza o piso automaticamente."],
          ["6. Rota sem escadas", "Usa caminhos cadastrados como acessíveis e elevadores. Evita escadas e escadas rolantes; pode ser mais longa. Um bloqueio pode impedir o trajeto."],
          ["7. Guarde seus lugares", "No Explorar, busque por nome ou categoria, filtre serviços e ordene por distância. Marque favoritos e reveja destinos recentes. Os dados ficam neste aparelho."],
        ].map(([title, description]) => <View key={title} style={{ gap: 5 }}><Text accessibilityRole="header" {...(Platform.OS === "web" ? { "aria-level": 3 } : {})} style={styles.title}>{title}</Text><Text style={styles.text}>{description}</Text></View>)}
  </AccessibleSheet>;
}
const styles = StyleSheet.create({
  intro: { borderLeftWidth: 3, borderLeftColor: colors.primary, padding: 14, backgroundColor: colors.primarySoft, gap: 8 },
  title: { color: colors.text, fontSize: 16, fontWeight: "600" },
  heading: { color: colors.text, fontSize: 24, fontWeight: "600" },
  text: { color: colors.textMuted, fontSize: 14, lineHeight: 22 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  button: { minHeight: 44, justifyContent: "center", paddingHorizontal: 6 },
  link: { color: colors.primary, fontWeight: "600" },
  backdrop: { flex: 1, justifyContent: "flex-end", alignItems: "center", backgroundColor: "#0008" },
  sheet: { maxHeight: "90%", width: "100%", maxWidth: 640, padding: 20, backgroundColor: colors.surface, gap: 16, borderTopLeftRadius: 14, borderTopRightRadius: 14 },
  close: { minHeight: 48, justifyContent: "center", alignItems: "center", backgroundColor: colors.primary, borderRadius: 6, padding: 12 },
});
