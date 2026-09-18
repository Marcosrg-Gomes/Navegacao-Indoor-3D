import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { listPois } from "@/services/api";
import { useNavigation } from "@/context/NavigationContext";
import { getStatusOperacional, STATUS_OPERACIONAL_LABEL, type Loja } from "@/types";
import { PoiDetails } from "@/components/PoiDetails";
import { colors } from "@/constants/colors";

/** Categorias para filtro via chips (corresponde ao backend Categoria) */

/**
 * Tela de listagem de POIs/lojas.
 * Exibe nome, categoria, descrição, horário e status operacional.
 * Permite filtrar por categoria e navegar ao destino ao tocar.
 */
export default function ExploreScreen() {
  const [pois, setPois] = useState<Loja[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<Loja | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(
    undefined
  );
  const { shopping, originNode, setDestinationLoja } = useNavigation();
  const router = useRouter();

  const loadPois = useCallback(async () => {
    if (!shopping) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const data = await listPois({ shopping_id: shopping.id });
      setPois(data);
    } catch (err) {
      setPois([]);
      setError(err instanceof Error ? err.message : "Não foi possível carregar os destinos.");
    } finally {
      setLoading(false);
    }
  }, [shopping?.id]);

  useEffect(() => {
    setSelectedCategory(undefined);
    void loadPois();
  }, [loadPois]);

  const categories: { label: string; id: number | undefined }[] = [{ label: "Todas", id: undefined },
    ...Array.from(new Map(pois.filter((p) => p.categoria_id != null).map((p) =>
      [p.categoria_id!, { label: p.categoria_nome || "Categoria " + p.categoria_id, id: p.categoria_id! }])).values())];

  const handleSelectPoi = useCallback(
    async (loja: Loja) => {
      setDetail(null);
      await setDestinationLoja(loja);
      router.replace(originNode ? "/(tabs)/" : "/(tabs)/?manualOrigin=1");
    },
    [setDestinationLoja, router]
  );

  return (
    <View style={styles.container}>
      {/* Filtros de categoria */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            accessibilityRole="button"
            key={cat.label}
            style={[
              styles.chip,
              selectedCategory === cat.id && styles.chipActive,
            ]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Text
              style={[
                styles.chipText,
                selectedCategory === cat.id && styles.chipTextActive,
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {error && <View style={styles.center} accessibilityRole="alert"><Text>{error}</Text>
        <TouchableOpacity accessibilityRole="button" onPress={() => void loadPois()}><Text style={styles.cardActionText}>Tentar novamente</Text></TouchableOpacity></View>}
      {/* Lista de POIs */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={pois.filter((item) => selectedCategory === undefined || item.categoria_id === selectedCategory)}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyIcon}>🏬</Text>
              <Text style={styles.emptyText}>
                Nenhum ponto de interesse encontrado.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              accessibilityRole="button"
              style={styles.card}
              onPress={() => setDetail(item)}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardName} numberOfLines={1}>
                    {item.nome}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      getStatusOperacional(item) === "aberto"
                        ? styles.statusOpen
                        : styles.statusClosed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        getStatusOperacional(item) === "aberto"
                          ? styles.statusTextOpen
                          : styles.statusTextClosed,
                      ]}
                    >
                      {STATUS_OPERACIONAL_LABEL[getStatusOperacional(item)]}
                    </Text>
                  </View>
                </View>
                {item.categoria_nome && (
                  <Text style={styles.cardCategory}>
                    {item.categoria_nome}
                  </Text>
                )}
              </View>

              {item.descricao && (
                <Text style={styles.cardDescription} numberOfLines={2}>
                  {item.descricao}
                </Text>
              )}

              <View style={styles.cardFooter}>
                {item.horario_funcionamento && (
                  <Text style={styles.cardSchedule}>
                    🕐 {item.horario_funcionamento}
                  </Text>
                )}
                {item.telefone && (
                  <Text style={styles.cardPhone}>
                    📞 {item.telefone}
                  </Text>
                )}
              </View>

              <View style={styles.cardAction}>
                <Text style={styles.cardActionText}>
                  {originNode
                    ? "Navegar até aqui →"
                    : "Definir como destino →"}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
      <PoiDetails poi={detail} onClose={() => setDetail(null)} onNavigate={(p) => void handleSelectPoi(p)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  filterScroll: {
    maxHeight: 52,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
  },
  chipTextActive: {
    color: "#ffffff",
  },
  listContent: {
    padding: 16,
    gap: 12,
    flexGrow: 1,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    marginBottom: 8,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
  },
  cardCategory: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600",
    marginTop: 3,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 8,
  },
  statusOpen: {
    backgroundColor: colors.success + "18",
  },
  statusClosed: {
    backgroundColor: colors.danger + "18",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  statusTextOpen: {
    color: colors.success,
  },
  statusTextClosed: {
    color: colors.danger,
  },
  cardDescription: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 10,
  },
  cardSchedule: {
    fontSize: 12,
    color: colors.textMuted,
  },
  cardPhone: {
    fontSize: 12,
    color: colors.textMuted,
  },
  cardAction: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  cardActionText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: "center",
  },
});
