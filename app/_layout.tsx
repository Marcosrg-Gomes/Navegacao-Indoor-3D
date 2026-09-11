import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationProvider } from "@/context/NavigationContext";

/**
 * Layout raiz da aplicação.
 * Envolve toda a árvore com SafeAreaProvider e NavigationProvider
 * para que qualquer tela tenha acesso ao contexto de navegação indoor.
 */
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <NavigationProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
      </NavigationProvider>
    </SafeAreaProvider>
  );
}
