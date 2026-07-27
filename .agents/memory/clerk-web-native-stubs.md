---
name: Clerk web native stubs
description: How to stub @clerk/expo TurboModuleRegistry calls for the Expo web bundle
---

**Problem:** `@clerk/expo` ships `NativeClerkModule.js` and `NativeClerkGoogleSignIn.js` that call `TurboModuleRegistry.get(...)` at module initialization level. `TurboModuleRegistry` is undefined in react-native-web, crashing the Expo web bundle with "Cannot read properties of undefined (reading 'get')".

**Why simple module-name interception fails:** With `unstable_enablePackageExports = true` in `metro.config.js`, Metro resolves @clerk/expo's internal imports through a different code path that doesn't respect a pre-resolution `moduleName.endsWith(...)` check in `resolveRequest`.

**Correct fix:** Intercept by RESOLVED file path, not by module name:

```js
const resolved = context.resolveRequest(context, moduleName, platform);
if (
  platform === "web" &&
  resolved?.type === "sourceFile" &&
  resolved?.filePath?.includes("@clerk/expo") &&
  resolved?.filePath?.includes("NativeClerk") &&
  !resolved?.filePath?.endsWith(".web.js")
) {
  return { filePath: clerkNativeWebShim, type: "sourceFile" };
}
return resolved;
```

The stub (`shims/clerk-native-web.js`) just exports `null`:
```js
module.exports = null;
```

**Why:** `NativeClerkModule` already ships a `.web.js` null stub, but Metro with `unstable_enablePackageExports` bypasses the platform-extension fallback for package-internal imports. `NativeClerkGoogleSignIn` has no `.web.js` at all. Both must be caught.

**How to apply:** Any time `@clerk/expo` is in the dependency tree and the app targets web. The shim lives at `artifacts/menashe-mobile/shims/clerk-native-web.js` and the interceptor is in `metro.config.js`.

**Also note:** Do NOT add `resolver.alias = { "@": path.resolve(__dirname) }` — it interferes with Expo Router's `require.context` scanning. Expo SDK 54's `getDefaultConfig()` handles tsconfig `@/*` paths automatically.
