import { useContext } from "react";
import colors from "@/constants/colors";
import { AppContext } from "@/context/AppContext";

/**
 * Returns the design tokens for the current theme.
 * Theme is stored in AppContext and persisted via AsyncStorage.
 * Falls back to "dark" palette if context is not yet available.
 */
export function useColors() {
  const ctx = useContext(AppContext);
  const theme = ctx?.theme ?? "dark";
  const palette = (colors as any)[theme] ?? colors.dark;
  return { ...palette, radius: colors.radius };
}
