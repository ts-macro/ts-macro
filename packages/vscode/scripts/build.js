require('esbuild')
  .context({
    entryPoints: {
      client: './src/extension.ts',
      server:
        './node_modules/@ts-macro/language-server/bin/tsm-language-server.js',
    },
    bundle: true,
    metafile: require('node:process').argv.includes('--metafile'),
    outdir: './dist',
    external: ['vscode'],
    format: 'cjs',
    platform: 'node',
    tsconfig: './tsconfig.json',
    define: { 'process.env.NODE_ENV': '"production"' },
    minify: require('node:process').argv.includes('--minify'),
    plugins: [
      {
        name: 'umd2esm',
        setup(build) {
          build.onResolve(
            { filter: /^(vscode-.*-languageservice|jsonc-parser)/ },
            (args) => {
              const pathUmdMay = require.resolve(args.path, {
                paths: [args.resolveDir],
              })
              // Call twice the replace is to solve the problem of the path in Windows
              const pathEsm = pathUmdMay
                .replace('/umd/', '/esm/')
                .replace('\\umd\\', '\\esm\\')
              return { path: pathEsm }
            },
          )
        },
      },
    ],
  })
  .then(async (ctx) => {
    console.log('building...')
    if (require('node:process').argv.includes('--watch')) {
      await ctx.watch()
      console.log('watching...')
    } else {
      await ctx.rebuild()
      await ctx.dispose()
      console.log('finished.')
    }
  })
