import vueJsxVapor from 'vue-jsx-vapor/volar'

export default {
  include: ['src/**/*'],
  plugins: [
    vueJsxVapor({
      macros: true,
    }),
  ],
}
