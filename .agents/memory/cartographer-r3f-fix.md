---
name: Cartographer breaks R3F scene files
description: @replit/vite-plugin-cartographer injects data-component-name into all JSX elements, causing R3F 9.x to throw on every frame in Three.js scene files
---

## The rule

When `@replit/vite-plugin-cartographer` is active, add an `enforce: 'post'` Vite transform plugin **after** cartographer in the plugins array to strip `data-component-name` from R3F scene files.

```ts
{
  name: "strip-r3f-cartographer-data-props",
  enforce: "post" as const,
  transform(code: string, id: string) {
    if (!id.includes("/scene/") && !id.includes("MemorialValley3D")) return;
    const cleaned = code.replace(/"data-component-name":\s*"[^"]*",?\s*/g, "");
    if (cleaned === code) return;
    return { code: cleaned, map: null };
  },
},
```

**Why:** R3F 9.x parses hyphenated prop names as nested paths: `data-component-name` → tries to set `obj.data["component-name"]`. Since `THREE.Object3D.data`, `THREE.BufferGeometry.data`, `THREE.Material.data` etc. are all `undefined`, it throws a TypeError on every render frame, crashing the 3D scene. The error looks like: `R3F: Cannot set "data-component-name". Ensure it is an object before setting "component-name"`.

Cartographer has no `exclude` option (as of v0.5.5). The plugin runs as part of the Babel pipeline via `@vitejs/plugin-react`, so a post-transform strip of the compiled output is the only reliable workaround.

**How to apply:** In `artifacts/menashe-calendar/vite.config.ts`, inside the cartographer conditional block. The regex targets the compiled JSX output (`"data-component-name": "SomeName"`) not the source JSX.
