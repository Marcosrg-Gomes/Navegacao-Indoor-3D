import React from "react";
import { Stack } from "expo-router";
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
export default function RootLayout() {
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
