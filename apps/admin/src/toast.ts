import { createContext, useContext } from "react";

export type ToastKind = "ok" | "erro" | "info";

export type ToastFn = (mensagem: string, kind?: ToastKind) => void;

export const ToastContext = createContext<ToastFn>(() => undefined);

export function useToast() {
  return useContext(ToastContext);
}
