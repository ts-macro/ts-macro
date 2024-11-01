// scoped is false
defineStyle.stylus(`
  font-size = 14px

  body
    font font-size Arial, sans-serif
`)

export function Comp({ color = 'red' }) {
  // scoped is true.
  defineStyle.scss(`
    .foo {
      div {
        color: ${color};
      }
    }
  `)

  // css modules
  const { foo } = defineStyle.scss(`
    .foo { 
      div {
        color: red;
      }
    }
  `)

  return <div className={foo} />
}
