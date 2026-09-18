import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { listPois } from "@/services/api";
import {
  getStatusOperacional,
  STATUS_OPERACIONAL_LABEL,
  type Loja,
} from "@/types";
import { colors } from "@/constants/colors";

type SearchBarProps = {
  /** Chamado quando o usuário seleciona um POI da lista de sugestões. */
  onSelect: (loja: Loja) => void | Promise<void>;
  /** Limita resultados ao shopping da origem, conforme RN04. */
  shoppingId?: number;
  placeholder?: string;
};

/**
 * Busca incremental por POIs e categorias, com debounce e proteção contra
 * respostas fora de ordem. A API fornece a correspondência parcial.
 */
export function SearchBar({
  onSelect,
  shoppingId,
  placeholder = "Buscar loja, serviço ou categoria…",
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Loja[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);
  const selectionRef = useRef<string | null>(null);

  const search = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (selectionRef.current === text) return;
      if (trimmed.length < 2) {
        setLoading(false);
        setResults([]);
        setShowResults(false);
        setError(null);
        return;
      }

      const requestId = ++requestIdRef.current;
      setLoading(true);
      setError(null);
      setShowResults(true);
      try {
        const data = await listPois({
          q: trimmed,
          ...(shoppingId !== undefined ? { shopping_id: shoppingId } : {}),
        });
        if (requestId !== requestIdRef.current) return;
        setResults(data);
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        setResults([]);
        setError(
          err instanceof Error
            ? err.message
            : "Não foi possível buscar destinos."
        );
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    },
    [shoppingId]
  );

  useEffect(() => {
    requestIdRef.current += 1;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void search(query);
    }, 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, search]);

  const handleSelect = async (loja: Loja) => {
    selectionRef.current = loja.nome;
    requestIdRef.current += 1;
    setLoading(false);
    setQuery(loja.nome);
    setShowResults(false);
    await onSelect(loja);
  };

  const clearSearch = () => {
    selectionRef.current = null;
    requestIdRef.current += 1;
    setQuery("");
    setResults([]);
    setShowResults(false);
    setError(null);
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <Text accessible={false} style={styles.icon}>
          🔍
        </Text>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={(value) => { selectionRef.current = null; setQuery(value); }}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          returnKeyType="search"
          autoCorrect={false}
          accessibilityLabel="Buscar destinos"
          accessibilityHint="Digite pelo menos duas letras para ver sugestões"
        />
        {query.length > 0 && (
          <TouchableOpacity
            onPress={clearSearch}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Limpar busca"
          >
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading && (
        <View style={styles.loadingBar} accessibilityLabel="Buscando destinos">
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}

      {showResults && (
        <View style={styles.resultsContainer}>
          {error ? (
            <View style={styles.feedback}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                onPress={() => void search(query)}
                accessibilityRole="button"
                accessibilityLabel="Tentar buscar novamente"
              >
                <Text style={styles.retryText}>Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={results}
              keyExtractor={(item) => String(item.id)}
              keyboardShouldPersistTaps="handled"
              style={styles.resultsList}
              ListEmptyComponent={
                !loading ? (
                  <Text style={styles.emptyText}>
                    Nenhum destino encontrado para “{query.trim()}”.
                  </Text>
                ) : null
              }
              renderItem={({ item }) => {
                const status = getStatusOperacional(item);
                return (
                  <TouchableOpacity
                    style={styles.resultItem}
                    onPress={() => void handleSelect(item)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`${item.nome}, ${STATUS_OPERACIONAL_LABEL[status]}`}
                    accessibilityHint="Seleciona este destino para calcular a rota"
                  >
                    <View style={styles.resultRow}>
                      <Text style={styles.resultName} numberOfLines={1}>
                        {item.nome}
                      </Text>
                      {status !== "aberto" && (
                        <View
                          style={[
                            styles.unavailableBadge,
                            status === "manutencao"
                              ? styles.maintenanceBadge
                              : styles.closedBadge,
                          ]}
                        >
                          <Text
                            style={[
                              styles.unavailableText,
                              status === "manutencao"
                                ? styles.maintenanceText
                                : styles.closedText,
                            ]}
                          >
                            {STATUS_OPERACIONAL_LABEL[status]}
                          </Text>
                        </View>
                      )}
                    </View>
                    {item.categoria_nome && (
                      <Text style={styles.resultCategory}>
                        {item.categoria_nome}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 0,
  },
  clearIcon: {
    fontSize: 16,
    color: colors.textMuted,
    paddingLeft: 8,
  },
  loadingBar: {
    minHeight: 28,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  resultsContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 220,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultsList: {
    borderRadius: 12,
  },
  resultItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  resultName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
    flex: 1,
  },
  resultCategory: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  unavailableBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  closedBadge: {
    backgroundColor: colors.danger + "20",
  },
  maintenanceBadge: {
    backgroundColor: colors.warning + "24",
  },
  unavailableText: {
    fontSize: 11,
    fontWeight: "600",
  },
  closedText: {
    color: colors.danger,
  },
  maintenanceText: {
    color: "#a16207",
  },
  feedback: {
    padding: 16,
    gap: 8,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    textAlign: "center",
  },
  retryText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  emptyText: {
    padding: 16,
    color: colors.textMuted,
    fontSize: 13,
    textAlign: "center",
  },
});
