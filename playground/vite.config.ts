import reactivityFunction from 'unplugin-vue-reactivity-function/vite'
import { defineConfig } from 'vite'
import Inspect from 'vite-plugin-inspect'
import vueJsxVapor from 'vue-jsx-vapor/vite'

export default defineConfig({
  plugins: [
    vueJsxVapor({
      macros: true,
    }),
    reactivityFunction({
      ignore: ['$fetch'],
    }),
    Inspect(),
  ],
})
