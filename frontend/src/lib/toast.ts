import { createContext, useContext } from "react";

export type ToastTone = "success" | "error";
export type ShowToast = (message: string, tone?: ToastTone) => void;

// Filled in by <ToastProvider> (components/ToastProvider.tsx), which also draws the toasts.
export const ToastContext = createContext<ShowToast>(() => {});

// Anywhere in the app: const toast = useToast(); toast("Saved");
export const useToast = () => useContext(ToastContext);
