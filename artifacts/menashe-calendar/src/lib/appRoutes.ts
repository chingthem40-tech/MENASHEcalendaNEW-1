export type ShortcutPage = "home" | "calendar" | "zmanim";

export function shortcutPageFromPath(pathname: string): ShortcutPage {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  if (normalized === "/calendar") return "calendar";
  if (normalized === "/zmanim") return "zmanim";
  return "home";
}