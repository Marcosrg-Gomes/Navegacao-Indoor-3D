import React from "react";
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
import { colors } from "@/constants/colors";

/**
 * Componentes do Design System Architectural Wayfinding.
 * Identidade: verde profundo #14332E, âmbar #E8A54B, fundo off-white #F7F5EF,
 * tipografia IBM Plex Sans.
 * Aplica hierarquia visual clara, espaçamento consistente, estados de botão
 * e contraste WCAG AA.
 */

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";

export interface DsButtonProps extends Omit<React.ComponentProps<typeof TouchableOpacity>, "style" | "accessibilityState"> {
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  minHeight?: number;
  style?: any;
  children: React.ReactNode;
}

/** Botão reutilizável com estados normal, pressionado, desabilitado e carregando. */
export function DsButton({
  variant = "primary",
  disabled = false,
  loading = false,
  minHeight = 48,
  style,
  children,
  ...rest
}: DsButtonProps) {
  const base = [
    styles.button,
    { minHeight, alignItems: "center", justifyContent: "center" },
    disabled && styles.disabled,
  ];
  let variantStyle: any = {};
  let textColor = "#ffffff";

  if (variant === "primary") {
    variantStyle = { backgroundColor: colors.primary };
    textColor = "#ffffff";
  } else if (variant === "secondary") {
    variantStyle = { backgroundColor: colors.accent };
    textColor = "#14332e";
  } else if (variant === "outline") {
    variantStyle = {
      backgroundColor: "#ffffff",
      borderWidth: 1,
      borderColor: colors.primary,
    };
    textColor = colors.primary;
  } else if (variant === "ghost") {
    variantStyle = { backgroundColor: "transparent" };
    textColor = colors.primary;
  } else if (variant === "danger") {
    variantStyle = { backgroundColor: colors.danger };
    textColor = "#ffffff";
  }

  return (
    <TouchableOpacity
      accessible={true}
      accessibilityRole="button"
      accessibilityState={{ disabled, busy: loading }}
      disabled={disabled || loading}
      style={[base, variantStyle, style]}
      {...rest}
    >
      {loading && (
        <ActivityIndicator size="small" color={textColor} style={styles.loading} />
      )}
      <Text
        style={{
          // A opacidade de `styles.disabled` já sinaliza o estado; manter a cor da variante preserva o contraste.
          color: textColor,
          fontWeight: "700",
          fontSize: 15,
          textAlign: "center",
        }}
      >
        {children}
      </Text>
    </TouchableOpacity>
  );
}

/** Campo de pesquisa com estados de foco, vazio e erro. */
export interface DsSearchProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  error?: boolean;
  onClear?: () => void;
  accessibilityLabel?: string;
}

