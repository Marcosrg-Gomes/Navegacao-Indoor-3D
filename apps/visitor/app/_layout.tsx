import React, { useEffect } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { plexFontAssets } from "@/constants/fontAssets";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationProvider } from "@/context/NavigationContext";
import { VisitorPreferencesProvider } from "@/context/VisitorPreferences";
import { FocusStyles } from "@/components/FocusStyles";
import { VisitPlanProvider } from "@/context/VisitPlan";

/**
 * Layout raiz da aplicação.
 * Envolve toda a árvore com SafeAreaProvider e NavigationProvider
 * para que qualquer tela tenha acesso ao contexto de navegação indoor.
 */
// Mantém a splash até as fontes estarem prontas: a interface nunca aparece com outra fonte.
void SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(plexFontAssets);
  const ready = fontsLoaded || !!fontError;
  useEffect(() => { if (ready) void SplashScreen.hideAsync().catch(() => undefined); }, [ready]);
  // Falha no carregamento não bloqueia o app: segue com a fonte do sistema.
  if (!ready) return null;
  return (
    <SafeAreaProvider>
      <FocusStyles />
      <VisitorPreferencesProvider><NavigationProvider><VisitPlanProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
      </VisitPlanProvider></NavigationProvider></VisitorPreferencesProvider>
    </SafeAreaProvider>
  );
}
