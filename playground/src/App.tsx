// eslint-disable-next-line import/no-default-export
export default () => {
  let count = 1

  return () => (
    <>
      <button onClick={() => count++}>+</button>
      <button onClick={() => count--}>-</button>

      <div v-if={count === 1}>{count}</div>
    </>
  )
}
