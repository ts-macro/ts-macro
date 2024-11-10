export const DefineSlots = <T,>({ foo = (undefined as T)! }) => {
  const slots = defineSlots({
    default: () => <div>[default slot]</div>,
    title: (props: { bar: T }) => <div> [title slot]: {String(props.bar)}</div>,
  })
  return (
    <div>
      <slots.title bar={foo} />
      <slots.default />
    </div>
  )
}
