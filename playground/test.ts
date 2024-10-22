declare function defineStyle(css: string): void;

function zmj(){
  let color = 1;

  defineStyle(`
    div {
      color: ${color};
    };
    .foo { color: red }
  `);
}
