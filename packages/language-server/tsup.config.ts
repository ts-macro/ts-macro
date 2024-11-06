import process from 'node:process'
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  minify: process.argv.includes('--minify'),
  splitting: true,
  clean: true,
  dts: true,
})
