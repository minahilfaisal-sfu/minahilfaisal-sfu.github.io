// Copies the single-file build into the website's explainer/ folder,
// which header.js loads on every page.
import { copyFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const dist = join(here, '..', 'dist')
// projects/iat-806/project/explainer/scripts -> website root
const siteFolder = join(here, '..', '..', '..', '..', '..', 'explainer')

if (!existsSync(siteFolder)) {
  process.stderr.write(`Website folder not found: ${siteFolder}\n`)
  process.exit(1)
}
for (const file of ['explainer.iife.js', 'explainer.iife.js.map']) {
  copyFileSync(join(dist, file), join(siteFolder, file))
  process.stdout.write(`Copied ${file} -> ${siteFolder}\n`)
}
