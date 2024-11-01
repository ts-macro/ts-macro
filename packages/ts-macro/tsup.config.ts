import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  minify: false,
  splitting: true,
  clean: true,
  dts: true,
  shims: true,
})
