import template from "rollup-plugin-html-literals";
import typescript from 'rollup-plugin-typescript2'
import resolve from '@rollup/plugin-node-resolve'
import postcss from 'rollup-plugin-postcss'
import litcss from 'rollup-plugin-postcss-lit'
import terser from '@rollup/plugin-terser'

export default {
  input: 'src/chat.ts',
  output: {
    dir: 'dist',
    format: 'iife',
  },
  plugins: [
    template(),
    resolve({
      browser: true,
    }),
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