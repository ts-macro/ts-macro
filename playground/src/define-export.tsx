import { useRef } from 'react'

export const DefineExpose = <T,>({ foo = {} as T }) => {
  const aRef = useRef()
  defineExpose({
    foo,
    aRef,
  })
  return (
    <div>
      <a ref={(e) => (aRef.current = e)} />
    </div>
  )
}
