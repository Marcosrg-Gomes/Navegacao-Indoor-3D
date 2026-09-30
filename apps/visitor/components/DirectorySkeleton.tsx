import { StyleSheet, View } from "react-native";
import { colors } from "@/constants/colors";

export function DirectorySkeleton() {
  return <View accessibilityRole="progressbar" accessibilityLabel="Carregando lojas e serviços" accessibilityState={{ busy: true }} style={{ gap: 12 }}>
    {[0, 1, 2].map((item) => <View key={item} style={styles.card} accessible={false}>
      <View style={[styles.line, { width: "45%", height: 12 }]} /><View style={[styles.line, { width: "70%", height: 24 }]} />
      <View style={[styles.line, { width: "35%", height: 38, alignSelf: "flex-end" }]} />
    </View>)}
  </View>;
}
const styles = StyleSheet.create({
  card: { padding: 18, gap: 20, borderRadius: 8, backgroundColor: colors.surface },
  line: { backgroundColor: colors.border, borderRadius: 4 },
});
