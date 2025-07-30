#!/usr/bin/env node
import { argv } from 'node:process'

if (argv.includes('--version')) {
  const { default: pkgJSON } = await import('../package.json', {
    with: { type: 'json' },
  })
  // eslint-disable-next-line no-console
  console.log(String(pkgJSON.version))
} else {
  await import('../dist/index.js')
}
