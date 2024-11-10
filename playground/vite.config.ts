import react from '@vitejs/plugin-react'
import jsxDirective from '@vue-macros/jsx-directive/vite'
import jsxMacros from '@vue-macros/jsx-macros/vite'
import { defineConfig } from 'vite'
import Inspect from 'vite-plugin-inspect'

export default defineConfig({
  plugins: [
    jsxMacros({
      lib: 'react',
    }),
    jsxDirective(),
    react(),
    Inspect(),
  ],
})
