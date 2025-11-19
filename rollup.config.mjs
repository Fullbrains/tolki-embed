import template from "rollup-plugin-html-literals";
import typescript from 'rollup-plugin-typescript2'
import resolve from '@rollup/plugin-node-resolve'
import postcss from 'rollup-plugin-postcss'
import postcssImport from 'postcss-import'
import postcssNested from 'postcss-nested'
import postcssRootToHost from './postcss-root-to-host.cjs'
import litcss from 'rollup-plugin-postcss-lit'
import terser from '@rollup/plugin-terser'
import commonjs from '@rollup/plugin-commonjs'

export default {
  input: 'src/components/tolki-chat/tolki-chat.ts',
  output: {
    file: 'dist/chat.js',
    format: 'iife',
    name: 'TolkiChat',
  },
  plugins: [
    template(),
    resolve({
      browser: true,
      preferBuiltins: false,
    }),
    commonjs(),
    postcss({
      plugins: [
        postcssImport(),
        postcssNested(),
        postcssRootToHost(),
      ],
      minimize: true,
      inject: false,
      extract: false,
    }),
    typescript(),
    terser({
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
      mangle: {
        properties: {
          regex: /^_/,
        },
      },
      output: {
        comments: false,
      },
    }),
  ],
}