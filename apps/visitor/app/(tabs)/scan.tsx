import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { resolveQrCode } from "@/services/api";
import { useNavigation } from "@/context/NavigationContext";
import { colors } from "@/constants/colors";
import {
  DsButton,
  DsError,
  DsLabel,
  DsLoading,
  DsSearch,
} from "@/components/DesignSystem";

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const locked = useRef(false);
  const resolving = useRef(false);
  const focused = useIsFocused();
  const focusedRef = useRef(focused);
  const mounted = useRef(true);
  focusedRef.current = focused;
  const nav = useNavigation();
  const router = useRouter();

  useEffect(() => {
    if (focused && !resolving.current) locked.current = false;
  }, [focused]);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; focusedRef.current = false; };
  }, []);

  async function scan(data: string) {
    if (resolving.current || locked.current || !data.trim()) return;
    resolving.current = true;
    locked.current = true;
    setBusy(true);
    setError(null);
    try {
      const result = await resolveQrCode(data);
      if (!mounted.current || !focusedRef.current) return;
      await nav.setOriginNode(result.no, "qr");
      if (!mounted.current || !focusedRef.current) return;
      router.replace("/map");
    } catch (err) {
      if (mounted.current) setError(err instanceof Error ? err.message : "QR Code não reconhecido.");
    } finally {
      resolving.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  function submitManualToken() {
    if (resolving.current) return;
    locked.current = false;
    void scan(token);
  }

  return (
    <ScrollView
      role="main"
      accessibilityLabel="Ler QR Code e definir localização"
      contentContainerStyle={styles.screen}
      keyboardShouldPersistTaps="handled"
    >
      <Text accessibilityRole="header" style={styles.title}>Encontre sua posição</Text>
      <Text style={styles.text}>
        Aponte a câmera para um QR Code do shopping ou informe o código da placa.
      </Text>

      {focused && permission?.granted && !cameraError ? (
        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={busy ? undefined : ({ data }) => void scan(data)}
          onMountError={({ message }) => setCameraError(message)}
        />
      ) : (
        <View style={styles.cameraFallback}>
          <Text style={styles.textMuted}>
            {cameraError ||
              "A câmera precisa de permissão. Em navegador, use HTTPS ou abra o link pela câmera do celular."}
          </Text>
          {permission?.canAskAgain === false && (
            <Text style={styles.textMuted}>
              Abra as configurações do navegador ou do aplicativo, procure
              Permissões e permita o uso da câmera. Você também pode digitar o
              código abaixo ou definir sua localização no mapa.
            </Text>
          )}
          {cameraError && (
            <DsButton variant="outline" onPress={() => setCameraError(null)} style={styles.retryButton}>
              Tentar câmera novamente
            </DsButton>
          )}
          {!cameraError && !permission?.granted && permission?.canAskAgain !== false && (
            <DsButton
              variant="secondary"
              onPress={() => void requestPermission().catch(() => setCameraError("Não foi possível acessar a câmera."))}
              style={styles.permissionButton}
            >
              Permitir acesso à câmera
            </DsButton>
          )}
        </View>
      )}

      <DsLabel>Código ou link do QR</DsLabel>
      <DsSearch
        value={token}
        onChangeText={setToken}
        placeholder="ENTRADA-PRINCIPAL"
        accessibilityLabel="Código ou link do QR"
      />
      <DsButton
        variant="primary"
        disabled={busy || !token.trim()}
        onPress={submitManualToken}
        loading={busy}
      >
        Usar código
      </DsButton>

      {busy && <DsLoading message="Consultando QR Code…" />}
      {error && (
        <DsError message={error} onRetry={() => { locked.current = false; setError(null); }} />
      )}

      <TouchableOpacity
        accessibilityRole="button"
        style={styles.linkRow}
        onPress={() => router.replace("/(tabs)/?manualOrigin=1")}
      >
        <Text style={styles.linkText}>Selecionar ponto de partida manualmente</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    padding: 20,
    gap: 14,
    backgroundColor: colors.bg,
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: 0.4,
  },
  text: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  textMuted: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  camera: {
    height: 260,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#000000",
  },
  cameraFallback: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  retryButton: {
    alignSelf: "flex-start",
  },
  permissionButton: {
    alignSelf: "flex-start",
    marginTop: 6,
  },
  linkRow: {
    paddingTop: 4,
  },
  linkText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
});