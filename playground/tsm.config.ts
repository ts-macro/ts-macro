import jsxDirective from '@vue-macros/volar/jsx-directive'
import jsxMacros from '@vue-macros/volar/jsx-macros'
import jsxRef from '@vue-macros/volar/jsx-ref'

export default {
  plugins: [jsxRef(), jsxMacros(), jsxDirective()],
}
