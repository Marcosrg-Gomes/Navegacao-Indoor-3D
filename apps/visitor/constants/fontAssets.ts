/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Apenas os quatro pesos usados. Importar o índice do pacote empacotaria as
 * 16 variações (~2,9 MB) no app e no build web.
 */
export const plexFontAssets = {
  IBMPlexSans_400Regular: require("@expo-google-fonts/ibm-plex-sans/IBMPlexSans_400Regular.ttf"),
  IBMPlexSans_500Medium: require("@expo-google-fonts/ibm-plex-sans/IBMPlexSans_500Medium.ttf"),
  IBMPlexSans_600SemiBold: require("@expo-google-fonts/ibm-plex-sans/IBMPlexSans_600SemiBold.ttf"),
  IBMPlexSans_700Bold: require("@expo-google-fonts/ibm-plex-sans/IBMPlexSans_700Bold.ttf"),
} as const;
