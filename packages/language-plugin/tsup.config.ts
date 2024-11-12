import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  splitting: true,
  clean: true,
  dts: true,
  shims: true,
})
