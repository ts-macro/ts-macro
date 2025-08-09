import process from 'node:process'
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts', 'src/options.ts'],
  format: ['cjs', 'esm'],
  minify: !process.env.DEV,
  watch: !!process.env.DEV,
  dts: !process.env.DEV,
  shims: true,
})
