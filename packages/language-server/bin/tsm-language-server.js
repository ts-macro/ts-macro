#!/usr/bin/env node
if (require("node:process").argv.includes("--version")) {
  const pkgJSON = require("../package.json");
  // eslint-disable-next-line no-console
  console.log(String(pkgJSON.version));
} else {
  require("../out/index.js");
}
