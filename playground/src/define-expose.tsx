import { computed } from 'vue'
import { useRef } from 'vue-jsx-vapor'

export const DefineExpose = <T extends number>({ foo = {} as T }) => {
  const aRef = useRef()
  defineExpose({
    double: computed(() => foo * 2),
    aRef,
  })
  return <a ref={(e) => (aRef.value = e)}>{foo} x 2 = </a>
}
