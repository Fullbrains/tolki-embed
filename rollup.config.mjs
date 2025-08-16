import template from "rollup-plugin-html-literals";
import typescript from 'rollup-plugin-typescript2'
import resolve from '@rollup/plugin-node-resolve'
import postcss from 'rollup-plugin-postcss'
import litcss from 'rollup-plugin-postcss-lit'
import terser from '@rollup/plugin-terser'
import commonjs from '@rollup/plugin-commonjs'

export default {
  input: 'src/components/tolki-chat/tolki-chat.ts',
  output: {
    dir: 'dist',
    format: 'iife',
    name: 'TolkiChat',
  },
  plugins: [
    template(),
    resolve({
      browser: true,
    }),
    commonjs(),
    typescript(),
    postcss({
      minimize: true,
      inject: false,
    }),
    litcss(),
    terser({
      output: {
        comments: false,
      },
    }),
  ],
}