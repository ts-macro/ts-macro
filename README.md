<p align="center">
  <img src="./packages/vscode/assets/logo.png" width="300px" />
</p>

# TS Macro

<a href="https://npmjs.com/package/ts-macro">
  <img src="https://img.shields.io/npm/v/ts-macro.svg" alt="NPM version">
</a>

This is a VSCode plugin for define TS(X) macro powered by [Volar.js](https://github.com/volarjs/volar.js).

## Usage

1. Install [VSCode Plugin](https://marketplace.visualstudio.com/items?itemName=zhiyuanzmj.vscode-ts-macro)
2. Create `tsm.config.ts` at the same level of `tsconfig.json` .
3. Writing your first plugin.

    ```ts
    export default {
      plugins: [
        {
          name: 'ts-macro-define-style',
          resolveVirtualCode({ codes }){
            // declare the `defineStyle` function type for your every TS(X) files.
            codes.push('declare function defineStyle<T>(style: string): T ')
          }
        }
      ]
    }
    ```
    
    Or You can use `createPlugin` to define plugin.

    ```ts
    // tsm.config.ts
    import { createPlugin, replaceRange } from 'ts-macro'
    
    const defineStylePlugin = createPlugin<{ macro: string }>(
      ({ ts, compilerOptions }, userOptions
    ) => {
      return {
        name: 'ts-macro-define-style',
        resolveVirtualCode({ ast, codes }){
          codes.push(`declare function ${userOptions.macro}<T>(style: string): T `)
    
          ts.forEachChild(ast, walk)
    
          function walk(
            node: import('typescript').Node,
            parent: import('typescript').Node,
          ) {
            if (
              ts.isCallExpression(node) &&
              node.expression.getText(ast).startsWith(userOptions.macro)
            ) {
              // Find the defineStyle's generic position, Add the custom type.
              replaceRange(
                codes,
                node.arguments.pos - 1,
                node.arguments.pos - 1,
                '<{ foo: string }>',
              )
            }
      
            ts.forEachChild(node, (child) => {
              walk(child, node)
            })
          }
        }
      }
    })
    
    export default {
      plugins: [
        defineStylePlugin({
          macro: 'defineStyle'
        })
      ]
    }
    ```

4. Result
    
   <img width="369" alt="image" src="https://github.com/user-attachments/assets/31578a94-fd0d-4f7d-836d-87d83b8e9bbc">

## Example

https://github.com/ts-macro/ts-macro/blob/main/playground

## TSC

Use `tsmc` instead of `tsc` to compile TS.

Install

```sh
pnpm add @ts-macro/tsc -D
```

Usage in package.json.

```json
{
  "scripts": {
    "typecheck": "tsmc --onEmit"
  }
}
```

## References

Thanks for these great projects, I have learned a lot from them.

- https://github.com/volarjs/volar.js
- https://github.com/vue-vine/vue-vine
- https://kermanx.github.io/reactive-vscode
- https://github.com/vue-macros/vue-macros
