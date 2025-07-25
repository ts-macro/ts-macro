import process from 'node:process'
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  splitting: true,
  minify: !process.env.DEV,
  watch: !!process.env.DEV,
  dts: !process.env.DEV,
  shims: true,
})
