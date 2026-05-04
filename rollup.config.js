import nodeResolve from '@rollup/plugin-node-resolve';
import css from 'rollup-plugin-import-css';
import replace from '@rollup/plugin-replace';
import fs from 'fs/promises';
import image from '@rollup/plugin-image';
import svgr from '@svgr/rollup';
import { env } from 'node:process';

export default {
  input: 'src/main.js',
  output: {
    file: 'dist/Pluralchum.plugin.js',
    format: 'cjs',
    banner: fs.readFile('src/header.js', { encoding: 'utf8' }),
  },
  jsx: {
    mode: 'classic',
  },
  plugins: [
    nodeResolve(),
    css(),
    image({ exclude: '**.svg' }),
    svgr({ icon: true, jsxRuntime: 'automatic' }),
    replace({
      preventAssignment: true,
      values: { npm_package_version: JSON.stringify(env.npm_package_version) },
    }),
  ],
};
