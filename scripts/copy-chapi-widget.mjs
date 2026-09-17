import { copyFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')

copyFileSync(
  resolve(rootDir, 'node_modules/chapi-ai/dist/widget/chapi-chat.js'),
  resolve(rootDir, 'public/chapi-chat.js'),
)