export function DsSearch({
  value,
  onChangeText,
  placeholder = "Buscar",
  error = false,
  onClear,
  accessibilityLabel,
}: DsSearchProps) {
  return (
    <View style={[styles.searchContainer, error && styles.searchError]}>
      <TextInput
        accessibilityLabel={accessibilityLabel}
        style={[styles.searchInput, error && styles.searchInputError]}
        value={value}
        onChangeText={(text) => onChangeText(text)}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
      />
      {value.length > 0 && onClear && (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Limpar busca"
          style={styles.clearButton}
          onPress={onClear}
        >
          <Text style={styles.clearText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/** Card de superfície com borda sutil e elevação leve. */
export interface DsCardProps {
  children: React.ReactNode;
  padding?: number;
  elevated?: boolean;
  style?: any;
}

export function DsCard({ children, padding = 16, elevated = false, style }: DsCardProps) {
  return (
    <View
      style={[
        styles.card,
        elevated && styles.cardElevated,
        { padding },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** Chip/filtro com estado selecionado ou não. */
export interface DsChipProps {
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  children: React.ReactNode;
  style?: any;
}

export function DsChip({ selected = false, disabled = false, onPress, children, style }: DsChipProps) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      style={[styles.chip, selected && styles.chipSelected, disabled && styles.disabled, style]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {children}
      </Text>
    </TouchableOpacity>
  );
}

/** Seção com título e conteúdo. */
export interface DsSectionProps {
  title: string;
  children: React.ReactNode;
  style?: any;
}

export function DsSection({ title, children, style }: DsSectionProps) {
  return (
    <View style={[styles.section, style]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

/** Rótulo de texto secundário. */
export function DsLabel({ children, style }: { children: React.ReactNode; style?: any }) {
  return <Text style={[styles.label, style]}>{children}</Text>;
}

/** Texto de corpo. */
export function DsText({ children, style, muted = false }: { children: React.ReactNode; style?: any; muted?: boolean }) {
  return <Text style={[muted ? styles.textMuted : styles.text, style]}>{children}</Text>;
}

/** Estado vazio com ícone e mensagem. */
export interface DsEmptyStateProps {
  icon: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function DsEmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}: DsEmptyStateProps) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon} accessible={false}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
      {actionLabel && onAction && (
        <DsButton variant="secondary" onPress={onAction} style={styles.emptyAction}>
          {actionLabel}
        </DsButton>
      )}
    </View>
  );
}

/** Estado de carregamento. */
export function DsLoading({ message = "Carregando…" }: { message?: string }) {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );
}

/** Estado de erro. */
export interface DsErrorProps {
  message: string;
  onRetry?: () => void;
}

export function DsError({ message, onRetry }: DsErrorProps) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>{message}</Text>
      {onRetry && (
        <DsButton variant="outline" onPress={onRetry} style={styles.errorButton}>
          Tentar novamente
        </DsButton>
      )}
    </View>
  );
}

/** Toggle de acessibilidade (switch) */
export interface DsToggleProps {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onPress: () => void;
}

export function DsToggle({ checked, disabled = false, label, onPress }: DsToggleProps) {
  return (
    <TouchableOpacity
      accessibilityRole="switch"
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      style={styles.toggleRow}
      onPress={onPress}
    >
      <View style={[styles.toggleTrack, checked && styles.toggleOn]}>
        <View style={[styles.toggleThumb, checked && { alignSelf: "flex-end" }]} />
      </View>
      <Text style={[styles.toggleLabel, disabled && styles.disabledText]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Botão
  button: {
    borderRadius: 12,
    overflow: "hidden",
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  loading: {
    position: "absolute",
    left: 10,
  },
  disabled: {
    opacity: 0.55,
  },

  // Campo de busca
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    minHeight: 52,
  },
  searchError: {
    borderColor: colors.danger,
  },
  searchInput: {
    flex: 1,
    minHeight: 52,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 10,
    paddingRight: 8,
  },
  searchInputError: {
    color: colors.danger,
  },
  clearButton: {
    padding: 4,
  },
  clearText: {
    color: colors.textMuted,
    fontSize: 18,
    fontWeight: "700",
  },

  // Card
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
  },
  cardElevated: {
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },

  // Chip
  chip: {
    minHeight: 44,
    paddingHorizontal: 14,
    justifyContent: "center",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  chipTextSelected: {
    color: "#ffffff",
  },

  // Seção
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  sectionContent: {},

  // Textos
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 4,
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

  // Estado vazio
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },
  emptyMessage: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    paddingHorizontal: 32,
    lineHeight: 20,
  },
  emptyAction: {
    alignSelf: "center",
    marginTop: 8,
  },

  // Carregamento
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 10,
  },
  loadingText: {
    fontSize: 15,
    color: colors.textMuted,
  },

  // Erro
  errorContainer: {
    padding: 20,
    gap: 12,
    alignItems: "center",
  },
  errorTitle: {
    fontSize: 15,
    color: colors.text,
    textAlign: "center",
    fontWeight: "600",
  },
  errorButton: {
    alignSelf: "center",
  },

  // Toggle
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 44,
  },
  toggleTrack: {
    width: 38,
    height: 24,
    borderRadius: 12,
    padding: 3,
    backgroundColor: "#68776e",
  },
  toggleOn: {
    backgroundColor: colors.primary,
  },
  toggleThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "white",
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  disabledText: {
    color: colors.textMuted,
  },
});