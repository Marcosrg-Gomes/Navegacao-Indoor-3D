import React from "react";
import { Tabs } from "expo-router";
import { Text, StyleSheet } from "react-native";
import { colors } from "@/constants/colors";

/**
 * Layout de abas com 3 tabs: Mapa, Scan e Explorar.
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: "#1a2332",
        },
        headerTintColor: "#ffffff",
        headerTitleStyle: {
          fontWeight: "700",
          fontSize: 17,
        },
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Mapa",
          headerTitle: "Navegação Indoor",
          tabBarIcon: ({ color }) => (
            <Text style={[styles.tabIcon, { color }]}>🗺️</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: "Scan",
          headerTitle: "Escanear QR Code",
          tabBarIcon: ({ color }) => (
            <Text style={[styles.tabIcon, { color }]}>📷</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explorar",
          headerTitle: "Pontos de Interesse",
          tabBarIcon: ({ color }) => (
            <Text style={[styles.tabIcon, { color }]}>📋</Text>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: 60,
    paddingBottom: 6,
    paddingTop: 6,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  tabIcon: {
    fontSize: 22,
  },
});
