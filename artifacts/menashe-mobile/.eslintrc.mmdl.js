/**
 * Focused MMDL StyleSheet guard config — used by the production build gate.
 * Only enforces the three hook-token-in-StyleSheet rules; nothing else.
 * Run via: pnpm lint:mmdl
 */
module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
  // Plugins declared so inline eslint-disable comments in source files
  // (e.g. // eslint-disable-next-line @typescript-eslint/no-var-requires)
  // resolve without "definition for rule X was not found" errors.
  // No rules from these plugins are enforced in this config.
  plugins: ["@typescript-eslint", "react-hooks", "react"],
  rules: {
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
          "MMDL guard: rd.* cannot be used in StyleSheet.create() — it is a hook value. Use a numeric literal instead (rd.xs=4, rd.sm=8, rd.md=12, rd.lg=16, rd.xl=20).",
      },
      {
        selector:
          "CallExpression[callee.object.name='StyleSheet'][callee.property.name='create'] MemberExpression[object.name='type']",
        message:
          "MMDL guard: type.* cannot be used in StyleSheet.create() — it is a hook value. Spread type tokens in inline JSX styles instead.",
      },
    ],
  },
};
