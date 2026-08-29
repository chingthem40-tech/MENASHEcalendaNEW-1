import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

test("an uncached offline deep link falls back to the cached app shell", async () => {
  const source = await readFile(
    new URL("../../public/sw.js", import.meta.url),
    "utf8",
  );
  const listeners = new Map<string, (event: any) => void>();
  const shell = new Response("<html>cached app shell</html>", {
    headers: { "Content-Type": "text/html" },
  });
  const caches = {
    open: async () => ({
      addAll: async () => undefined,
      match: async () => undefined,
      put: async () => undefined,
    }),
    keys: async () => [],
    delete: async () => true,
    match: async (request: string | { url?: string }) => {
      const value = typeof request === "string" ? request : request.url ?? "";
      return value === "/" ? shell.clone() : undefined;
    },
  };
  const clients = {
    claim: async () => undefined,
    matchAll: async () => [],
    openWindow: async () => undefined,
  };
  const self = {
    location: { origin: "https://calendar.example", protocol: "https:" },
    clients,
    skipWaiting: () => undefined,
    registration: { showNotification: async () => undefined },
    addEventListener: (name: string, listener: (event: any) => void) => {
      listeners.set(name, listener);
    },
  };
  vm.runInNewContext(source, {
    self,
    clients,
    caches,
    fetch: async () => {
      throw new Error("offline");
    },
    URL,
    Response,
  });

  let responsePromise: Promise<Response> | undefined;
  listeners.get("fetch")?.({
    request: {
      method: "GET",
      mode: "navigate",
      url: "https://calendar.example/never-before-visited",
    },
    respondWith(value: Promise<Response>) {
      responsePromise = value;
    },
  });

  assert.ok(responsePromise);
  assert.equal(await (await responsePromise).text(), "<html>cached app shell</html>");
});

test("the production service worker has an explicit precached shell fallback", async () => {
  const source = await readFile(new URL("../sw.ts", import.meta.url), "utf8");
  assert.match(source, /setCatchHandler/);
  assert.match(source, /request\.mode === "navigate"/);
  assert.match(source, /matchPrecache\("index\.html"\)/);
});