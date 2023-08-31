const babel = require('@rollup/plugin-babel');
const commonjs = require('@rollup/plugin-commonjs');
const nodeResolve = require('@rollup/plugin-node-resolve');
const replace = require('@rollup/plugin-replace');
const fs = require('fs/promises');

module.exports = {
  input: 'src/main.js',
  output: {
    file: 'dist/Pluralchum.plugin.js',
    format: 'cjs',
    banner: fs.readFile('src/header.js'),
  },
  external: ['react'],
  plugins: [
    nodeResolve(),
    babel({ babelHelpers: 'bundled' }),
    commonjs(),
    replace({ preventAssignment: false, delimiters: ['', ''], values: { "require('react')": 'BdApi.React' } }),
  ],
};
