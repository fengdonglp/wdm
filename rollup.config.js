import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import ts from 'rollup-plugin-typescript2';
import { DEFAULT_EXTENSIONS } from '@babel/core';
import babel from 'rollup-plugin-babel';
import postcss from 'rollup-plugin-postcss';
import autoprefixer from 'autoprefixer';
import { terser } from "rollup-plugin-terser";

const isPro = process.env.NODE_ENV === 'production';

export default {
  input: './src/index.ts',
  output: [
    {
      file: `dist/wdm${isPro ? '.min' : ''}.js`,
      name: 'Wdm',
      format: 'umd'
    }
  ],
  plugins: [
    postcss({
      extract: true,
      minimize: isPro,
      plugins: [
        autoprefixer
      ]
    }),
  
    nodeResolve({
      mainFields: ['module', 'main']
    }),

    commonjs({
      include: './node_modules/**'
    }),

    ts({
      tsconfig: './tsconfig.json'
    }),

    babel({
      extensions: [
        ...DEFAULT_EXTENSIONS,
        '.ts',
        '.tsx'
      ],
      runtimeHelpers: true,
      babelrc: true
    }),

    isPro ? terser({
      include: [/^.+\.min\.js$/]
    }) : {}
  ]
}