"use strict";

const realMinifier = require("/home/runner/workspace/node_modules/.pnpm/metro-minify-terser@0.83.3/node_modules/metro-minify-terser/src/index.js");

async function minifier(options) {
  const { code, config, ...rest } = options;

  const isEsm =
    /\bexport\s+(default|class|function|const|let|var|async|\{)/.test(code) ||
    /\bimport\s+/.test(code);

  const patchedConfig = isEsm
    ? {
        ...config,
        module: true,
        ecma: 2022,
        compress: { ...(config?.compress || {}), ecma: 2022 },
        output: { ...(config?.output || {}), ecma: 2022 },
      }
    : config;

  return realMinifier({ code, config: patchedConfig, ...rest });
}

module.exports = minifier;
