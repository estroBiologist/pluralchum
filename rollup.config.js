import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import css from 'rollup-plugin-import-css';
import replace from '@rollup/plugin-replace';
import fs from 'fs/promises';
import image from '@rollup/plugin-image';

export default {
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
    css(),
    image(),
    commonjs(),
    replace({ preventAssignment: false, delimiters: ['', ''], values: { "require('react')": 'BdApi.React' } }),
  ],
};
