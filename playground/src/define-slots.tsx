export const DefineSlots = <T extends string>({ foo = {} as T }) => {
  const slots = defineSlots({
    default: (props: { foo: T }) => <div>default slot: {props.foo}</div>,
    title: (props: { bar: T }) => <div>title slot: {props.bar}</div>,
  })
  return (
    <div>
      <slots.title bar={foo} />
      <slots.default foo={foo} />
    </div>
  )
}
