import template from "rollup-plugin-html-literals";
import typescript from 'rollup-plugin-typescript2'
import resolve from '@rollup/plugin-node-resolve'
import postcss from 'rollup-plugin-postcss'
import postcssImport from 'postcss-import'
import postcssNested from 'postcss-nested'
import postcssRootToHost from './postcss-root-to-host.cjs'
import terser from '@rollup/plugin-terser'
import commonjs from '@rollup/plugin-commonjs'
import serve from 'rollup-plugin-serve'
import livereload from 'rollup-plugin-livereload'

// Detect if we're in watch mode (development)
// Rollup automatically sets ROLLUP_WATCH when using --watch flag
const isDev = !!process.env.ROLLUP_WATCH

export default {
  input: 'src/components/tolki-chat/tolki-chat.ts',
  output: {
    file: 'dist/chat.js',
    format: 'iife',
    name: 'TolkiChat',
    sourcemap: isDev, // Enable sourcemaps in dev mode
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
      minimize: !isDev, // Don't minimize in dev mode
      inject: false,
      extract: false,
    }),
    typescript(),

    // Only minify in production
    !isDev && terser({
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

    // Development server with hot reload
    isDev && serve({
      open: true,
      contentBase: ['dist', '.'],
      host: 'localhost',
      port: 8080,
      openPage: '/index.html',
    }),

    // Live reload on file changes
    isDev && livereload({
      watch: 'dist',
      verbose: true,
    }),
  ].filter(Boolean), // Remove falsy plugins
}
