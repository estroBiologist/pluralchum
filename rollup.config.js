const babel = require("@rollup/plugin-babel");
const commonjs = require("@rollup/plugin-commonjs");
const fs = require("fs/promises");

module.exports = {
  input: "src/main.js",
  output: {
    file: "dist/Pluralchum.plugin.js",
    format: "cjs",
    banner: fs.readFile("src/header.js"),
  },
  plugins: [babel({ babelHelpers: "bundled" }), commonjs()],
};
