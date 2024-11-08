import { useRef } from 'react'
import { DefineExpose } from './define-export'
import { DefineSlots } from './define-slots'

export const App = () => {
  const exposeRef = useRef()
  return (
    <>
      <DefineExpose ref={(e) => (exposeRef.current = e)} foo={1 as const} />

      <div v-if={exposeRef.current}>{exposeRef.current.foo === 1}</div>

      <div v-for={index in 4}>{index}</div>

      <DefineSlots<'1'>>
        <template v-slot:default={{ foo }}>{foo === '1'}</template>
        <template v-slot:title={{ bar }}>{bar === '1'}</template>
      </DefineSlots>
    </>
  )
}
