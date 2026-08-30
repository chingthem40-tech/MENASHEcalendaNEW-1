const FIBER_NATIVE_PEERS = [
  "expo",
  "expo-asset",
  "expo-file-system",
  "expo-gl",
  "react-native",
];

module.exports = {
  hooks: {
    readPackage(pkg) {
      if (pkg.name !== "@react-three/fiber" || !pkg.version?.startsWith("9.")) {
        return pkg;
      }

      for (const peer of FIBER_NATIVE_PEERS) {
        delete pkg.peerDependencies?.[peer];
        delete pkg.peerDependenciesMeta?.[peer];
      }

      return pkg;
    },
  },
};