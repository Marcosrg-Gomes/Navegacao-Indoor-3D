import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { getAssetUrl } from "@/services/api";
import { colors } from "@/constants/colors";
import { WayfindingIcon } from "./WayfindingIcon";

/** Existing registered logos only; unavailable artwork has a neutral sign fallback. */
export function PlaceIdentity({ name, logo, code, type = "loja", size = 52 }: { name: string; code?: string; logo?: string | null; type?: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [logo]);
  const uri = getAssetUrl(logo);
  return <View style={[styles.sign, { width: size, height: size }]} accessible={false} importantForAccessibility="no-hide-descendants">
    {uri && !failed ? <Image source={{ uri }} style={{ width: size - 8, height: size - 8 }} resizeMode="contain" onError={() => setFailed(true)} accessible={false} />
      : type === "loja" ? <Text style={styles.initial}>{code || "↗"}</Text>
        : <WayfindingIcon name={type === "entrada" || type === "saida" ? "arrow" : type === "elevador" ? "lift" : "service"} size={26} color={colors.primary} />}
  </View>;
}
const styles = StyleSheet.create({ sign: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderBottomWidth: 3, borderBottomColor: colors.accent, alignItems: "center", justifyContent: "center", flexShrink: 0 }, initial: { color: colors.primaryDark, fontFamily: "monospace", fontSize: 18 } });
