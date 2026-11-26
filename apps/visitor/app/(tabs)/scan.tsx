import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, ActivityIndicator, Linking, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Text, TextInput } from "@/components/AppText";
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

/** Detecta se o navegador bloqueou câmera por HTTP (IP local, não HTTPS). */
function useInsecureContext() {
  if (Platform.OS !== "web" || typeof window === "undefined") return false;
  return !window.isSecureContext && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1";
}

export default function ScanScreen() {

  const [permission, requestPermission] = useCameraPermissions();
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const insecureCtx = useInsecureContext();

  const locked = useRef(false);
  const unlockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    return () => { mounted.current = false; focusedRef.current = false; if (unlockTimer.current) clearTimeout(unlockTimer.current); };
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
      if (mounted.current) {
        const message = err instanceof Error ? err.message : "QR Code não reconhecido.";
        setError(message);
        if (Platform.OS !== "web") AccessibilityInfo.announceForAccessibility(message);
        // Libera a câmera para outra leitura após uma pausa curta (evita repetir o mesmo código em sequência).
        if (unlockTimer.current) clearTimeout(unlockTimer.current);
        unlockTimer.current = setTimeout(() => { if (!resolving.current) locked.current = false; }, 1500);
      }
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
      // iOS: rola o campo do código para cima do teclado virtual.
      automaticallyAdjustKeyboardInsets
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
          {insecureCtx ? (
            <>
              <Text style={styles.textMuted}>
                📵 Navegadores bloqueiam a câmera em conexões HTTP (IP local).{"\n"}
                Use a câmera do celular para escanear a placa — ela abre o link direto — ou escolha um ponto de entrada abaixo:
              </Text>
              <View style={styles.qrShortcuts}>
                {[
                  { label: "Entrada Principal", code: "MINI-ENTRADA-PRINCIPAL" },
                  { label: "Praça Alimentação", code: "MINI-PRACA-ALIMENTACAO" },
                  { label: "Elevador Térreo", code: "MINI-ELEVADOR-TERREO" },
                  { label: "Escada Rolante", code: "MINI-ESCADA-ROLANTE" },
                ].map(({ label, code }) => (
                  <TouchableOpacity key={code} accessibilityRole="button" accessibilityLabel={`Entrar por ${label}`}
                    style={styles.qrChip} onPress={() => void scan(code)}>
                    <Text style={styles.qrChipText}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : (
            <>
              <Text style={styles.textMuted}>
                {cameraError || (Platform.OS === "web"
                  ? "A câmera precisa de permissão. Em navegador, use HTTPS ou abra o link pela câmera do celular."
                  : "Permita o uso da câmera para ler o QR Code da placa mais próxima.")}
              </Text>
              {permission?.canAskAgain === false && (
                <Text style={styles.textMuted}>
                  Abra as configurações do navegador ou do aplicativo, procure
                  Permissões e permita o uso da câmera. Você também pode digitar o
                  código abaixo ou definir sua localização no mapa.
                </Text>
              )}
              {permission?.canAskAgain === false && Platform.OS !== "web" && (
                <DsButton variant="outline" onPress={() => void Linking.openSettings()} style={styles.retryButton}
                  accessibilityHint="Abre as configurações do aplicativo para permitir a câmera">
                  Abrir configurações
                </DsButton>
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
            </>
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

/** Detecta se o navegador bloqueou câmera por HTTP (IP local, não HTTPS). */
function useInsecureContext() {
  if (Platform.OS !== "web" || typeof window === "undefined") return false;
  return !window.isSecureContext && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1";
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