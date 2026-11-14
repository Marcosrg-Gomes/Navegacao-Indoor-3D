import { forwardRef } from "react";
import { Text as RNText, TextInput as RNTextInput, type TextInputProps, type TextProps } from "react-native";
import { nativeFontStyle } from "@/constants/typography";

/**
 * Text/TextInput do app: mesmos props do React Native, com IBM Plex Sans no
 * peso correto em Android/iOS (ver constants/typography.ts).
 */
export const Text = forwardRef<RNText, TextProps>(function AppText({ style, ...props }, ref) {
  return <RNText ref={ref} {...props} style={nativeFontStyle(style)} />;
});
export type Text = RNText;

export const TextInput = forwardRef<RNTextInput, TextInputProps>(function AppTextInput({ style, ...props }, ref) {
  return <RNTextInput ref={ref} {...props} style={nativeFontStyle(style)} />;
});
export type TextInput = RNTextInput;
