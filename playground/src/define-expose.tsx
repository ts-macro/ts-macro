import { useRef } from 'react'

export const DefineExpose = <T extends number>({ foo = {} as T }) => {
  const aRef = useRef()
  defineExpose({
    double: foo * 2,
    aRef,
  })
  return <a ref={(e) => (aRef.current = e)}>{foo} x 2 = </a>
}
