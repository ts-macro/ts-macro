import { createRequire } from 'node:module'
import process from 'node:process'
import { defineConfig } from 'tsdown'

const require = createRequire(import.meta.url)

export default defineConfig([
  {
    entry: {
      client: './src/extension.ts',
      server: './node_modules/@ts-macro/language-server/src/index.ts',
      '../node_modules/tsm-typescript-plugin/index':
        './node_modules/@ts-macro/typescript-plugin/src/index.ts',
    },
    format: 'cjs',
    minify: !process.env.DEV,
    watch: !!process.env.DEV,
    sourcemap: !!process.env.DEV,
    external: ['vscode'],
    shims: true,
    define: { 'process.env.NODE_ENV': '"production"' },
    plugins: [
      {
        name: 'umd2esm',
        resolveId: {
          filter: {
            id: /^(vscode-.*-languageservice|vscode-languageserver-types|jsonc-parser)$/,
          },
          handler(path, importer) {
            const pathUmdMay = require.resolve(path, { paths: [importer!] })
            // Call twice the replace is to solve the problem of the path in Windows
            let pathEsm = pathUmdMay
              .replace('/umd/', '/esm/')
              .replace('\\umd\\', '\\esm\\')

            if (pathEsm.includes('vscode-uri')) {
              pathEsm = pathEsm
                .replace('/esm/index.js', '/esm/index.mjs')
                .replace(String.raw`\esm\index.js`, String.raw`\esm\index.mjs`)
            }

            return { id: pathEsm }
          },
        },
      },
    ],
  },
])
