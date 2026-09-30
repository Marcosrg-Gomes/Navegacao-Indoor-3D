import React from "react";
import { Tabs } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { WayfindingIcon } from "@/components/WayfindingIcon";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/constants/colors";
import { useNavigation } from "@/context/NavigationContext";
import { VisitorTabBar } from "@/components/VisitorTabBar";

/** Quatro destinos estáveis, com rótulos legíveis e área segura no celular. */
export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { shopping, floor } = useNavigation();
  return (
    <Tabs
      tabBar={(props) => <VisitorTabBar {...props} />}
      screenOptions={{
        header: () => <View style={[styles.brand, { paddingTop: insets.top + 10 }]}><View style={styles.brandMark} /><Text style={styles.brandName}>{shopping?.nome || "Guia do shopping"}</Text><Text style={styles.brandCaption}>{floor?.nome || "Bem-vindo"}</Text></View>,
        headerStyle: {
          backgroundColor: colors.primaryDark,
        },
        headerTintColor: "#ffffff",
        headerTitleStyle: {
          fontWeight: "500",
          fontSize: 17,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Início",
          headerTitle: "Navegação Indoor",
          tabBarIcon: ({ color }) => (
            <WayfindingIcon name="home" color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "Mapa",
          headerTitle: "Mapa do shopping",
          tabBarIcon: ({ color }) => <WayfindingIcon name="map" color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: "Ler QR",
          tabBarAccessibilityLabel: "Ler QR Code",
          headerTitle: "Escanear QR Code",
          tabBarIcon: ({ color }) => (
            <WayfindingIcon name="scan" color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explorar",
          headerTitle: "Explorar o shopping",
          tabBarIcon: ({ color }) => (
            <WayfindingIcon name="explore" color={color} size={24} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  brand: { minHeight: 54, paddingHorizontal: 18, paddingBottom: 10, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.bg, borderBottomWidth: 1, borderBottomColor: colors.border },
  brandMark: { width: 8, height: 25, borderRadius: 4, backgroundColor: colors.sun },
  brandName: { color: colors.text, fontSize: 17, fontWeight: "700", flex: 1 },
  brandCaption: { color: colors.textMuted, fontSize: 14, fontWeight: "600" },
});
