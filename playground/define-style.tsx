type DefineStyle = (style: string, options?: { scoped: boolean }) => void;
declare const defineStyle: {
  (style: string): void;
  scss: DefineStyle;
  sass: DefineStyle;
  stylus: DefineStyle;
  less: DefineStyle;
  postcss: DefineStyle;
};

// scoped is false
defineStyle.stylus(`
  font-size = 14px

  body
    font font-size Arial, sans-serif
`);

export function Comp() {
  const color = "red";
  // scoped is true.
  defineStyle.scss(`
    .foo {
      div {
        color: ${color};
      }
    }
  `);

  return null;
}
