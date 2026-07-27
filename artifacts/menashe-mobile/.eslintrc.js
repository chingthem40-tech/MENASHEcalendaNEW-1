module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
  settings: {
    react: { version: "detect" },
  },
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  plugins: ["@typescript-eslint", "react", "react-hooks", "react-native"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
  ],
  rules: {
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    "react-native/no-unused-styles": "warn",
    "react-native/no-inline-styles": "warn",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",

    // ── Rules disabled / downgraded for pre-existing codebase ───────────────
    // react/no-unescaped-entities: DOM-only rule, irrelevant in React Native
    // (RN renders to native views, not HTML — " vs &quot; doesn't apply)
    "react/no-unescaped-entities": "off",
    // Downgrade to warn rather than error — these exist throughout the codebase
    "no-empty": "warn",
    "no-constant-condition": "warn",

    // ── MMDL StyleSheet guard ────────────────────────────────────────────────
    // useThemeTokens() returns reactive values (sp, rd, type) available only
    // inside a component body. StyleSheet.create() runs at MODULE LOAD TIME —
    // before any hook executes — so using hook tokens there crashes with
    // "sp is not defined". Flag all three MMDL token families.
    //
    // Also ban legacy design constants (RADIUS, TEXT, SPACE) inside
    // StyleSheet.create() — these were the pre-MMDL constants replaced by
    // numeric literals during the MEP-002/003 migration.
    "no-restricted-syntax": [
      "error",
      {
        selector:
          "CallExpression[callee.object.name='StyleSheet'][callee.property.name='create'] MemberExpression[object.name='sp']",
        message:
          "MMDL guard: sp[n] cannot be used in StyleSheet.create() — it is a hook value. Use the numeric literal instead (sp[1]=4, sp[2]=8, sp[3]=12, sp[4]=16, sp[5]=20, sp[6]=24, sp[8]=32).",
      },
      {
        selector:
          "CallExpression[callee.object.name='StyleSheet'][callee.property.name='create'] MemberExpression[object.name='rd']",
        message:
          "MMDL guard: rd[n] cannot be used in StyleSheet.create() — it is a hook value. Use a numeric literal or move the style to an inline prop.",
      },
      {
        selector:
          "CallExpression[callee.object.name='StyleSheet'][callee.property.name='create'] MemberExpression[object.name='type']",
        message:
          "MMDL guard: type.* cannot be used in StyleSheet.create() — it is a hook value. Spread type tokens in inline JSX styles instead.",
      },
      {
        selector:
          "CallExpression[callee.object.name='StyleSheet'][callee.property.name='create'] MemberExpression[object.name='RADIUS']",
        message:
          "Legacy token: RADIUS.* is banned inside StyleSheet.create(). Use a numeric literal (RADIUS.sm=6, RADIUS.md=10, RADIUS.lg=14, RADIUS.xl=20, RADIUS.full=9999).",
      },
      {
        selector:
          "CallExpression[callee.object.name='StyleSheet'][callee.property.name='create'] MemberExpression[object.name='TEXT']",
        message:
          "Legacy token: TEXT.* is banned inside StyleSheet.create(). Use a numeric literal (TEXT.xs=11, TEXT.sm=13, TEXT.base=15, TEXT.md=17, TEXT.lg=20, TEXT['2xl']=24, TEXT['3xl']=34).",
      },
      {
        selector:
          "CallExpression[callee.object.name='StyleSheet'][callee.property.name='create'] MemberExpression[object.name='SPACE']",
        message:
          "Legacy token: SPACE[n] is banned inside StyleSheet.create(). Use a numeric literal or sp[n] in an inline JSX style.",
      },
    ],

    // ── Ban legacy useColors() hook ──────────────────────────────────────────
    // useColors() is replaced by useThemeTokens(). Any new file importing it
    // will cause a lint error pointing to the correct replacement.
    "no-restricted-imports": [
      "error",
      {
        paths: [
          {
            name: "@/src/mobile/design-system",
            importNames: ["useColors"],
            message: "useColors() is deprecated. Use useThemeTokens() instead: const { colors } = useThemeTokens().",
          },
        ],
      },
    ],
  },
  ignorePatterns: ["node_modules/", "dist/", ".expo/", "scripts/", "server/", "*.config.js", "babel.config.js", "metro.config.js"],
};
