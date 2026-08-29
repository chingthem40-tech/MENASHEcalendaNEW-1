import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { shortcutPageFromPath } from "./appRoutes";

test("manifest shortcuts resolve to their intended app pages", async () => {
  const manifest = JSON.parse(
    await readFile(new URL("../../public/manifest.json", import.meta.url), "utf8"),
  ) as {
    shortcuts: Array<{ name: string; url: string }>;
  };
  const shortcutUrls = Object.fromEntries(
    manifest.shortcuts.map((shortcut) => [shortcut.name, shortcut.url]),
  );

  assert.equal(shortcutUrls.Zmanim, "/zmanim");
  assert.equal(shortcutUrls.Calendar, "/calendar");
  assert.equal(shortcutPageFromPath(shortcutUrls.Zmanim), "zmanim");
  assert.equal(shortcutPageFromPath(shortcutUrls.Calendar), "calendar");
});