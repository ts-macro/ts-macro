import { useEffect, useRef, useState } from 'react'
import { DefineExpose } from './define-expose'
import { DefineSlots } from './define-slots'

// eslint-disable-next-line import/no-default-export
export default () => {
  const exposeRef = useRef()
  const [double, setDouble] = useState<number>()
  useEffect(() => {
    setDouble(exposeRef.current?.double)
  })
  return (
    <>
      <DefineExpose ref={(e) => (exposeRef.current = e)} foo={1 as const} />
      {double}

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
