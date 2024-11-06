import { createRequire } from 'node:module'
import process from 'node:process'
import { defineConfig } from 'tsup'

const require = createRequire(import.meta.url)

export default defineConfig([
  {
    entry: {
      'dist/client': './src/extension.ts',
      'dist/server':
        './node_modules/@ts-macro/language-server/bin/tsm-language-server.js',
      'node_modules/tsm-typescript-plugin/index':
        './node_modules/@ts-macro/typescript-plugin/dist/index.js',
    },
    outDir: '.',
    format: 'cjs',
    external: ['vscode'],
    minify: process.argv.includes('--minify'),
    bundle: true,
    shims: true,
    define: { 'process.env.NODE_ENV': '"production"' },
    esbuildPlugins: [
      {
        name: 'umd2esm',
        setup(build) {
          build.onResolve({ filter: /^(vscode-.*|jsonc-parser)/ }, (args) => {
            const pathUmdMay = require.resolve(args.path, {
              paths: [args.resolveDir],
            })
            // Call twice the replace is to solve the problem of the path in Windows
            const pathEsm = pathUmdMay
              .replace('/umd/', '/esm/')
              .replace('\\umd\\', '\\esm\\')

            return { path: pathEsm }
          })
        },
      },
    ],
  },
])
