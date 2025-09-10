import { ref, shallowRef as useRef, watchEffect } from 'vue'
import { DefineExpose } from './define-expose'
import { DefineSlots } from './define-slots'

export default () => {
  const exposeRef = useRef(null)
  const double = ref<number>()
  watchEffect(() => {
    double.value = exposeRef.value?.double.value
  })
  return (
    <>
      <DefineExpose ref={(e) => (exposeRef.value = e)} foo={1 as const} />
      <span v-if={double}>{double.value}</span>
      <div v-for={index in 4} key={index}>
        {index}
      </div>
      <DefineSlots foo={1 as const}>
        <div>default slot</div>
        <template v-slot:title={{ bar }}>title slot: {bar}</template>
      </DefineSlots>
    </>
  )
}
