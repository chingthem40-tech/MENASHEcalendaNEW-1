const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

config.resolver.unstable_enablePackageExports = true;

// @hebcal/noaa@0.11.0 ships only pure ESM (export class + top-level await import).
// Metro does not Babel-transform node_modules by default, so the raw ESM goes
// directly to Terser during production builds and fails with "Unexpected token".
// The fix: intercept @hebcal/noaa resolution and point it at a pre-compiled
// CJS shim (generated once via Babel — see shims/hebcal-noaa-cjs.js).
const noaaShim = path.resolve(__dirname, "shims/hebcal-noaa-cjs.js");
// @clerk/expo NativeClerkModule uses TurboModuleRegistry which is React Native
// native-only — it doesn't exist in the browser. Return null stub on web.
const clerkNativeWebShim = path.resolve(__dirname, "shims/clerk-native-web.js");

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "@hebcal/noaa") {
    return { filePath: noaaShim, type: "sourceFile" };
  }
  // Resolve first, then check the resulting file path.
  // Clerk native specs (NativeClerkModule.js, NativeClerkGoogleSignIn.js) call
  // TurboModuleRegistry.get() at module-init level. TurboModuleRegistry is
  // undefined in react-native-web, crashing the web bundle. Intercept the RESOLVED
  // path (not the raw module name) so this works even when unstable_enablePackageExports
  // is on and @clerk/expo resolves its internals through the package exports field.
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
};

module.exports = config;
