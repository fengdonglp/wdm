import nodeResolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import ts from 'rollup-plugin-typescript2'

export default {
  input: './src/index.ts',
  output: {
    file: 'dist/wdm.js',
    name: 'wdm',
    format: 'umd'
  },
  plugins: [
    nodeResolve({
      mainFields: ['module', 'main']
    }),

    commonjs({
      include: './node_modules/**'
    }),

    ts({
      tsconfig: './tsconfig.json'
    })
  ]
}