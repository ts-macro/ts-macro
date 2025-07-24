export declare function useRef<T>(value?: T): { value: T }
declare function $fetch<T>(url?: string): T

export const ReactivityFunction = () => {
  const foo = $useRef<string>()
  const data = $fetch<string>()
  return (
    <div>
      {foo}
      {data}
    </div>
  )
}
