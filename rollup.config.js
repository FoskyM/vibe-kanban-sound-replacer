import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import metablock from 'rollup-plugin-userscript-metablock';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

export default {
  input: 'src/index.ts',
  output: {
    file: 'dist/vibe-kanban-sound-replacer.user.js',
    format: 'iife',
    sourcemap: false
  },
  plugins: [
    resolve(),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json'
    }),
    metablock({
      file: './src/meta.json',
      override: {
        version: pkg.version,
        author: pkg.author
      }
    })
  ]
};
