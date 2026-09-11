import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { resolveQrCode } from "@/services/api";
import { useNavigation } from "@/context/NavigationContext";
import { colors } from "@/constants/colors";

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const locked = useRef(false);
  const focused = useIsFocused();
  const nav = useNavigation();
  const router = useRouter();

  useEffect(() => {
    if (focused) locked.current = false;
  }, [focused]);

  async function scan(data: string) {
    if (locked.current || !data.trim()) return;
    locked.current = true;
    setBusy(true);
    setError(null);
    try {
      const result = await resolveQrCode(data);
      await nav.setOriginNode(result.no);
      router.replace("/(tabs)/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "QR Code não reconhecido.");
    } finally {
      setBusy(false);
      // A leitura repetida pela câmera fica pausada após erro até uma ação do usuário.
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Encontre sua posição</Text>
      <Text style={styles.text}>Aponte a câmera para um QR Code do shopping ou informe o código da placa.</Text>
      {focused && permission?.granted && !cameraError ? (
        <CameraView style={styles.camera} facing="back" barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={({ data }) => void scan(data)}
          onMountError={({ message }) => setCameraError(message)} />
      ) : (
        <View style={styles.card}>
          <Text style={styles.text}>{cameraError || "A câmera precisa de permissão. Em navegador, use HTTPS ou abra o link pela câmera do celular."}</Text>
          {!cameraError && !permission?.granted && permission?.canAskAgain !== false && (
            <TouchableOpacity accessibilityRole="button" style={styles.button}
              onPress={() => void requestPermission().catch(() => setCameraError("Não foi possível acessar a câmera."))}>
              <Text style={styles.buttonText}>Permitir acesso à câmera</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      <Text style={styles.text}>Código ou link do QR</Text>
      <TextInput accessibilityLabel="Código ou link do QR" style={styles.input} value={token} autoCapitalize="none"
        onChangeText={(value) => { locked.current = false; setToken(value); }} placeholder="ENTRADA-PRINCIPAL"
        onSubmitEditing={() => void scan(token)} />
      <TouchableOpacity accessibilityRole="button" style={styles.button} disabled={busy || !token.trim()}
        onPress={() => { locked.current = false; void scan(token); }}>
        <Text style={styles.buttonText}>Usar código</Text>
      </TouchableOpacity>
      {busy && <ActivityIndicator accessibilityLabel="Consultando QR Code" />}
      {error && <View style={styles.card} accessibilityRole="alert">
        <Text style={styles.error}>{error}</Text>
        <TouchableOpacity accessibilityRole="button" onPress={() => { locked.current = false; setError(null); }}>
          <Text style={styles.link}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>}
      <TouchableOpacity accessibilityRole="button" style={styles.card}
        onPress={() => router.replace("/(tabs)/?manualOrigin=1")}>
        <Text style={styles.link}>Selecionar ponto de partida manualmente</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flexGrow: 1, padding: 20, gap: 14, backgroundColor: colors.bg, width: "100%", maxWidth: 640, alignSelf: "center" },
  title: { fontSize: 22, fontWeight: "700", color: colors.text },
  text: { fontSize: 15, color: colors.text, lineHeight: 22 },
  camera: { height: 260, borderRadius: 12, overflow: "hidden" },
  card: { padding: 14, borderRadius: 10, backgroundColor: colors.surface, gap: 12 },
  button: { backgroundColor: colors.primary, padding: 14, borderRadius: 10, alignItems: "center" },
  buttonText: { color: "white", fontWeight: "700" },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 14, backgroundColor: colors.surface },
  error: { color: colors.danger, fontSize: 14 },
  link: { color: colors.primary, fontWeight: "600", padding: 8 },
});
